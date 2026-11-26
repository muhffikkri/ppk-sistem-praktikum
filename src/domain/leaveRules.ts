import type { AttendanceRecord, LeaveRequest, Session } from './types';

/** Izin hanya bisa diajukan sebelum sesi selesai. */
export function canSubmitLeave(
  session: Session | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!session || session.status === 'closed' || session.status === 'cancelled')
    return false;
  const ends = session.endsAtMs ?? Date.parse(session.endsAt);
  return Number.isFinite(ends) && nowMs <= ends;
}

/**
 * Izin yang masih menunggu tidak memblokir presensi: praktikan bisa hadir
 * meski sudah mengajukan izin. Hanya izin yang disetujui yang memblokir.
 */
export function isLeaveBlockingCheckIn(
  leave: LeaveRequest | undefined,
): boolean {
  return leave?.status === 'approved';
}

/**
 * Pengajuan izin baru hanya tersedia bila sesi masih memungkinkan, praktikan
 * belum hadir, dan belum ada izin aktif (pending/approved) untuk sesi itu.
 */
export function canRequestLeave(
  session: Session | undefined,
  attendance: AttendanceRecord | undefined,
  leave: LeaveRequest | undefined,
  nowMs: number = Date.now(),
): boolean {
  const activeLeave = leave && leave.status !== 'rejected' ? leave : undefined;
  return canSubmitLeave(session, nowMs) && !attendance && !activeLeave;
}
