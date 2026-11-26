import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useState,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import { doc, getDoc } from 'firebase/firestore';
import {
  createClass,
  updateClass,
  deleteClass,
  addParticipantByEmail,
  removeParticipant,
  createSession,
  updateSession,
  deleteSession,
  openSession,
  closeSession,
  subscribeClasses,
  subscribeSessions,
  subscribeAttendanceForSession,
  subscribeAttendanceForSessionChunk,
} from '../services/firestore/assistantService';
import { chunkIds } from '../services/firestore/batching';
import { db } from '../services/firebase';
import {
  PracticalClass,
  Session,
  UserProfile,
  AttendanceRecord,
  AsyncActionResult,
  ClassInput,
  SessionInput,
} from '../domain/types';
import { useAuth } from './AuthContext';

const unauthenticated = (): {
  ok: false;
  reason: string;
  message: string;
} => ({
  ok: false,
  reason: 'unauthenticated',
  message: 'Silakan login ulang.',
});

// Shared empty result so sessions without attendance keep a stable reference.
const NO_RECORDS: AttendanceRecord[] = [];

const forbidden = (): {
  ok: false;
  reason: string;
  message: string;
} => ({
  ok: false,
  reason: 'forbidden',
  message: 'Aksi khusus asisten.',
});

// ============================================================
// AssistantSessionsViewModel — Firestore-backed (Sprint 2)
// ============================================================

export type AssistantSessionsViewModel = {
  sessions: Session[];
  getSessionById: (sessionId: string) => Session | undefined;
  getAttendanceForSession: (sessionId: string) => AttendanceRecord[];
  openSession: (sessionId: string) => Promise<AsyncActionResult>;
  closeSession: (sessionId: string) => Promise<AsyncActionResult>;
  createSession: (input: SessionInput) => Promise<AsyncActionResult<string>>;
  updateSession: (
    sessionId: string,
    input: SessionInput,
  ) => Promise<AsyncActionResult>;
  deleteSession: (sessionId: string) => Promise<AsyncActionResult>;
  addParticipantByEmail: (
    classId: string,
    email: string,
  ) => Promise<AsyncActionResult>;
  removeParticipant: (
    classId: string,
    studentUid: string,
  ) => Promise<AsyncActionResult>;
  getClassById: (classId: string) => PracticalClass | undefined;
  classes: PracticalClass[];
  studentsDirectory: UserProfile[];
  loading: boolean;
  error: string | null;
  retry: () => void;
  subscribeAttendanceForSession: (
    sessionId: string,
    onData: (records: AttendanceRecord[]) => void,
    onError: (msg: string) => void,
  ) => () => void;
  createClass: (input: ClassInput) => Promise<AsyncActionResult<string>>;
  updateClass: (
    classId: string,
    input: ClassInput,
  ) => Promise<AsyncActionResult>;
  deleteClass: (classId: string) => Promise<AsyncActionResult>;
};

// ============================================================
// Reducer Actions
// ============================================================

type AssistantAction =
  | { type: 'SET_CLASSES'; classes: PracticalClass[] }
  | { type: 'SET_SESSIONS'; sessions: Session[] }
  | { type: 'SET_STUDENTS'; students: UserProfile[] }
  | {
      type: 'SET_ATTENDANCE_BULK';
      bySession: Record<string, AttendanceRecord[]>;
    }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' };

// ============================================================
// State
// ============================================================

interface AssistantSessionsState {
  sessions: Session[];
  classes: PracticalClass[];
  studentsDirectory: UserProfile[];
  attendanceBySession: Record<string, AttendanceRecord[]>;
  loading: boolean;
  error: string | null;
}

// ============================================================
// Initial State
// ============================================================

const initialState: AssistantSessionsState = {
  sessions: [],
  classes: [],
  studentsDirectory: [],
  attendanceBySession: {},
  loading: true,
  error: null,
};

// ============================================================
// Reducer
// ============================================================

function assistantReducer(
  state: AssistantSessionsState,
  action: AssistantAction,
): AssistantSessionsState {
  switch (action.type) {
    case 'SET_CLASSES':
      return { ...state, classes: action.classes };
    case 'SET_SESSIONS':
      return { ...state, sessions: action.sessions };
    case 'SET_STUDENTS':
      return { ...state, studentsDirectory: action.students };
    case 'SET_ATTENDANCE_BULK':
      return {
        ...state,
        attendanceBySession: {
          ...state.attendanceBySession,
          ...action.bySession,
        },
      };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'RESET':
      return { ...initialState, loading: false };
    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================

const AssistantSessionsContext = createContext<
  AssistantSessionsViewModel | undefined
>(undefined);

export const AssistantSessionsProvider = ({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(assistantReducer, initialState);
  const [retryCounter, setRetryCounter] = useState(0);
  const attendanceUnsubsRef = useRef<Map<string, () => void>>(new Map());
  const studentsCacheRef = useRef<Map<string, UserProfile>>(new Map());
  const classesReadyRef = useRef(false);
  const sessionsReadyRef = useRef(false);

  // Set up real-time listeners scoped to the signed-in assistant.
  useEffect(() => {
    // Profil praktikan milik akun sebelumnya tidak boleh terbawa ke akun lain.
    studentsCacheRef.current.clear();

    if (!enabled) {
      dispatch({ type: 'RESET' });
      return;
    }

    const uid = user?.uid;
    if (!uid) {
      dispatch({ type: 'RESET' });
      return;
    }

    classesReadyRef.current = false;
    sessionsReadyRef.current = false;
    dispatch({ type: 'SET_LOADING', loading: true });
    dispatch({ type: 'SET_ERROR', error: null });

    const loadStudentsDirectory = async (classes: PracticalClass[]) => {
      const ids = new Set<string>();
      classes.forEach((c) =>
        (c.participantIds ?? []).forEach((id) => {
          if (typeof id === 'string' && id.trim()) ids.add(id.trim());
        }),
      );

      const missing = [...ids].filter(
        (id) => !studentsCacheRef.current.has(id),
      );

      try {
        await Promise.all(
          missing.map(async (studentUid) => {
            const snap = await getDoc(doc(db, 'users', studentUid));
            if (!snap.exists()) return;
            const raw = snap.data() as UserProfile;
            if (raw.role === 'student') {
              const profile: UserProfile = {
                ...raw,
                uid: raw.uid || snap.id,
              };
              studentsCacheRef.current.set(studentUid, profile);
            }
          }),
        );

        dispatch({
          type: 'SET_STUDENTS',
          students: [...studentsCacheRef.current.values()],
        });
      } catch {
        dispatch({
          type: 'SET_ERROR',
          error: 'Gagal memuat daftar praktikan.',
        });
      }
    };

    const markReady = (which: 'classes' | 'sessions') => {
      if (which === 'classes') classesReadyRef.current = true;
      else sessionsReadyRef.current = true;

      if (classesReadyRef.current && sessionsReadyRef.current) {
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    };

    const classesUnsubscribe = subscribeClasses(
      uid,
      (classes) => {
        dispatch({ type: 'SET_CLASSES', classes });
        void loadStudentsDirectory(classes);
        markReady('classes');
      },
      (msg: string) => {
        dispatch({ type: 'SET_ERROR', error: msg });
        dispatch({ type: 'SET_LOADING', loading: false });
      },
    );

    const sessionsUnsubscribe = subscribeSessions(
      uid,
      (sessions) => {
        dispatch({ type: 'SET_SESSIONS', sessions });
        markReady('sessions');
      },
      (msg: string) => {
        dispatch({ type: 'SET_ERROR', error: msg });
        dispatch({ type: 'SET_LOADING', loading: false });
      },
    );

    return () => {
      classesUnsubscribe();
      sessionsUnsubscribe();
    };
  }, [enabled, user?.uid, retryCounter]);

  const sessionIds = state.sessions.map((s) => s.id).join(',');

  // One attendance listener per chunk of up to 30 sessions instead of one per
  // session. Only chunks whose membership changed are resubscribed; each
  // snapshot updates its sessions in a single dispatch.
  useEffect(() => {
    const listeners = attendanceUnsubsRef.current;

    if (!enabled || !user?.uid) {
      listeners.forEach((unsubscribe) => unsubscribe());
      listeners.clear();
      return;
    }

    const chunks = chunkIds(sessionIds ? sessionIds.split(',') : []);
    const wanted = new Set(chunks.map((chunk) => chunk.join(',')));

    listeners.forEach((unsubscribe, key) => {
      if (!wanted.has(key)) {
        unsubscribe();
        listeners.delete(key);
      }
    });

    chunks.forEach((chunk) => {
      const key = chunk.join(',');
      if (listeners.has(key)) return;
      listeners.set(
        key,
        subscribeAttendanceForSessionChunk(
          chunk,
          (bySession) => dispatch({ type: 'SET_ATTENDANCE_BULK', bySession }),
          (msg: string) => {
            // Lepas listener yang gagal agar retry() dapat menyambung ulang.
            listeners.delete(key);
            dispatch({ type: 'SET_ERROR', error: msg });
          },
        ),
      );
    });
  }, [enabled, user?.uid, sessionIds, retryCounter]);

  // Close every attendance listener on unmount/logout.
  useEffect(() => {
    const listeners = attendanceUnsubsRef.current;
    return () => {
      listeners.forEach((unsubscribe) => unsubscribe());
      listeners.clear();
    };
  }, []);

  // O(1) lookups; rebuilt only when the snapshot data changes.
  const sessionsById = useMemo(
    () => new Map(state.sessions.map((s) => [s.id, s])),
    [state.sessions],
  );
  const classesById = useMemo(
    () => new Map(state.classes.map((c) => [c.id, c])),
    [state.classes],
  );

  const getSessionById = useCallback(
    (sessionId: string) => sessionsById.get(sessionId),
    [sessionsById],
  );

  const { attendanceBySession } = state;
  const getAttendanceForSession = useCallback(
    (sessionId: string) => attendanceBySession[sessionId] ?? NO_RECORDS,
    [attendanceBySession],
  );

  const getClassById = useCallback(
    (classId: string) => classesById.get(classId),
    [classesById],
  );

  const uid = user?.uid;

  // Service-backed actions only change when the gate (role or account)
  // changes, not on every snapshot.
  const actions = useMemo(
    () => ({
      openSession: (sessionId: string) =>
        enabled ? openSession(sessionId) : Promise.resolve(forbidden()),
      closeSession: (sessionId: string) =>
        enabled ? closeSession(sessionId) : Promise.resolve(forbidden()),
      createSession: (input: SessionInput) =>
        !enabled
          ? Promise.resolve(forbidden())
          : uid
            ? createSession(uid, input)
            : Promise.resolve(unauthenticated()),
      updateSession: (sessionId: string, input: SessionInput) =>
        enabled
          ? updateSession(sessionId, input)
          : Promise.resolve(forbidden()),
      deleteSession: (sessionId: string) =>
        enabled ? deleteSession(sessionId) : Promise.resolve(forbidden()),
      addParticipantByEmail: (classId: string, email: string) =>
        enabled
          ? addParticipantByEmail(classId, email)
          : Promise.resolve(forbidden()),
      removeParticipant: (classId: string, studentUid: string) =>
        enabled
          ? removeParticipant(classId, studentUid)
          : Promise.resolve(forbidden()),
      subscribeAttendanceForSession: (
        sessionId: string,
        onData: (records: AttendanceRecord[]) => void,
        onError: (msg: string) => void,
      ) =>
        enabled
          ? subscribeAttendanceForSession(sessionId, onData, onError)
          : () => {},
      createClass: (input: ClassInput) =>
        !enabled
          ? Promise.resolve(forbidden())
          : uid
            ? createClass(uid, input)
            : Promise.resolve(unauthenticated()),
      updateClass: (classId: string, input: ClassInput) =>
        enabled ? updateClass(classId, input) : Promise.resolve(forbidden()),
      deleteClass: (classId: string) =>
        enabled ? deleteClass(classId) : Promise.resolve(forbidden()),
      retry: () => {
        if (enabled) setRetryCounter((c) => c + 1);
      },
    }),
    [enabled, uid],
  );

  // A stable value keeps every consumer from re-rendering when the provider
  // re-renders without a data change.
  const viewModel = useMemo<AssistantSessionsViewModel>(
    () => ({
      ...state,
      ...actions,
      getSessionById,
      getAttendanceForSession,
      getClassById,
    }),
    [state, actions, getSessionById, getAttendanceForSession, getClassById],
  );

  return (
    <AssistantSessionsContext.Provider value={viewModel}>
      {children}
    </AssistantSessionsContext.Provider>
  );
};

export function useAssistantSessionsViewModel(): AssistantSessionsViewModel {
  const context = useContext(AssistantSessionsContext);

  if (!context) {
    throw new Error(
      'useAssistantSessionsViewModel must be used within an AssistantSessionsProvider',
    );
  }

  return context;
}
