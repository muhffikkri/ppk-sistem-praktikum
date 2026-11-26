import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canRequestLeave,
  canSubmitLeave,
  isLeaveBlockingCheckIn,
} from './leaveRules';
import type { AttendanceRecord, LeaveRequest, Session } from './types';

const base: Session = {
  id: 's-leave',
  courseName: 'Praktikum',
  groupName: 'A',
  startsAt: '2026-10-21T08:00:00.000Z',
  endsAt: '2026-10-21T10:00:00.000Z',
  status: 'scheduled',
  openedAt: null,
  closedAt: null,
};

const now = Date.parse('2026-10-21T09:00:00.000Z');

const leave = (status: LeaveRequest['status']): LeaveRequest => ({
  id: `${base.id}_student-1`,
  sessionId: base.id,
  classId: 'c1',
  courseName: base.courseName,
  groupName: base.groupName,
  sessionStartsAt: base.startsAt,
  studentId: 'student-1',
  studentName: 'Budhi',
  reason: 'Sakit',
  aiPrediction: { category: null, confidence: null, status: 'unavailable' },
  status,
  decisionNote: null,
  reviewedBy: null,
  reviewedAt: null,
  createdAt: base.startsAt,
});

const attendance: AttendanceRecord = {
  id: 'student-1',
  sessionId: base.id,
  studentId: 'student-1',
  studentName: 'Budhi',
  checkedInAt: '2026-10-21T08:05:00.000Z',
};

test('canSubmitLeave: scheduled dan open sebelum selesai diizinkan', () => {
  assert.equal(canSubmitLeave(base, now), true);
  assert.equal(canSubmitLeave({ ...base, status: 'open' }, now), true);
});

test('canSubmitLeave: closed, lewat jadwal, atau tanpa sesi ditolak', () => {
  assert.equal(
    canSubmitLeave({ ...base, status: 'closed' }, Date.parse(base.startsAt)),
    false,
  );
  assert.equal(canSubmitLeave(base, Date.parse(base.endsAt) + 1), false);
  assert.equal(canSubmitLeave(undefined), false);
});

test('isLeaveBlockingCheckIn: hanya izin approved yang memblokir presensi', () => {
  assert.equal(isLeaveBlockingCheckIn(leave('approved')), true);
  assert.equal(isLeaveBlockingCheckIn(leave('pending')), false);
  assert.equal(isLeaveBlockingCheckIn(leave('rejected')), false);
  assert.equal(isLeaveBlockingCheckIn(undefined), false);
});

test('canRequestLeave: sesi eligible tanpa kehadiran dan izin aktif', () => {
  assert.equal(canRequestLeave(base, undefined, undefined, now), true);
  assert.equal(canRequestLeave(base, undefined, leave('rejected'), now), true);
  assert.equal(canRequestLeave(base, undefined, leave('pending'), now), false);
  assert.equal(canRequestLeave(base, undefined, leave('approved'), now), false);
  assert.equal(canRequestLeave(base, attendance, undefined, now), false);
  assert.equal(
    canRequestLeave({ ...base, status: 'closed' }, undefined, undefined, now),
    false,
  );
});
