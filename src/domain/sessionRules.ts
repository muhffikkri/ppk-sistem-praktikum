import { Session } from './types';

export const CHECK_IN_EARLY_MS = 15 * 60_000;
export const CHECK_IN_LATE_MS = 10 * 60_000;

export type SessionTransitionResult =
  | { ok: true; updatedSession: Session }
  | {
      ok: false;
      reason:
        | 'session_not_found'
        | 'invalid_status'
        | 'outside_window'
        | 'active_session_conflict';
    };

export type OpenSessionContext = {
  actorUid: string;
  openSessions: Session[];
};

/**
 * Asprak hanya boleh punya satu sesi open. Konflik dihitung dari daftar sesi
 * open milik actorUid; sesi yang sedang dibuka sendiri tidak dihitung.
 */
export function findOpenSessionConflict(
  session: Session,
  openSessions: Session[],
  actorUid: string,
): Session | undefined {
  if (!actorUid || session.status === 'open') return undefined;
  return openSessions.find(
    (other) =>
      other.id !== session.id &&
      other.status === 'open' &&
      (other.assistantIds?.includes(actorUid) ?? false),
  );
}

const startMs = (session: Session) =>
  session.startsAtMs ?? Date.parse(session.startsAt);
const endMs = (session: Session) =>
  session.endsAtMs ?? Date.parse(session.endsAt);

/** Presensi: 15 menit sebelum mulai sampai 10 menit setelah selesai. */
export function isWithinCheckInWindow(
  session: Session,
  nowMs: number = Date.now(),
): boolean {
  const start = startMs(session);
  const end = endMs(session);
  return (
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    nowMs >= start - CHECK_IN_EARLY_MS &&
    nowMs <= end + CHECK_IN_LATE_MS
  );
}

/** Aksi asisten: 15 menit sebelum mulai sampai tepat waktu selesai. */
export function isWithinOpenWindow(
  session: Session,
  nowMs: number = Date.now(),
): boolean {
  const start = startMs(session);
  const end = endMs(session);
  return (
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    nowMs >= start - CHECK_IN_EARLY_MS &&
    nowMs <= end
  );
}

/**
 * Aturan domain untuk membuka sesi.
 * - Sesi 'scheduled' atau 'closed' bisa dibuka, hanya di jendela jadwalnya.
 * - Mengubah status menjadi 'open' dan mengisi openedAt dengan timestamp ISO.
 */
export function openSessionRule(
  session: Session | undefined,
  nowIso: string = new Date().toISOString(),
  context?: OpenSessionContext,
): SessionTransitionResult {
  if (!session) {
    return { ok: false, reason: 'session_not_found' };
  }

  if (session.status !== 'scheduled' && session.status !== 'closed') {
    return { ok: false, reason: 'invalid_status' };
  }

  if (!isWithinOpenWindow(session, Date.parse(nowIso))) {
    return { ok: false, reason: 'outside_window' };
  }

  if (
    context &&
    findOpenSessionConflict(session, context.openSessions, context.actorUid)
  ) {
    return { ok: false, reason: 'active_session_conflict' };
  }

  const updatedSession: Session = {
    ...session,
    status: 'open',
    openedAt: nowIso,
    closedAt: null,
  };

  return { ok: true, updatedSession };
}

/**
 * Aturan domain untuk menutup sesi.
 * - Berhasil hanya bila status 'open'.
 * - Mengubah status menjadi 'closed' dan mengisi closedAt dengan timestamp ISO.
 */
export function closeSessionRule(
  session: Session | undefined,
  nowIso: string = new Date().toISOString(),
): SessionTransitionResult {
  if (!session) {
    return { ok: false, reason: 'session_not_found' };
  }

  if (session.status !== 'open') {
    return { ok: false, reason: 'invalid_status' };
  }

  const updatedSession: Session = {
    ...session,
    status: 'closed',
    closedAt: nowIso,
  };

  return { ok: true, updatedSession };
}

/**
 * Aturan domain untuk membatalkan sesi.
 * - Hanya sesi 'scheduled' yang bisa dibatalkan.
 * - Status menjadi 'cancelled' dan cancelledAt diisi; peserta tetap melihat jadwalnya.
 */
export function cancelSessionRule(
  session: Session | undefined,
  nowIso: string = new Date().toISOString(),
): SessionTransitionResult {
  if (!session) {
    return { ok: false, reason: 'session_not_found' };
  }

  if (session.status !== 'scheduled') {
    return { ok: false, reason: 'invalid_status' };
  }

  return {
    ok: true,
    updatedSession: { ...session, status: 'cancelled', cancelledAt: nowIso },
  };
}
