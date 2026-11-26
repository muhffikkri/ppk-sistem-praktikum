import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  countUnread,
  type InboxNotification,
} from '../domain/notificationTypes';
import {
  markAllNotificationsRead,
  markNotificationRead,
  subscribeInbox,
} from '../services/firestore/notificationInboxService';
import { useAuth } from './AuthContext';

export type NotificationInboxValue = {
  notifications: InboxNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  retry: () => void;
};

const NotificationInboxContext = createContext<NotificationInboxValue | null>(
  null,
);

type InboxState = {
  uid: string;
  notifications: InboxNotification[];
  error: string | null;
};

/** Satu listener inbox untuk seluruh aplikasi (layar Notifikasi & badge lonceng). */
export function NotificationInboxProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [state, setState] = useState<InboxState | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!uid) return;
    return subscribeInbox(
      uid,
      (notifications) => setState({ uid, notifications, error: null }),
      (error) =>
        setState((prev) => ({
          uid,
          notifications: prev?.uid === uid ? prev.notifications : [],
          error,
        })),
    );
  }, [uid, attempt]);

  // Data milik akun sebelumnya tidak boleh tampil setelah ganti akun.
  const current = uid && state?.uid === uid ? state : null;
  const notifications = useMemo(() => current?.notifications ?? [], [current]);

  const markRead = useCallback(
    async (notificationId: string) => {
      if (!uid) return;
      const target = notifications.find((n) => n.id === notificationId);
      if (!target || target.readAt) return;
      await markNotificationRead(uid, notificationId).catch(() => undefined);
    },
    [notifications, uid],
  );

  const markAllRead = useCallback(async () => {
    if (!uid) return;
    const unreadIds = notifications.filter((n) => !n.readAt).map((n) => n.id);
    await markAllNotificationsRead(uid, unreadIds).catch(() => undefined);
  }, [notifications, uid]);

  const value = useMemo<NotificationInboxValue>(
    () => ({
      notifications,
      unreadCount: countUnread(notifications),
      loading: !!uid && !current,
      error: current?.error ?? null,
      markRead,
      markAllRead,
      retry: () => setAttempt((n) => n + 1),
    }),
    [current, markAllRead, markRead, notifications, uid],
  );

  return (
    <NotificationInboxContext.Provider value={value}>
      {children}
    </NotificationInboxContext.Provider>
  );
}

export function useNotificationInbox(): NotificationInboxValue {
  const value = useContext(NotificationInboxContext);
  if (!value) {
    throw new Error(
      'useNotificationInbox harus dipakai di dalam NotificationInboxProvider',
    );
  }
  return value;
}
