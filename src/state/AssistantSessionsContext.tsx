import React, {
  createContext,
  useContext,
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
} from '../services/firestore/assistantService';
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
  updateSession: (sessionId: string, input: SessionInput) => Promise<AsyncActionResult>;
  deleteSession: (sessionId: string) => Promise<AsyncActionResult>;
  addParticipantByEmail: (classId: string, email: string) => Promise<AsyncActionResult>;
  removeParticipant: (classId: string, studentUid: string) => Promise<AsyncActionResult>;
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
  updateClass: (classId: string, input: ClassInput) => Promise<AsyncActionResult>;
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
      type: 'SET_ATTENDANCE';
      sessionId: string;
      records: AttendanceRecord[];
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
    case 'SET_ATTENDANCE':
      return {
        ...state,
        attendanceBySession: {
          ...state.attendanceBySession,
          [action.sessionId]: action.records,
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

const AssistantSessionsContext = createContext<AssistantSessionsViewModel | undefined>(
  undefined,
);

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
          if (id.trim()) ids.add(id);
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
            const profile = snap.data() as UserProfile;
            if (profile.role === 'student') {
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

  // Keep one attendance listener per session and drop listeners for
  // sessions that are no longer visible.
  useEffect(() => {
    const currentIds = sessionIds ? sessionIds.split(',') : [];
    const activeIds = new Set(currentIds);

    attendanceUnsubsRef.current.forEach((unsubscribe, id) => {
      if (!activeIds.has(id)) {
        unsubscribe();
        attendanceUnsubsRef.current.delete(id);
      }
    });

    currentIds.forEach((sessionId) => {
      if (attendanceUnsubsRef.current.has(sessionId)) return;

      const unsubscribe = subscribeAttendanceForSession(
        sessionId,
        (records) =>
          dispatch({ type: 'SET_ATTENDANCE', sessionId, records }),
        (msg: string) => dispatch({ type: 'SET_ERROR', error: msg }),
      );
      attendanceUnsubsRef.current.set(sessionId, unsubscribe);
    });
  }, [sessionIds]);

  // Close every attendance listener on unmount/logout.
  useEffect(() => {
    return () => {
      attendanceUnsubsRef.current.forEach((unsubscribe) => unsubscribe());
      attendanceUnsubsRef.current.clear();
    };
  }, []);

  const getSessionById = (sessionId: string) =>
    state.sessions.find((s) => s.id === sessionId);

  const getAttendanceForSession = (sessionId: string) =>
    state.attendanceBySession[sessionId] ?? [];

  const subscribeAttendance = (
    sessionId: string,
    onData: (records: AttendanceRecord[]) => void,
    onError: (msg: string) => void,
  ) => subscribeAttendanceForSession(sessionId, onData, onError);

  const viewModel: AssistantSessionsViewModel = {
    ...state,
    getSessionById,
    getAttendanceForSession,
    openSession: (sessionId) =>
      enabled ? openSession(sessionId) : Promise.resolve(forbidden()),
    closeSession: (sessionId) =>
      enabled ? closeSession(sessionId) : Promise.resolve(forbidden()),
    createSession: (input) =>
      !enabled
        ? Promise.resolve(forbidden())
        : user
          ? createSession(user.uid, input)
          : Promise.resolve(unauthenticated()),
    updateSession: (sessionId, input) =>
      enabled ? updateSession(sessionId, input) : Promise.resolve(forbidden()),
    deleteSession: (sessionId) =>
      enabled ? deleteSession(sessionId) : Promise.resolve(forbidden()),
    addParticipantByEmail: (classId, email) =>
      enabled
        ? addParticipantByEmail(classId, email)
        : Promise.resolve(forbidden()),
    removeParticipant: (classId, studentUid) =>
      enabled
        ? removeParticipant(classId, studentUid)
        : Promise.resolve(forbidden()),
    getClassById: (classId: string) => state.classes.find((c) => c.id === classId),
    subscribeAttendanceForSession: (sessionId, onData, onError) =>
      enabled ? subscribeAttendance(sessionId, onData, onError) : () => {},
    createClass: (input) =>
      !enabled
        ? Promise.resolve(forbidden())
        : user
          ? createClass(user.uid, input)
          : Promise.resolve(unauthenticated()),
    updateClass: (classId, input) =>
      enabled ? updateClass(classId, input) : Promise.resolve(forbidden()),
    deleteClass: (classId) =>
      enabled ? deleteClass(classId) : Promise.resolve(forbidden()),
    retry: () => {
      if (enabled) setRetryCounter((c) => c + 1);
    },
  };

  return <AssistantSessionsContext.Provider value={viewModel}>{children}</AssistantSessionsContext.Provider>;
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