import React, {
  createContext,
  useContext,
  useReducer,
  useState,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
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
  initializeAssistantState,
} from '../services/firestore/assistantService';
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
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null };

// ============================================================
// State
// ============================================================

interface AssistantSessionsState {
  sessions: Session[];
  classes: PracticalClass[];
  studentsDirectory: UserProfile[];
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
      return { ...state, classes: action.classes, loading: false };
    case 'SET_SESSIONS':
      return { ...state, sessions: action.sessions, loading: false };
    case 'SET_STUDENTS':
      return { ...state, studentsDirectory: action.students };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error };
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
}: {
  children: ReactNode;
}) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(assistantReducer, initialState);
  const [retryCounter, setRetryCounter] = useState(0);
  const attendanceCacheRef = useRef<Record<string, AttendanceRecord[]>>({});

  // Initialize state dari Firestore
  useEffect(() => {
    let cancelled = false;
    dispatch({ type: 'SET_LOADING', loading: true });
    dispatch({ type: 'SET_ERROR', error: null });

    initializeAssistantState()
      .then((ctx) => {
        if (cancelled) return;
        dispatch({ type: 'SET_CLASSES', classes: ctx.classes });
        dispatch({ type: 'SET_SESSIONS', sessions: ctx.sessions });
        dispatch({ type: 'SET_STUDENTS', students: ctx.studentsDirectory });
      })
      .catch((e: any) => {
        if (cancelled) return;
        dispatch({
          type: 'SET_ERROR',
          error: e?.message || 'Gagal inisialisasi context asisten',
        });
        dispatch({ type: 'SET_LOADING', loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [retryCounter]);

  // Set up real-time listeners
  useEffect(() => {
    const classesUnsubscribe = subscribeClasses(
      (classes) => dispatch({ type: 'SET_CLASSES', classes }),
      (msg: string) => dispatch({ type: 'SET_ERROR', error: msg }),
    );

    const sessionsUnsubscribe = subscribeSessions(
      (sessions) => dispatch({ type: 'SET_SESSIONS', sessions }),
      (msg: string) => dispatch({ type: 'SET_ERROR', error: msg }),
    );

    return () => {
      classesUnsubscribe();
      sessionsUnsubscribe();
    };
  }, []);

  const getSessionById = (sessionId: string) =>
    state.sessions.find((s) => s.id === sessionId);

  const getAttendanceForSession = (sessionId: string) =>
    attendanceCacheRef.current[sessionId] ?? [];

  const subscribeAttendance = (
    sessionId: string,
    onData: (records: AttendanceRecord[]) => void,
    onError: (msg: string) => void,
  ) => {
    attendanceCacheRef.current[sessionId] = [];
    const unsub = subscribeAttendanceForSession(
      sessionId,
      (records) => {
        attendanceCacheRef.current[sessionId] = records;
        onData(records);
      },
      onError,
    );
    return () => {
      unsub();
    };
  };

  const viewModel: AssistantSessionsViewModel = {
    ...state,
    getSessionById,
    getAttendanceForSession,
    openSession,
    closeSession,
    createSession: (input) =>
      user
        ? createSession(user.uid, input)
        : Promise.resolve(unauthenticated()),
    updateSession,
    deleteSession,
    addParticipantByEmail,
    removeParticipant,
    getClassById: (classId: string) => state.classes.find((c) => c.id === classId),
    subscribeAttendanceForSession: subscribeAttendance,
    createClass: (input) =>
      user ? createClass(user.uid, input) : Promise.resolve(unauthenticated()),
    updateClass,
    deleteClass,
    retry: () => setRetryCounter((c) => c + 1),
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