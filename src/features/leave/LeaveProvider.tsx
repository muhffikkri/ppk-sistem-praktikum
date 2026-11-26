import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type { Firestore } from 'firebase/firestore';
import { isAssistantRole } from '../../domain/asprakScope';
import type { LeaveRequest, UserProfile } from '../../domain/types';
import {
  createLeaveService,
  leaveFailure,
  type LeaveService,
} from '../../services/firestore/leaveService';
import { useAssistantSessionsViewModel } from '../../state/AssistantSessionsContext';

const Context = createContext<{
  user: UserProfile | null;
  service: LeaveService;
} | null>(null);

export type LeaveRequestsState = {
  leaveRequests: LeaveRequest[];
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  retry: () => void;
};

const RequestsContext = createContext<LeaveRequestsState | null>(null);

export function LeaveProvider({
  db,
  user,
  children,
}: PropsWithChildren<{ db: Firestore; user: UserProfile | null }>) {
  const service = useMemo(() => createLeaveService(db), [db]);
  // Stable value: a new object here re-rendered every leave consumer on each
  // AppNavigator render.
  const value = useMemo(() => ({ user, service }), [user, service]);
  return (
    <Context.Provider key={user?.uid ?? 'signed-out'} value={value}>
      <LeaveRequestsSubscription user={user} service={service}>
        {children}
      </LeaveRequestsSubscription>
    </Context.Provider>
  );
}

/**
 * One leave-request subscription per signed-in account, shared by every
 * screen. Previously each screen using a leave view model opened its own
 * set of listeners.
 */
function LeaveRequestsSubscription({
  user,
  service,
  children,
}: PropsWithChildren<{ user: UserProfile | null; service: LeaveService }>) {
  const [leaveRequests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  // Assistants: reuse the session list AssistantSessionsContext already
  // listens to instead of opening a second sessions listener.
  const assistant = useAssistantSessionsViewModel();
  const isAssistant = isAssistantRole(user?.role);
  const assistantSessionKey = isAssistant
    ? assistant.sessions.map((s) => s.id).join(',')
    : '';
  const assistantSessionsReady = !isAssistant || !assistant.loading;

  useEffect(() => {
    if (!user || !assistantSessionsReady) return;
    let active = true;
    const fail = (cause: unknown) => {
      if (active) {
        setError(leaveFailure(cause).message);
        setLoading(false);
      }
    };
    const onData = (items: LeaveRequest[]) => {
      if (active) {
        setRequests(items);
        setLoading(false);
        setError(null);
      }
    };
    let stop: (() => void) | undefined;
    try {
      stop =
        user.role === 'student'
          ? service.subscribeStudent(user, onData, fail)
          : service.subscribeAssistant(
              user,
              assistantSessionKey ? assistantSessionKey.split(',') : [],
              onData,
              fail,
            );
    } catch (cause) {
      queueMicrotask(() => fail(cause));
    }
    return () => {
      active = false;
      stop?.();
    };
  }, [service, user, revision, assistantSessionKey, assistantSessionsReady]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setRevision((value) => value + 1);
  }, []);

  const state = useMemo(
    () => ({ leaveRequests, loading, error, setError, retry }),
    [leaveRequests, loading, error, retry],
  );

  return (
    <RequestsContext.Provider value={state}>
      {children}
    </RequestsContext.Provider>
  );
}

export function useLeaveDependencies() {
  const value = useContext(Context);
  if (!value)
    throw new Error(
      'Wrap leave screens in LeaveProvider with db and useAuth().user.',
    );
  return value;
}

export function useLeaveRequestsState(): LeaveRequestsState {
  const value = useContext(RequestsContext);
  if (!value)
    throw new Error(
      'Wrap leave screens in LeaveProvider with db and useAuth().user.',
    );
  return value;
}
