/**
 * Inbox notifikasi (Sprint 3): `users/{uid}/notifications/{id}`.
 * Dokumen ditulis server (worker / Cloud Functions) setiap kali push
 * dikirim; aplikasi hanya membaca dan menandai sudah dibaca.
 */

export type NotificationType =
  'session_scheduled' | 'session_opened' | 'schedule_changed' | 'leave_decided';

export type InboxNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  sessionId?: string;
  leaveId?: string;
  createdAt: string; // ISO 8601 UTC
  readAt: string | null; // ISO 8601 UTC
};

/** Tujuan navigasi saat notifikasi (inbox atau push) diketuk. */
export type NotificationRoute =
  | { screen: 'StudentCheckIn'; sessionId: string }
  | { screen: 'StudentSessionDetail'; sessionId: string }
  | { screen: 'StudentLeaveList' };

const TYPES: readonly NotificationType[] = [
  'session_scheduled',
  'session_opened',
  'schedule_changed',
  'leave_decided',
];

export function isNotificationType(value: unknown): value is NotificationType {
  return TYPES.includes(value as NotificationType);
}

export function notificationRoute(
  notification: Pick<InboxNotification, 'type' | 'sessionId' | 'leaveId'>,
): NotificationRoute | null {
  switch (notification.type) {
    case 'session_opened':
      return notification.sessionId
        ? { screen: 'StudentCheckIn', sessionId: notification.sessionId }
        : null;
    case 'session_scheduled':
    case 'schedule_changed':
      return notification.sessionId
        ? { screen: 'StudentSessionDetail', sessionId: notification.sessionId }
        : null;
    case 'leave_decided':
      return notification.leaveId ? { screen: 'StudentLeaveList' } : null;
    default:
      return null;
  }
}

/** Ubah data mentah Firestore menjadi notifikasi; data rusak diabaikan. */
export function toInboxNotification(
  id: string,
  data: Record<string, unknown>,
): InboxNotification | null {
  if (!isNotificationType(data.type)) return null;
  if (typeof data.title !== 'string' || typeof data.createdAt !== 'string') {
    return null;
  }
  return {
    id,
    type: data.type,
    title: data.title,
    body: typeof data.body === 'string' ? data.body : '',
    ...(typeof data.sessionId === 'string'
      ? { sessionId: data.sessionId }
      : {}),
    ...(typeof data.leaveId === 'string' ? { leaveId: data.leaveId } : {}),
    createdAt: data.createdAt,
    readAt: typeof data.readAt === 'string' ? data.readAt : null,
  };
}

export function countUnread(notifications: InboxNotification[]): number {
  return notifications.filter((n) => n.readAt === null).length;
}

/** Label badge: 1–9 apa adanya, lebih dari itu "9+". */
export function unreadBadgeLabel(count: number): string | null {
  if (count <= 0) return null;
  return count > 9 ? '9+' : String(count);
}
