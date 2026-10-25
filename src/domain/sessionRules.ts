import { Session } from './types';

export type SessionTransitionResult =
  | { ok: true; updatedSession: Session }
  | { ok: false; reason: 'session_not_found' | 'invalid_status' };

/**
 * Aturan domain untuk membuka sesi.
 * - Berhasil hanya bila status 'scheduled'.
 * - Mengubah status menjadi 'open' dan mengisi openedAt dengan timestamp ISO.
 */
export function openSessionRule(
  session: Session | undefined,
  nowIso: string = new Date().toISOString(),
): SessionTransitionResult {
  if (!session) {
    return { ok: false, reason: 'session_not_found' };
  }

  if (session.status !== 'scheduled') {
    return { ok: false, reason: 'invalid_status' };
  }

  const updatedSession: Session = {
    ...session,
    status: 'open',
    openedAt: nowIso,
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
