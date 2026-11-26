import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CHECK_IN_EARLY_MS,
  CHECK_IN_LATE_MS,
  isWithinCheckInWindow,
  openSessionRule,
} from './sessionRules';
import type { Session } from './types';

const session: Session = {
  id: 's-window',
  courseName: 'Praktikum',
  groupName: 'A',
  startsAt: '2026-10-21T08:00:00.000Z',
  endsAt: '2026-10-21T10:00:00.000Z',
  status: 'scheduled',
  openedAt: null,
  closedAt: null,
};

test('openSessionRule: hanya di jendela jadwal', () => {
  assert.equal(
    openSessionRule(session, '2026-10-21T07:44:00.000Z').ok,
    false,
    'terlalu awal ditolak',
  );
  const opened = openSessionRule(session, '2026-10-21T07:45:00.000Z');
  assert.equal(opened.ok, true, '15 menit sebelum mulai diizinkan');
  assert.equal(
    openSessionRule(session, '2026-10-21T10:01:00.000Z').ok,
    false,
    'setelah selesai ditolak',
  );
  assert.equal(
    openSessionRule({ ...session, status: 'open' }, '2026-10-21T08:30:00.000Z')
      .ok,
    false,
    'sesi sudah open tidak dibuka lagi',
  );
});

test('openSessionRule: sesi yang salah tutup bisa dibuka ulang di jendela', () => {
  const closed = openSessionRule(session, '2026-10-21T08:00:00.000Z');
  assert.equal(closed.ok, true);
  if (!closed.ok) return;
  const reopened = openSessionRule(
    {
      ...closed.updatedSession,
      status: 'closed',
      closedAt: '2026-10-21T08:05:00.000Z',
    },
    '2026-10-21T08:06:00.000Z',
  );
  assert.equal(reopened.ok, true);
  if (reopened.ok) {
    assert.equal(reopened.updatedSession.closedAt, null);
  }
});

test('isWithinCheckInWindow: toleransi 10 menit setelah selesai', () => {
  const open: Session = { ...session, status: 'open' };
  assert.equal(
    isWithinCheckInWindow(
      open,
      Date.parse(session.startsAt) - CHECK_IN_EARLY_MS,
    ),
    true,
  );
  assert.equal(
    isWithinCheckInWindow(open, Date.parse(session.endsAt) + CHECK_IN_LATE_MS),
    true,
  );
  assert.equal(
    isWithinCheckInWindow(
      open,
      Date.parse(session.endsAt) + CHECK_IN_LATE_MS + 1,
    ),
    false,
  );
});
