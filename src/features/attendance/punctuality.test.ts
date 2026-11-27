import assert from 'node:assert/strict';
import test from 'node:test';

import type { AttendanceRecord, Session } from '../../domain/types';
import { isCurrentWeek, punctualityCounts, punctualityOf } from './punctuality';

const session: Session = {
  id: 'session-301',
  courseName: 'Praktikum Basis Data',
  groupName: 'Kelompok B',
  startsAt: '2026-11-25T08:00:00.000Z',
  endsAt: '2026-11-25T10:00:00.000Z',
  status: 'closed',
  openedAt: null,
  closedAt: null,
};

const record = (overrides: Partial<AttendanceRecord>): AttendanceRecord => ({
  id: 'record-1',
  sessionId: session.id,
  studentId: 'student-1',
  studentName: 'Ada Lovelace',
  checkedInAt: '2026-11-25T08:10:00.000Z',
  ...overrides,
});

test('punctualityOf: memakai klasifikasi backend bila tersedia', () => {
  const withinTolerance = record({
    punctuality: 'ontime',
    minutesLate: 0,
  });
  const beyondTolerance = record({
    punctuality: 'late',
    minutesLate: 10,
  });

  assert.equal(punctualityOf(withinTolerance, session), 'onTime');
  assert.equal(punctualityOf(beyondTolerance, session), 'late');
});

test('punctualityOf: jatuh ke perbandingan waktu untuk catatan lama', () => {
  const beforeStart = record({
    id: 'record-2',
    checkedInAt: '2026-11-25T07:59:00.000Z',
  });
  const afterStart = record({ id: 'record-3' });

  assert.equal(punctualityOf(beforeStart, session), 'onTime');
  assert.equal(punctualityOf(afterStart, session), 'late');
  assert.equal(punctualityOf(record({ id: 'record-4' }), undefined), 'unknown');
});

test('punctualityCounts: menjumlahkan klasifikasi backend', () => {
  const counts = punctualityCounts(
    [
      record({ id: 'record-5', punctuality: 'ontime' }),
      record({ id: 'record-6', punctuality: 'late' }),
      record({ id: 'record-7', punctuality: 'late' }),
    ],
    () => session,
  );

  assert.deepEqual(counts, { onTime: 1, late: 2, unknown: 0 });
});

test('isCurrentWeek: minggu dimulai Senin dan berakhir Minggu', () => {
  const now = new Date(2026, 10, 27, 10); // Rabu
  const iso = (day: number, hour = 8) =>
    new Date(2026, 10, day, hour).toISOString();

  assert.equal(isCurrentWeek(iso(23), now), true); // Senin
  assert.equal(isCurrentWeek(iso(29, 23), now), true); // Minggu
  assert.equal(isCurrentWeek(iso(22, 23), now), false); // Minggu lalu
  assert.equal(isCurrentWeek(iso(30), now), false); // Senin depan
});
