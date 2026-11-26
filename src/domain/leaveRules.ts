import type { Session } from './types';

/** Izin hanya bisa diajukan sebelum sesi selesai. */
export function canSubmitLeave(
  session: Session | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!session || session.status === 'closed') return false;
  const ends = session.endsAtMs ?? Date.parse(session.endsAt);
  return Number.isFinite(ends) && nowMs <= ends;
}
