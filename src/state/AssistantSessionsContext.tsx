import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';
import {
  fetchClasses,
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
  subscribeLeaveRequestsForStudent,
  initializeAssistantState,
} from '../services/firestore/assistantService';
import {
  ClassInput,
  SessionInput,
  PracticalClass,
  Session,
  UserProfile,
  AttendanceRecord,
} from '../domain/types';
import { AsyncActionResult } from '../domain/types';

// ============================================================
// Reducer Actions
// ============================================================

type AssistantAction =
  | { type: 'SET_CLASSES'; classes: PracticalClass[] }
  | { type: 'SET_SESSIONS'; sessions: Session[] }
  | { type: 'SET_STUDENTS'; students: UserProfile[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_RETRY' };

type AssistantSessionsContextValue = {
  classes: PracticalClass[];
  sessions: Session[];
  studentsDirectory: UserProfile[];
  loading: boolean;
  error: string | null;
  getClassById: (classId: string) => PracticalClass | undefined;
  getSessionById: (sessionId: string) => Session | undefined;
  subscribeAttendanceForSession: (
    sessionId: string,
    onData: (records: AttendanceRecord[]) => void,
    onError: (msg: string) => void,
  ) => () => void;
  createClass: (input: ClassInput) => Promise<AsyncActionResult<string>>;
  updateClass: (classId: string, input: ClassInput) => Promise<AsyncActionResult>;
  deleteClass: (classId: string) => Promise<AsyncActionResult>;
  addParticipantByEmail: (classId: string, email: string) => Promise<AsyncActionResult>;
  removeParticipant: (classId: string, studentUid: string) => Promise<AsyncActionResult>;
  createSession: (input: SessionInput) => Promise<AsyncActionResult<string>>;
  updateSession: (sessionId: string, input: SessionInput) => Promise<AsyncActionResult>;
  deleteSession: (sessionId: string) => Promise<AsyncActionResult>;
  openSession: (sessionId: string) => Promise<AsyncActionResult>;
  closeSession: (sessionId: string) => Promise<AsyncActionResult>;
  retry: () => void;
};

const initialState: AssistantSessionsContextValue = {
  classes: [],
  sessions: [],
  studentsDirectory: [],
  loading: true,
  error: null,
  getClassById: () => undefined,
  getSessionById: () => undefined,
  subscribeAttendanceForSession: (_sessionId, _onData, _onError) => () => {},
  createClass: async () => ({ ok: false, reason: 'not_initialized', message: 'Context not initialized' }),
  updateClass: async () => ({ ok: false, reason: 'not_initialized', message: 'Context not initialized' }),
  deleteClass: async () => ({ ok: false, reason: 'not_initialized', message: 'Context not initialized' }),
  addParticipantByEmail: async () => ({ ok: false, reason: 'not_initialized', message: 'Context not initialized' }),
  removeParticipant: async () => ({ ok: false, reason: 'not_initialized', message: 'Context not initialized' }),
  createSession: async () => ({ ok: false, reason: 'not_initialized', message: 'Context not initialized' }),
  updateSession: async () => ({ ok: false, reason: 'not_initialized', message: 'Context not initialized' }),
  deleteSession: async () => ({ ok: false, reason: 'not_initialized', message: 'Context not initialized' }),
  openSession: async () => ({ ok: false, reason: 'not_initialized', message: 'Context not initialized' }),
  closeSession: async () => ({ ok: false, reason: 'not_initialized', message: 'Context not initialized' }),
  retry: () => {},
};

function assistantReducer(
  state: AssistantSessionsContextValue,
  action: AssistantAction,
): AssistantSessionsContextValue {
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
    case 'SET_RETRY':
      return initialState;
    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================

const AssistantSessionsContext = createContext<AssistantSessionsContextValue | undefined>(
  undefined,
);

export const AssistantSessionsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [state, dispatch] = useReducer(assistantReducer, initialState);

  // Initialize state from Firestore on mount
  useEffect(() => {
    initializeAssistantState().then((ctx) => {
      dispatch({ type: 'SET_CLASSES', classes: ctx.classes });
      dispatch({ type: 'SET_SESSIONS', sessions: ctx.sessions });
      dispatch({ type: 'SET_STUDENTS', students: ctx.studentsDirectory });
    }).catch((e) => {
      dispatch({ type: 'SET_ERROR', error: e.message || 'Gagal inisialisasi context asisten' });
    });
  }, []);

  // Set up real-time listeners
  useEffect(() => {
    // Subscribe to classes real-time
    const classesUnsubscribe = subscribeClasses(
      (classes) => dispatch({ type: 'SET_CLASSES', classes }),
      (msg) => dispatch({ type: 'SET_ERROR', error: msg }),
    );

    // Subscribe to sessions real-time
    const sessionsUnsubscribe = subscribeSessions(
      (sessions) => dispatch({ type: 'SET_SESSIONS', sessions }),
      (msg) => dispatch({ type: 'SET_ERROR', error: msg }),
    );

    return () => {
      classesUnsubscribe();
      sessionsUnsubscribe();
    };
  }, []);

  return (
    <AssistantSessionsContext.Provider value={state}>
      {children}
    </AssistantSessionsContext.Provider>
  );
};

export { AssistantSessionsContextValue };

export function useAssistantSessionsViewModel(): AssistantSessionsContextValue {
  const context = useContext(AssistantSessionsContext);

  if (!context) {
    throw new Error(
      'useAssistantSessionsViewModel must be used within an AssistantSessionsProvider',
    );
  }

  return context;
}