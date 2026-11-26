import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_FINE_AMOUNT,
  evaluateFineCreationRule,
  generateFineId,
  waiveFineOnApprovedLeaveRule,
} from './fineRules';
import type { AttendanceRecord, Fine, LeaveRequest, Session } from './types';

const mockSession: Session = {
  id: 'session-301',
  classId: 'class-01',
  courseName: 'Praktikum Sistem Terdistribusi',
  groupName: 'Kelas 3SE1 - Kelompok A',
  startsAt: '2026-11-26T08:00:00.000Z',
  endsAt: '2026-11-26T10:00:00.000Z',
  status: 'open',
  openedAt: '2026-11-26T08:00:00.000Z',
  closedAt: null,
  toleranceMinutes: 15, // Batas toleransi = 08:15:00
};

const mockLeave = (
  overrides: Partial<LeaveRequest> & { id: string; studentId: string },
): LeaveRequest => ({
  sessionId: 'session-301',
  classId: 'class-01',
  courseName: 'Praktikum Sistem Terdistribusi',
  groupName: 'Kelas 3SE1 - Kelompok A',
  sessionStartsAt: '2026-11-26T08:00:00.000Z',
  studentName: 'Mahasiswa Demo',
  reason: 'Sakit',
  aiPrediction: {
    category: 'sakit',
    confidence: 0.9,
    status: 'classified',
  },
  status: 'pending',
  decisionNote: null,
  reviewedBy: null,
  reviewedAt: null,
  createdAt: '2026-11-26T07:30:00.000Z',
  ...overrides,
});

test('generateFineId: menghasilkan ID deterministik format fine_{sessionId}_{studentId}', () => {
  const id = generateFineId('session-301', 'mhs-101');
  assert.equal(id, 'fine_session-301_mhs-101');
});

test('evaluateFineCreationRule: presensi tepat waktu tidak menerbitkan tagihan denda (SRS-4.10 & SRS-4.11)', () => {
  const ontimeAttendance: AttendanceRecord = {
    id: 'att-ontime',
    sessionId: mockSession.id,
    studentId: 'mhs-101',
    studentName: 'Budi Santoso',
    checkedInAt: '2026-11-26T08:14:59.000Z', // Sebelum 08:15:00
  };

  const result = evaluateFineCreationRule({
    session: mockSession,
    attendance: ontimeAttendance,
  });

  assert.equal(result.eligible, false);
  if (!result.eligible) {
    assert.equal(result.reason, 'ontime');
  }
});

test('evaluateFineCreationRule: presensi terlambat menerbitkan 1 tagihan denda status unpaid (SRS-4.11)', () => {
  const lateAttendance: AttendanceRecord = {
    id: 'att-late',
    sessionId: mockSession.id,
    studentId: 'mhs-102',
    studentName: 'Siti Rahma',
    checkedInAt: '2026-11-26T08:20:00.000Z', // Lewat toleransi 08:15:00
  };

  const result = evaluateFineCreationRule({
    session: mockSession,
    attendance: lateAttendance,
    fineAmount: 15000,
    nowIso: '2026-11-26T08:20:05.000Z',
  });

  assert.equal(result.eligible, true);
  if (result.eligible) {
    assert.equal(result.fine.id, 'fine_session-301_mhs-102');
    assert.equal(result.fine.studentId, 'mhs-102');
    assert.equal(result.fine.sessionId, 'session-301');
    assert.equal(result.fine.attendanceId, 'att-late');
    assert.equal(result.fine.amount, 15000);
    assert.equal(result.fine.status, 'unpaid');
    assert.equal(result.fine.createdAt, '2026-11-26T08:20:05.000Z');
  }
});

test('evaluateFineCreationRule: izin disetujui membebaskan praktikan dari pembuatan denda (SRS-4.11)', () => {
  const lateAttendance: AttendanceRecord = {
    id: 'att-late',
    sessionId: mockSession.id,
    studentId: 'mhs-103',
    studentName: 'Dimas Prasetyo',
    checkedInAt: '2026-11-26T08:30:00.000Z',
  };

  const approvedLeave = mockLeave({
    id: 'leave-appr',
    studentId: 'mhs-103',
    status: 'approved',
    reason: 'Rawat inap',
  });

  const result = evaluateFineCreationRule({
    session: mockSession,
    attendance: lateAttendance,
    studentLeave: approvedLeave,
  });

  assert.equal(result.eligible, false);
  if (!result.eligible) {
    assert.equal(result.reason, 'leave_approved');
  }
});

test('evaluateFineCreationRule: idempoten, tidak membuat tagihan ganda jika tagihan sudah ada (SRS-4.11)', () => {
  const lateAttendance: AttendanceRecord = {
    id: 'att-late',
    sessionId: mockSession.id,
    studentId: 'mhs-102',
    studentName: 'Siti Rahma',
    checkedInAt: '2026-11-26T08:20:00.000Z',
  };

  const existingUnpaidFine: Fine = {
    id: 'fine_session-301_mhs-102',
    studentId: 'mhs-102',
    studentName: 'Siti Rahma',
    sessionId: 'session-301',
    attendanceId: 'att-late',
    amount: DEFAULT_FINE_AMOUNT,
    status: 'unpaid',
    createdAt: '2026-11-26T08:20:05.000Z',
  };

  const result = evaluateFineCreationRule({
    session: mockSession,
    attendance: lateAttendance,
    existingFine: existingUnpaidFine,
  });

  assert.equal(result.eligible, false);
  if (!result.eligible) {
    assert.equal(result.reason, 'already_fined');
  }
});

test('waiveFineOnApprovedLeaveRule: mengubah status tagihan unpaid menjadi waived saat izin disetujui (SRS-4.11)', () => {
  const unpaidFine: Fine = {
    id: 'fine_session-301_mhs-104',
    studentId: 'mhs-104',
    studentName: 'Eko Patrio',
    sessionId: 'session-301',
    attendanceId: 'att-late-104',
    amount: DEFAULT_FINE_AMOUNT,
    status: 'unpaid',
    createdAt: '2026-11-26T08:25:00.000Z',
  };

  const approvedLeave = mockLeave({
    id: 'leave-104',
    studentId: 'mhs-104',
    status: 'approved',
    reason: 'Demam tinggi',
  });

  const result = waiveFineOnApprovedLeaveRule(
    unpaidFine,
    approvedLeave,
    '2026-11-26T09:00:00.000Z',
  );

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.updatedFine.status, 'waived');
    assert.equal(result.updatedFine.waivedAt, '2026-11-26T09:00:00.000Z');
    assert.match(result.updatedFine.waiveReason ?? '', /Demam tinggi/);
  }
});

test('waiveFineOnApprovedLeaveRule: menolak pembebasan jika status tagihan sudah paid atau izin belum approved', () => {
  const paidFine: Fine = {
    id: 'fine_session-301_mhs-105',
    studentId: 'mhs-105',
    studentName: 'Rina',
    sessionId: 'session-301',
    attendanceId: 'att-late-105',
    amount: DEFAULT_FINE_AMOUNT,
    status: 'paid',
    createdAt: '2026-11-26T08:25:00.000Z',
    paidAt: '2026-11-26T08:50:00.000Z',
  };

  const approvedLeave = mockLeave({
    id: 'leave-105',
    studentId: 'mhs-105',
    status: 'approved',
  });

  // Tagihan yang sudah paid tidak di-waive sembarangan
  const resPaid = waiveFineOnApprovedLeaveRule(paidFine, approvedLeave);
  assert.equal(resPaid.ok, false);
  if (!resPaid.ok) {
    assert.equal(resPaid.reason, 'already_paid');
  }

  // Tagihan unpaid tetapi izin masih pending
  const unpaidFine: Fine = {
    ...paidFine,
    status: 'unpaid',
    paidAt: undefined,
  };
  const pendingLeave = mockLeave({
    id: 'leave-105-p',
    studentId: 'mhs-105',
    status: 'pending',
  });
  const resPending = waiveFineOnApprovedLeaveRule(unpaidFine, pendingLeave);
  assert.equal(resPending.ok, false);
  if (!resPending.ok) {
    assert.equal(resPending.reason, 'leave_not_approved');
  }
});
