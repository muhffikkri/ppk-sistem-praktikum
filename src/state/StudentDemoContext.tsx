import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  AttendanceRecord,
  Session,
  SessionActionResult,
  StudentAttendanceViewModel,
  StudentDemoState,
} from '../domain/types';
import { checkInRule } from '../domain/attendanceRules';
import {
  studentSessions,
  currentStudent,
  studentAttendance,
} from '../data/fixtures/studentFixtures';

type StudentAction = { type: 'CHECK_IN'; record: AttendanceRecord };

const initialStudentState: StudentDemoState = {
  sessions: studentSessions,
  currentStudent: currentStudent,
  attendanceHistory: studentAttendance,
};

function studentReducer(
  state: StudentDemoState,
  action: StudentAction,
): StudentDemoState {
  switch (action.type) {
    case 'CHECK_IN': {
      return {
        ...state,
        attendanceHistory: [action.record, ...state.attendanceHistory],
      };
    }
    default:
      return state;
  }
}

interface StudentContextType {
  state: StudentDemoState;
  dispatch: React.Dispatch<StudentAction>;
}

const StudentDemoContext = createContext<StudentContextType | undefined>(
  undefined,
);

export interface StudentDemoProviderProps {
  children: ReactNode;
  initialState?: StudentDemoState;
}

export function StudentDemoProvider({
  children,
  initialState = initialStudentState,
}: StudentDemoProviderProps) {
  const [state, dispatch] = useReducer(studentReducer, initialState);

  return (
    <StudentDemoContext.Provider value={{ state, dispatch }}>
      {children}
    </StudentDemoContext.Provider>
  );
}

/**
 * Hook ViewModel Praktikan sesuai kontrak docs/shared-contract.md
 * Digunakan oleh Orang 2 untuk layar-layar praktikan.
 */
export function useStudentAttendanceViewModel(): StudentAttendanceViewModel {
  const context = useContext(StudentDemoContext);

  if (!context) {
    throw new Error(
      'useStudentAttendanceViewModel must be used within a StudentDemoProvider',
    );
  }

  const { state, dispatch } = context;

  const getSessionById = (sessionId: string): Session | undefined => {
    return state.sessions.find((s) => s.id === sessionId);
  };

  const getAttendanceForSession = (
    sessionId: string,
  ): AttendanceRecord | undefined => {
    return state.attendanceHistory.find(
      (a) =>
        a.sessionId === sessionId && a.studentId === state.currentStudent.id,
    );
  };

  const checkIn = (sessionId: string): SessionActionResult => {
    const session = getSessionById(sessionId);
    const result = checkInRule(
      session,
      state.currentStudent,
      state.attendanceHistory,
    );

    if (!result.ok) {
      return { ok: false, reason: result.reason };
    }

    dispatch({
      type: 'CHECK_IN',
      record: result.record,
    });

    return { ok: true };
  };

  return {
    sessions: state.sessions,
    currentStudent: state.currentStudent,
    attendanceHistory: state.attendanceHistory,
    getSessionById,
    getAttendanceForSession,
    checkIn,
  };
}
