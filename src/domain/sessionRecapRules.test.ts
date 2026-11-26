import assert from 'node:assert/strict';
import test from 'node:test';

import type { AttendanceRecord, LeaveRequest, Session } from './types';
import {
  buildSessionRosterRecap,
  determineParticipantStatus,
} from './sessionRecapRules';

const mockSession = (status: Session['status']): Session => ({
  id: 'session-101',
  classId: 'class-01',
  courseName: 'Praktikum Jaringan Komputer',
  groupName: 'Kelas 3SE1 - Kelompok A',
  startsAt: '2026-11-25T08:00:00.000Z',
  endsAt: '2026-11-25T10:00:00.000Z',
  status,
  openedAt:
    status === 'open' || status === 'closed'
      ? '2026-11-25T08:05:00.000Z'
      : null,
  closedAt: status === 'closed' ? '2026-11-25T10:00:00.000Z' : null,
  participantIds: ['mhs-01', 'mhs-02', 'mhs-03', 'mhs-04'],
  assistantIds: ['asprak-01'],
});

const mockLeave = (
  overrides: Partial<LeaveRequest> & { id: string; studentId: string },
): LeaveRequest => ({
  sessionId: 'session-101',
  classId: 'class-01',
  courseName: 'Praktikum Jaringan Komputer',
  groupName: 'Kelas 3SE1 - Kelompok A',
  sessionStartsAt: '2026-11-25T08:00:00.000Z',
  studentName: 'Mahasiswa Demo',
  reason: 'Alasan izin',
  aiPrediction: {
    category: 'sakit',
    confidence: 0.95,
    status: 'classified',
  },
  status: 'pending',
  decisionNote: null,
  reviewedBy: null,
  reviewedAt: null,
  createdAt: '2026-11-25T07:30:00.000Z',
  ...overrides,
});

test('determineParticipantStatus: menentukan status hadir, izin disetujui, dan alpa (SRS-4.09 & K6)', () => {
  const attendees: AttendanceRecord[] = [
    {
      id: 'att-1',
      sessionId: 'session-101',
      studentId: 'mhs-01',
      studentName: 'Budi Santoso',
      checkedInAt: '2026-11-25T08:06:00.000Z',
    },
  ];

  const approvedLeave = mockLeave({
    id: 'leave-1',
    studentId: 'mhs-02',
    studentName: 'Siti Rahma',
    reason: 'Sakit flu',
    status: 'approved',
    reviewedAt: '2026-11-25T07:45:00.000Z',
  });

  const pendingLeave = mockLeave({
    id: 'leave-2',
    studentId: 'mhs-03',
    studentName: 'Dimas Prasetyo',
    reason: 'Ada acara keluarga',
    status: 'pending',
  });

  // 1. Mahasiswa dengan presensi dan tanpa izin -> present
  const res1 = determineParticipantStatus('mhs-01', attendees, []);
  assert.equal(res1.status, 'present');
  assert.equal(res1.attendance?.studentName, 'Budi Santoso');

  // 2. Mahasiswa dengan izin disetujui -> excused (tidak hadir dengan izin)
  const res2 = determineParticipantStatus('mhs-02', [], [approvedLeave]);
  assert.equal(res2.status, 'excused');
  assert.equal(res2.approvedLeave?.reason, 'Sakit flu');

  // 3. Mahasiswa izin masih pending dan belum presensi -> absent
  const res3 = determineParticipantStatus('mhs-03', [], [pendingLeave]);
  assert.equal(res3.status, 'absent');

  // 4. Mahasiswa tanpa presensi dan tanpa izin -> absent
  const res4 = determineParticipantStatus('mhs-04', [], []);
  assert.equal(res4.status, 'absent');
});

test('determineParticipantStatus: izin disetujui menganulir presensi lama menjadi tidak hadir dengan izin (K6)', () => {
  const attendees: AttendanceRecord[] = [
    {
      id: 'att-2',
      sessionId: 'session-101',
      studentId: 'mhs-02',
      studentName: 'Siti Rahma',
      checkedInAt: '2026-11-25T08:10:00.000Z',
    },
  ];

  const approvedLeave = mockLeave({
    id: 'leave-1',
    studentId: 'mhs-02',
    studentName: 'Siti Rahma',
    reason: 'Sakit mendadak',
    status: 'approved',
  });

  // Sekalipun terdapat data scan/presensi, izin yang disetujui tetap menghasilkan status excused
  const res = determineParticipantStatus('mhs-02', attendees, [approvedLeave]);
  assert.equal(res.status, 'excused');
});

test('buildSessionRosterRecap: menghasilkan ringkasan peserta lengkap dan agregat statistik (SRS-4.09)', () => {
  const session = mockSession('closed');
  const attendees: AttendanceRecord[] = [
    {
      id: 'att-1',
      sessionId: session.id,
      studentId: 'mhs-01',
      studentName: 'Budi Santoso',
      checkedInAt: '2026-11-25T08:06:00.000Z',
    },
  ];

  const leaves: LeaveRequest[] = [
    mockLeave({
      id: 'leave-1',
      studentId: 'mhs-02',
      studentName: 'Siti Rahma',
      reason: 'Sakit flu',
      status: 'approved',
    }),
  ];

  const studentNamesById = {
    'mhs-01': 'Budi Santoso',
    'mhs-02': 'Siti Rahma',
    'mhs-03': 'Dimas Prasetyo',
    'mhs-04': 'Eko Patrio',
  };

  const recap = buildSessionRosterRecap({
    participantIds: session.participantIds ?? [],
    attendees,
    leaves,
    studentNamesById,
  });

  // Ringkasan
  assert.equal(recap.summary.total, 4);
  assert.equal(recap.summary.presentCount, 1);
  assert.equal(recap.summary.excusedCount, 1);
  assert.equal(recap.summary.absentCount, 2);

  // Urutan entri: Hadir -> Izin -> Belum hadir
  assert.equal(recap.entries[0].studentId, 'mhs-01');
  assert.equal(recap.entries[0].status, 'present');

  assert.equal(recap.entries[1].studentId, 'mhs-02');
  assert.equal(recap.entries[1].status, 'excused');
  assert.equal(recap.entries[1].leaveReason, 'Sakit flu');

  const absentEntries = recap.entries.filter((e) => e.status === 'absent');
  assert.equal(absentEntries.length, 2);
  assert.deepEqual(absentEntries.map((e) => e.studentId).sort(), [
    'mhs-03',
    'mhs-04',
  ]);
});
