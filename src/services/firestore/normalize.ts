import type { AttendanceRecord } from '../../domain/types';

type TimestampLike = { toDate: () => Date };

export function asIso(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof (value as TimestampLike).toDate === 'function') {
    return (value as TimestampLike).toDate().toISOString();
  }
  return '';
}

export function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

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
