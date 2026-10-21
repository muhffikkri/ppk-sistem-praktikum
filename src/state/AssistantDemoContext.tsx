import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  AssistantDemoState,
  AssistantSessionsViewModel,
  AttendanceRecord,
  Session,
  SessionActionResult,
} from '../domain/types';
import { openSessionRule, closeSessionRule } from '../domain/sessionRules';
import { assistantSessions, assistantAttendance } from '../data/fixtures/assistantFixtures';

type AssistantAction =
  | { type: 'OPEN_SESSION'; sessionId: string; openedAt: string }
  | { type: 'CLOSE_SESSION'; sessionId: string; closedAt: string };

const initialAssistantState: AssistantDemoState = {
  sessions: assistantSessions,
  attendanceBySession: assistantAttendance,
};

function assistantReducer(
  state: AssistantDemoState,
  action: AssistantAction
): AssistantDemoState {
  switch (action.type) {
    case 'OPEN_SESSION': {
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.sessionId
            ? { ...s, status: 'open', openedAt: action.openedAt }
            : s
        ),
      };
    }
    case 'CLOSE_SESSION': {
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.sessionId
            ? { ...s, status: 'closed', closedAt: action.closedAt }
            : s
        ),
      };
    }
    default:
      return state;
  }
}

interface AssistantContextType {
  state: AssistantDemoState;
  dispatch: React.Dispatch<AssistantAction>;
}

const AssistantDemoContext = createContext<AssistantContextType | undefined>(undefined);

export interface AssistantDemoProviderProps {
  children: ReactNode;
  initialState?: AssistantDemoState;
}

export function AssistantDemoProvider({
  children,
  initialState = initialAssistantState,
}: AssistantDemoProviderProps) {
  const [state, dispatch] = useReducer(assistantReducer, initialState);

  return (
    <AssistantDemoContext.Provider value={{ state, dispatch }}>
      {children}
    </AssistantDemoContext.Provider>
  );
}

/**
 * Hook ViewModel Asisten sesuai kontrak docs/shared-contract.md
 * Digunakan oleh Orang 3 untuk layar-layar asisten.
 */
export function useAssistantSessionsViewModel(): AssistantSessionsViewModel {
  const context = useContext(AssistantDemoContext);

  if (!context) {
    throw new Error(
      'useAssistantSessionsViewModel must be used within an AssistantDemoProvider'
    );
  }

  const { state, dispatch } = context;

  const getSessionById = (sessionId: string): Session | undefined => {
    return state.sessions.find((s) => s.id === sessionId);
  };

  const getAttendanceForSession = (sessionId: string): AttendanceRecord[] => {
    return state.attendanceBySession[sessionId] ?? [];
  };

  const openSession = (sessionId: string): SessionActionResult => {
    const session = getSessionById(sessionId);
    const result = openSessionRule(session);

    if (!result.ok) {
      return { ok: false, reason: result.reason };
    }

    dispatch({
      type: 'OPEN_SESSION',
      sessionId,
      openedAt: result.updatedSession.openedAt!,
    });

    return { ok: true };
  };

  const closeSession = (sessionId: string): SessionActionResult => {
    const session = getSessionById(sessionId);
    const result = closeSessionRule(session);

    if (!result.ok) {
      return { ok: false, reason: result.reason };
    }

    dispatch({
      type: 'CLOSE_SESSION',
      sessionId,
      closedAt: result.updatedSession.closedAt!,
    });

    return { ok: true };
  };

  return {
    sessions: state.sessions,
    getSessionById,
    getAttendanceForSession,
    openSession,
    closeSession,
  };
}
