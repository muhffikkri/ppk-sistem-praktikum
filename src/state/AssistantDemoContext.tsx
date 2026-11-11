import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  AssistantDemoState,
} from '../domain/types';
import {
  assistantSessions,
  assistantAttendance,
} from '../data/fixtures/assistantFixtures';

type AssistantAction =
  | { type: 'OPEN_SESSION'; sessionId: string; openedAt: string }
  | { type: 'CLOSE_SESSION'; sessionId: string; closedAt: string };

const initialAssistantState: AssistantDemoState = {
  sessions: assistantSessions,
  attendanceBySession: assistantAttendance,
};

function assistantReducer(
  state: AssistantDemoState,
  action: AssistantAction,
): AssistantDemoState {
  switch (action.type) {
    case 'OPEN_SESSION': {
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.sessionId
            ? { ...s, status: 'open', openedAt: action.openedAt }
            : s,
        ),
      };
    }
    case 'CLOSE_SESSION': {
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.sessionId
            ? { ...s, status: 'closed', closedAt: action.closedAt }
            : s,
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

const AssistantDemoContext = createContext<AssistantContextType | undefined>(
  undefined,
);

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
 * Konteks demo (fixture) asisten. Provider tetap dipertahankan untuk testing
 * tanpa backend; hook utama (`useAssistantSessionsViewModel`) kini berasal
 * dari AssistantSessionsContext (Firestore-backed).
 */
export function useAssistantDemoState() {
  const context = useContext(AssistantDemoContext);

  if (!context) {
    throw new Error(
      'useAssistantDemoState must be used within an AssistantDemoProvider',
    );
  }

  return context;
}
