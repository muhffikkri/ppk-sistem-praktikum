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
  return (
    <Context.Provider key={user?.uid ?? 'signed-out'} value={{ user, service }}>
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
