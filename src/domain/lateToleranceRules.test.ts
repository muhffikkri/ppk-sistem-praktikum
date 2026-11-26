import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateToleranceDeadline,
  evaluateAttendancePunctuality,
} from './lateToleranceRules';
import type { Session } from './types';

const baseSession: Session = {
  id: 'session-201',
  classId: 'class-01',
  courseName: 'Praktikum Basis Data',
  groupName: 'Kelas 3SE2 - Kelompok B',
  startsAt: '2026-11-25T08:00:00.000Z',
  endsAt: '2026-11-25T10:00:00.000Z',
  status: 'open',
  openedAt: '2026-11-25T08:05:00.000Z', // Dibuka telat oleh asprak
  closedAt: null,
};

test('calculateToleranceDeadline: menghitung batas toleransi dari startsAt (SRS-4.10)', () => {
  // Default 15 menit: 08:00:00 + 15 menit = 08:15:00
  const deadlineDefault = calculateToleranceDeadline(baseSession.startsAt);
  assert.equal(deadlineDefault, '2026-11-25T08:15:00.000Z');

  // Custom 20 menit: 08:00:00 + 20 menit = 08:20:00
  const deadlineCustom = calculateToleranceDeadline(baseSession.startsAt, 20);
  assert.equal(deadlineCustom, '2026-11-25T08:20:00.000Z');
});

test('evaluateAttendancePunctuality: presensi sebelum atau tepat di batas adalah ontime (SRS-4.10)', () => {
  // 1. Presensi tepat saat sesi dimulai (08:00:00) -> ontime
  const resStart = evaluateAttendancePunctuality(
    baseSession,
    '2026-11-25T08:00:00.000Z',
  );
  assert.equal(resStart.status, 'ontime');
  assert.equal(resStart.isLate, false);
  assert.equal(resStart.minutesLate, 0);

  // 2. Presensi 10 menit setelah mulai (08:10:00) -> ontime
  const resMid = evaluateAttendancePunctuality(
    baseSession,
    '2026-11-25T08:10:00.000Z',
  );
  assert.equal(resMid.status, 'ontime');
  assert.equal(resMid.isLate, false);
  assert.equal(resMid.minutesLate, 0);

  // 3. Presensi PERSIS di batas toleransi (08:15:00.000) -> ontime
  const resExact = evaluateAttendancePunctuality(
    baseSession,
    '2026-11-25T08:15:00.000Z',
  );
  assert.equal(resExact.status, 'ontime');
  assert.equal(resExact.isLate, false);
  assert.equal(resExact.minutesLate, 0);
});

test('evaluateAttendancePunctuality: presensi setelah batas toleransi adalah late (SRS-4.10)', () => {
  // 1. Presensi lewat 1 detik dari batas toleransi (08:15:01) -> late (1 menit)
  const resOneSec = evaluateAttendancePunctuality(
    baseSession,
    '2026-11-25T08:15:01.000Z',
  );
  assert.equal(resOneSec.status, 'late');
  assert.equal(resOneSec.isLate, true);
  assert.equal(resOneSec.minutesLate, 1);

  // 2. Presensi 10 menit setelah batas (08:25:00) -> late (10 menit)
  const resTenMin = evaluateAttendancePunctuality(
    baseSession,
    '2026-11-25T08:25:00.000Z',
  );
  assert.equal(resTenMin.status, 'late');
  assert.equal(resTenMin.isLate, true);
  assert.equal(resTenMin.minutesLate, 10);
});

test('evaluateAttendancePunctuality: mengabaikan openedAt sesuai aturan PRD (SRS-4.10)', () => {
  // Sesi dengan openedAt jam 08:10:00 (dibuka terlambat 10 menit oleh asisten).
  // Batas toleransi tetap 08:15:00 karena dihitung dari startsAt (08:00:00), bukan openedAt.
  const lateOpenedSession: Session = {
    ...baseSession,
    openedAt: '2026-11-25T08:10:00.000Z',
  };

  // Presensi jam 08:14:00 (hanya 4 menit setelah dibuka, tapi masih sebelum batas 08:15:00) -> ontime
  const resBefore = evaluateAttendancePunctuality(
    lateOpenedSession,
    '2026-11-25T08:14:00.000Z',
  );
  assert.equal(resBefore.status, 'ontime');
  assert.equal(resBefore.isLate, false);

  // Presensi jam 08:16:00 (hanya 6 menit setelah dibuka, tapi sudah lewat batas 08:15:00) -> late
  const resAfter = evaluateAttendancePunctuality(
    lateOpenedSession,
    '2026-11-25T08:16:00.000Z',
  );
  assert.equal(resAfter.status, 'late');
  assert.equal(resAfter.isLate, true);
});

test('evaluateAttendancePunctuality: menggunakan toleransi kustom dari konfigurasi sesi', () => {
  const sessionWithCustomTolerance: Session = {
    ...baseSession,
    toleranceMinutes: 30, // Toleransi 30 menit
  };

  // Presensi jam 08:25:00 (lewat default 15 menit, tapi dalam toleransi 30 menit) -> ontime
  const res = evaluateAttendancePunctuality(
    sessionWithCustomTolerance,
    '2026-11-25T08:25:00.000Z',
  );
  assert.equal(res.status, 'ontime');
  assert.equal(res.isLate, false);

  // Presensi jam 08:35:00 (lewat 30 menit) -> late (5 menit)
  const resLate = evaluateAttendancePunctuality(
    sessionWithCustomTolerance,
    '2026-11-25T08:35:00.000Z',
  );
  assert.equal(resLate.status, 'late');
  assert.equal(resLate.minutesLate, 5);
});
