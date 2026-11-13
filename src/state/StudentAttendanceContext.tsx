import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  type ReactNode,
} from 'react';

import {
  AttendanceRecord,
  AsyncActionResult,
  PracticalClass,
  Session,
  StudentAttendanceViewModelV2,
} from '../domain/types';
import {
  checkInStudent,
  subscribeStudentAttendance,
  subscribeStudentClasses,
  subscribeStudentSessions,
} from '../services/firestore/studentService';
import { useAuth } from './AuthContext';

const forbidden = (): {
  ok: false;
  reason: string;
  message: string;
} => ({
  ok: false,
  reason: 'forbidden',
  message: 'Aksi khusus praktikan.',
});

type StudentAction =
  | { type: 'SET_CLASSES'; classes: PracticalClass[] }
  | { type: 'SET_SESSIONS'; sessions: Session[] }
  | { type: 'SET_ATTENDANCE'; records: AttendanceRecord[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SUBMITTING'; sessionId: string | null }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' };

interface StudentAttendanceState {
  classes: PracticalClass[];
  sessions: Session[];
  attendanceHistory: AttendanceRecord[];
  loading: boolean;
  submittingSessionId: string | null;
  error: string | null;
}

const initialState: StudentAttendanceState = {
  classes: [],
  sessions: [],
  attendanceHistory: [],
  loading: true,
  submittingSessionId: null,
  error: null,
};

function studentReducer(
  state: StudentAttendanceState,
  action: StudentAction,
): StudentAttendanceState {
  switch (action.type) {
    case 'SET_CLASSES':
      return { ...state, classes: action.classes };
    case 'SET_SESSIONS':
      return { ...state, sessions: action.sessions };
    case 'SET_ATTENDANCE':
      return { ...state, attendanceHistory: action.records };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_SUBMITTING':
      return { ...state, submittingSessionId: action.sessionId };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'RESET':
      return { ...initialState, loading: false };
    default:
      return state;
  }
}

const StudentAttendanceContext = createContext<
  StudentAttendanceViewModelV2 | undefined
>(undefined);

export function StudentAttendanceProvider({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(studentReducer, initialState);
  const [retryCounter, setRetryCounter] = useState(0);

  useEffect(() => {
    if (!enabled || !user) {
      dispatch({ type: 'RESET' });
      return;
    }

    dispatch({ type: 'SET_LOADING', loading: true });
    dispatch({ type: 'SET_ERROR', error: null });

    let sessionsReady = false;
    let attendanceReady = false;

    const markReady = () => {
      if (sessionsReady && attendanceReady) {
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    };

    const sessionsUnsubscribe = subscribeStudentSessions(
      user.uid,
      (sessions) => {
        dispatch({ type: 'SET_SESSIONS', sessions });
        sessionsReady = true;
        markReady();
      },
      () => {
        dispatch({
          type: 'SET_ERROR',
          error: 'Gagal memuat jadwal. Periksa koneksi lalu coba lagi.',
        });
        dispatch({ type: 'SET_LOADING', loading: false });
      },
    );

    const attendanceUnsubscribe = subscribeStudentAttendance(
      user.uid,
      (records) => {
        dispatch({ type: 'SET_ATTENDANCE', records });
        attendanceReady = true;
        markReady();
      },
      () => {
        dispatch({
          type: 'SET_ERROR',
          error:
            'Gagal memuat riwayat presensi. Periksa koneksi lalu coba lagi.',
        });
        dispatch({ type: 'SET_LOADING', loading: false });
      },
    );

    const classesUnsubscribe = subscribeStudentClasses(
      user.uid,
      (classes) => dispatch({ type: 'SET_CLASSES', classes }),
      () => {
        dispatch({
          type: 'SET_ERROR',
          error: 'Gagal memuat kelas. Periksa koneksi lalu coba lagi.',
        });
      },
    );

    return () => {
      sessionsUnsubscribe();
      attendanceUnsubscribe();
      classesUnsubscribe();
    };
  }, [enabled, user?.uid, retryCounter]);

  const getSessionById = (sessionId: string) =>
    state.sessions.find((s) => s.id === sessionId);

  const getAttendanceForSession = (sessionId: string) =>
    state.attendanceHistory.find((r) => r.sessionId === sessionId);

  const checkIn = async (sessionId: string): Promise<AsyncActionResult> => {
    if (!enabled || !user) {
      return forbidden();
    }

    if (state.submittingSessionId !== null) {
      return {
        ok: false,
        reason: 'validation_error',
        message: 'Presensi sedang diproses.',
      };
    }

    const session = state.sessions.find((s) => s.id === sessionId);
    if (!session) {
      return {
        ok: false,
        reason: 'session_not_found',
        message: 'Sesi tidak ditemukan.',
      };
    }

    dispatch({ type: 'SET_SUBMITTING', sessionId });
    try {
      return await checkInStudent({
        session,
        student: user,
        existing: state.attendanceHistory,
      });
    } finally {
      dispatch({ type: 'SET_SUBMITTING', sessionId: null });
    }
  };

  const viewModel: StudentAttendanceViewModelV2 = {
    classes: state.classes,
    sessions: state.sessions,
    currentStudent: enabled ? user : null,
    attendanceHistory: state.attendanceHistory,
    loading: state.loading,
    submittingSessionId: state.submittingSessionId,
    error: state.error,
    getSessionById,
    getAttendanceForSession,
    checkIn,
    retry: () => {
      if (enabled) setRetryCounter((c) => c + 1);
    },
  };

  return (
    <StudentAttendanceContext.Provider value={viewModel}>
      {children}
    </StudentAttendanceContext.Provider>
  );
}

export function useStudentAttendanceViewModel(): StudentAttendanceViewModelV2 {
  const context = useContext(StudentAttendanceContext);

  if (!context) {
    throw new Error(
      'useStudentAttendanceViewModel must be used within a StudentAttendanceProvider',
    );
  }

  return context;
}
