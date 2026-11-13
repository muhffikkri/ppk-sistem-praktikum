import type { AttendanceRecord } from '../../domain/types';

type TimestampLike = { toDate: () => Date };

export function normalizeAttendanceRecord(
  id: string,
  data: Record<string, unknown>,
): AttendanceRecord {
  const checkedInAt = data.checkedInAt as unknown;

  return {
    ...data,
    id,
    checkedInAt:
      typeof (checkedInAt as TimestampLike | undefined)?.toDate === 'function'
        ? (checkedInAt as TimestampLike).toDate().toISOString()
        : (checkedInAt as string),
  } as AttendanceRecord;
}
