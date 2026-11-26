import { isWithinCheckInWindow } from './sessionRules';
import {
  AttendanceRecord,
  DemoStudent,
  Session,
  SessionActionFailure,
} from './types';

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
  nowIso: string = new Date().toISOString(),
): AttendanceCheckInResult {
  if (!session) {
    return { ok: false, reason: 'session_not_found' };
  }

  if (session.status !== 'open') {
    return { ok: false, reason: 'invalid_status' };
  }

  if (!isWithinCheckInWindow(session, Date.parse(nowIso))) {
    return { ok: false, reason: 'outside_window' };
  }

  const alreadyCheckedIn = existingRecords.some(
    (record) =>
      record.sessionId === session.id && record.studentId === student.id,
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

export function checkInFailureMessage(reason: SessionActionFailure): string {
  switch (reason) {
    case 'invalid_status':
      return 'Sesi belum dibuka atau sudah ditutup.';
    case 'already_checked_in':
      return 'Kamu sudah presensi di sesi ini.';
    case 'outside_window':
      return 'Presensi hanya tersedia mulai 15 menit sebelum jadwal sampai 10 menit setelah sesi selesai.';
    default:
      return 'Sesi tidak ditemukan.';
  }
}
