import type { AttendanceRecord, Session } from '../../domain/types';

export type Punctuality = 'onTime' | 'late' | 'unknown';

/**
 * Klasifikasi dari backend (memakai toleransi sesi) menang. Catatan lama
 * tanpa field tersebut memakai heuristik: presensi tepat pada/mulai sebelum
 * jadwal = tepat waktu, setelahnya = terlambat.
 */
export function punctualityOf(
  record: AttendanceRecord,
  session: Session | undefined,
): Punctuality {
  if (record.punctuality === 'ontime') return 'onTime';
  if (record.punctuality === 'late') return 'late';
  if (!session) return 'unknown';
  return Date.parse(record.checkedInAt) <= Date.parse(session.startsAt)
    ? 'onTime'
    : 'late';
}

export function punctualityCounts<T extends AttendanceRecord>(
  records: readonly T[],
  sessionOf: (record: T) => Session | undefined,
): { onTime: number; late: number; unknown: number } {
  const counts = { onTime: 0, late: 0, unknown: 0 };
  for (const record of records) {
    counts[punctualityOf(record, sessionOf(record))] += 1;
  }
  return counts;
}

export function isCurrentMonth(iso: string, now = new Date()): boolean {
  const date = new Date(iso);
  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}
