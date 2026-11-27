import type { AttendanceRecord, Session } from '../../domain/types';
import type { AvatarTone } from '../../shared/ui';
import { punctualityOf } from './punctuality';

export type AttendeePreview = {
  id: string;
  name: string;
  tone: AvatarTone;
};

export type SessionAttendanceGroup = {
  session: Session;
  records: AttendanceRecord[];
  onTime: number;
  late: number;
  preview: AttendeePreview[];
};

const PREVIEW_LIMIT = 3;

const toneOf = (record: AttendanceRecord, session: Session): AvatarTone => {
  const punctual = punctualityOf(record, session);
  return punctual === 'onTime'
    ? 'lime'
    : punctual === 'late'
      ? 'pink'
      : 'lavender';
};

/** Satu entri riwayat presensi: jumlah hadir dan cuplikan 2–3 praktikan. */
export function buildSessionAttendanceGroup(
  session: Session,
  records: readonly AttendanceRecord[],
): SessionAttendanceGroup {
  let onTime = 0;
  let late = 0;
  for (const record of records) {
    const punctual = punctualityOf(record, session);
    if (punctual === 'onTime') onTime += 1;
    if (punctual === 'late') late += 1;
  }
  const preview = [...records]
    .sort((a, b) => Date.parse(b.checkedInAt) - Date.parse(a.checkedInAt))
    .slice(0, PREVIEW_LIMIT)
    .map((record) => ({
      id: record.id,
      name: record.studentName,
      tone: toneOf(record, session),
    }));
  return { session, records: [...records], onTime, late, preview };
}
