import { evaluateAttendancePunctuality } from './lateToleranceRules';
import type {
  AttendanceRecord,
  Fine,
  FineStatus,
  LeaveRequest,
  Session,
} from './types';

/** Nominal denda keterlambatan standar (dalam rupiah integer) */
export const DEFAULT_FINE_AMOUNT = 10000;

/**
 * Menghasilkan ID tagihan denda yang deterministik (SRS-4.11).
 * Menggunakan format fine_{sessionId}_{studentId} agar idempoten dan mencegah duplikasi tagihan.
 */
export function generateFineId(sessionId: string, studentId: string): string {
  return `fine_${sessionId}_${studentId}`;
}

export type FineCreationResult =
  | { eligible: true; fine: Fine }
  | {
      eligible: false;
      reason: 'ontime' | 'leave_approved' | 'already_fined' | 'already_paid';
    };

/**
 * Aturan domain pembuatan tagihan denda keterlambatan (SRS-4.11):
 * - Presensi ontime (tepat waktu) TIDAK dikenakan denda.
 * - Praktikan dengan izin yang disetujui ('approved') DIBEBASKAN dari denda.
 * - Presensi terlambat ('late') menerbitkan tepat 1 tagihan denda status 'unpaid'.
 * - Bersifat idempoten (bila sudah ada tagihan unpaid/paid, tidak membuat tagihan ganda).
 */
export function evaluateFineCreationRule(params: {
  session: Pick<
    Session,
    | 'id'
    | 'classId'
    | 'courseName'
    | 'groupName'
    | 'labId'
    | 'startsAt'
    | 'toleranceMinutes'
  >;
  attendance: AttendanceRecord;
  studentLeave?: LeaveRequest;
  existingFine?: Fine;
  fineAmount?: number;
  nowIso?: string;
}): FineCreationResult {
  const {
    session,
    attendance,
    studentLeave,
    existingFine,
    fineAmount = DEFAULT_FINE_AMOUNT,
    nowIso = new Date().toISOString(),
  } = params;

  // 1. Jika sudah ada tagihan yang lunas atau aktif, cegah duplikasi tagihan (idempoten)
  if (existingFine) {
    if (existingFine.status === 'paid') {
      return { eligible: false, reason: 'already_paid' };
    }
    return { eligible: false, reason: 'already_fined' };
  }

  // 2. Jika praktikan memiliki izin yang disetujui, bebas denda
  if (studentLeave?.status === 'approved') {
    return { eligible: false, reason: 'leave_approved' };
  }

  // 3. Evaluasi ketepatan waktu presensi berdasarkan startsAt + batas toleransi
  const punctuality = evaluateAttendancePunctuality(
    session,
    attendance.checkedInAt,
  );

  if (!punctuality.isLate) {
    return { eligible: false, reason: 'ontime' };
  }

  // 4. Terbitkan tagihan denda keterlambatan status 'unpaid'
  const fineId = generateFineId(session.id, attendance.studentId);
  const newFine: Fine = {
    id: fineId,
    studentId: attendance.studentId,
    studentName: attendance.studentName,
    sessionId: session.id,
    attendanceId: attendance.id,
    classId: session.classId,
    courseName: session.courseName,
    groupName: session.groupName,
    labId: session.labId,
    amount: fineAmount,
    status: 'unpaid',
    createdAt: nowIso,
    waivedAt: null,
    waiveReason: null,
    paidAt: null,
    paymentOrderId: null,
  };

  return { eligible: true, fine: newFine };
}

export type FineWaiverResult =
  | { ok: true; updatedFine: Fine }
  | {
      ok: false;
      reason: 'leave_not_approved' | 'already_paid' | 'already_waived';
    };

/**
 * Aturan domain pembebasan tagihan denda via permohonan izin yang disetujui (SRS-4.11 & Kontrak K6).
 * - Izin berstatus 'approved' membebaskan tagihan denda yang belum dibayar ('unpaid') menjadi 'waived'.
 * - Tagihan yang sudah dibayar ('paid') tidak diubah sembarangan tanpa alur rekonsiliasi.
 */
export function waiveFineOnApprovedLeaveRule(
  fine: Fine,
  leave: LeaveRequest,
  nowIso: string = new Date().toISOString(),
): FineWaiverResult {
  if (leave.status !== 'approved') {
    return { ok: false, reason: 'leave_not_approved' };
  }

  if (fine.status === 'waived') {
    return { ok: false, reason: 'already_waived' };
  }

  if (fine.status === 'paid') {
    return { ok: false, reason: 'already_paid' };
  }

  const updatedFine: Fine = {
    ...fine,
    status: 'waived',
    waivedAt: nowIso,
    waiveReason: `Izin disetujui: ${leave.reason}`,
  };

  return { ok: true, updatedFine };
}
