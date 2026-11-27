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

export function isToday(iso: string, now = new Date()): boolean {
  const date = new Date(iso);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/** Minggu dimulai Senin, mengikuti konvensi kalender di aplikasi. */
export function isCurrentWeek(iso: string, now = new Date()): boolean {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const time = new Date(iso).getTime();
  return time >= start.getTime() && time < end.getTime();
}
