import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type {
  AssistantSessionsViewModelV2,
  PracticalClass,
  Session,
  UserProfile,
} from '../domain/types';
import {
  addParticipantByEmail,
  closeSession,
  createClass,
  createSession,
  deleteClass,
  deleteSession,
  initializeAssistantState,
  openSession,
  removeParticipant,
  subscribeAttendanceForSession,
  subscribeClasses,
  subscribeSessions,
  updateClass,
  updateSession,
} from '../services/firestore/assistantService';
import { useAuth } from './AuthContext';

export type AssistantSessionsContextValue = AssistantSessionsViewModelV2;

const AssistantSessionsContext = createContext<
  AssistantSessionsContextValue | undefined
>(undefined);

export function AssistantSessionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { authStatus, user } = useAuth();
  const isAssistant =
    authStatus === 'authenticated' && user?.role === 'assistant';

  const [classes, setClasses] = useState<PracticalClass[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [studentsDirectory, setStudentsDirectory] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(isAssistant);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isAssistant) {
      return;
    }

    let cancelled = false;

    initializeAssistantState()
      .then((initial) => {
        if (cancelled) return;
        setClasses(initial.classes);
        setSessions(initial.sessions);
        setStudentsDirectory(initial.studentsDirectory);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : 'Gagal inisialisasi context asisten',
        );
        setLoading(false);
      });

    const unsubClasses = subscribeClasses(
      (nextClasses) => {
        setClasses(nextClasses);
        setLoading(false);
      },
      (msg) => {
        setError(msg);
        setLoading(false);
      },
    );

    const unsubSessions = subscribeSessions(
      (nextSessions) => {
        setSessions(nextSessions);
        setLoading(false);
      },
      (msg) => {
        setError(msg);
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
      unsubClasses();
      unsubSessions();
    };
  }, [isAssistant, reloadKey]);

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  const getClassById = useCallback(
    (classId: string) => classes.find((c) => c.id === classId),
    [classes],
  );

  const getSessionById = useCallback(
    (sessionId: string) => sessions.find((s) => s.id === sessionId),
    [sessions],
  );

  const value = useMemo<AssistantSessionsContextValue>(
    () => ({
      classes: isAssistant ? classes : [],
      sessions: isAssistant ? sessions : [],
      studentsDirectory: isAssistant ? studentsDirectory : [],
      loading: isAssistant ? loading : false,
      error: isAssistant ? error : null,
      getClassById,
      getSessionById,
      subscribeAttendanceForSession,
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
      retry,
    }),
    [
      isAssistant,
      classes,
      sessions,
      studentsDirectory,
      loading,
      error,
      getClassById,
      getSessionById,
      retry,
    ],
  );

  return (
    <AssistantSessionsContext.Provider value={value}>
      {children}
    </AssistantSessionsContext.Provider>
  );
}

export function useAssistantSessionsV2(): AssistantSessionsContextValue {
  const context = useContext(AssistantSessionsContext);
  if (!context) {
    throw new Error(
      'useAssistantSessionsV2 must be used within an AssistantSessionsProvider',
    );
  }
  return context;
}
