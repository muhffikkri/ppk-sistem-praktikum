import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react';
import type { Firestore } from 'firebase/firestore';
import type { UserProfile } from '../../domain/types';
import {
  createLeaveService,
  type LeaveService,
} from '../../services/firestore/leaveService';

const Context = createContext<{
  user: UserProfile | null;
  service: LeaveService;
} | null>(null);
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
      {children}
    </Context.Provider>
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
