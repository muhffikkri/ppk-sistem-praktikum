/**
 * Inbox notifikasi pengguna: `users/{uid}/notifications`.
 * Rules hanya mengizinkan pemilik membaca dan mengubah `readAt`.
 */
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import {
  toInboxNotification,
  type InboxNotification,
} from '../../domain/notificationTypes';
import { db } from '../firebase';

const INBOX_LIMIT = 50;

const inboxCol = (uid: string) => collection(db, 'users', uid, 'notifications');

export function subscribeInbox(
  uid: string,
  onData: (notifications: InboxNotification[]) => void,
  onError: (message: string) => void,
) {
  const q = query(
    inboxCol(uid),
    orderBy('createdAt', 'desc'),
    limit(INBOX_LIMIT),
  );
  return onSnapshot(
    q,
    (snap) => {
      const items: InboxNotification[] = [];
      snap.docs.forEach((d) => {
        const item = toInboxNotification(d.id, d.data());
        if (item) items.push(item);
      });
      onData(items);
    },
    () => onError('Gagal memuat notifikasi. Periksa koneksi lalu coba lagi.'),
  );
}

export async function markNotificationRead(
  uid: string,
  notificationId: string,
) {
  await updateDoc(doc(inboxCol(uid), notificationId), {
    readAt: new Date().toISOString(),
  });
}

export async function markAllNotificationsRead(
  uid: string,
  notificationIds: string[],
) {
  if (!notificationIds.length) return;
  const batch = writeBatch(db);
  const readAt = new Date().toISOString();
  notificationIds.forEach((id) =>
    batch.update(doc(inboxCol(uid), id), { readAt }),
  );
  await batch.commit();
}
