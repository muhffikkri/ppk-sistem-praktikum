import { AttendanceRecord, DemoStudent, Session, SessionActionFailure } from './types';

export type AttendanceCheckInResult =
  | { ok: true; record: AttendanceRecord }
  | { ok: false; reason: SessionActionFailure };

/**
 * Aturan domain untuk pencatatan presensi praktikan.
 * - Sesi harus ada dan berstatus 'open'.
 * - Mahasiswa belum boleh presensi di sesi yang sama (pencegahan duplikasi).
 * - Menghasilkan AttendanceRecord baru dengan timestamp saat ini.
 */
export function checkInRule(
  session: Session | undefined,
  student: DemoStudent,
  existingRecords: AttendanceRecord[],
  nowIso: string = new Date().toISOString()
): AttendanceCheckInResult {
  if (!session) {
    return { ok: false, reason: 'session_not_found' };
  }

  if (session.status !== 'open') {
    return { ok: false, reason: 'invalid_status' };
  }

  const alreadyCheckedIn = existingRecords.some(
    (record) => record.sessionId === session.id && record.studentId === student.id
  );

  if (alreadyCheckedIn) {
    return { ok: false, reason: 'already_checked_in' };
  }

  const newRecord: AttendanceRecord = {
    id: `att-${Date.now()}-${student.id}`,
    sessionId: session.id,
    studentId: student.id,
    studentName: student.displayName,
    checkedInAt: nowIso,
  };

  return { ok: true, record: newRecord };
}
