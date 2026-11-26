import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CHECK_IN_EARLY_MS,
  CHECK_IN_LATE_MS,
  cancelSessionRule,
  findOpenSessionConflict,
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

const managed: Session = {
  ...session,
  id: 's-managed',
  labId: 'lab-a',
  assistantIds: ['asprak-1'],
};

const openElsewhere: Session = {
  ...managed,
  id: 's-elsewhere',
  labId: 'lab-b',
  status: 'open',
  openedAt: '2026-10-21T08:00:00.000Z',
};

const contextFor = (openSessions: Session[]) => ({
  actorUid: 'asprak-1',
  openSessions,
});

test('findOpenSessionConflict: sesi open asprak lain terdeteksi', () => {
  assert.equal(
    findOpenSessionConflict(
      managed,
      [{ ...openElsewhere, labId: 'lab-a' }],
      'asprak-1',
    )?.id,
    's-elsewhere',
    'lab sama tetap konflik',
  );
  assert.equal(
    findOpenSessionConflict(managed, [openElsewhere], 'asprak-1')?.id,
    's-elsewhere',
    'lab berbeda tetap konflik',
  );
  assert.equal(
    findOpenSessionConflict(managed, [openElsewhere], 'asprak-2'),
    undefined,
    'sesi asprak lain tidak menghalangi',
  );
  assert.equal(
    findOpenSessionConflict(managed, [], 'asprak-1'),
    undefined,
    'tanpa sesi open tidak ada konflik',
  );
});

test('openSessionRule: sesi open lain menolak pembukaan', () => {
  for (const other of [openElsewhere, { ...openElsewhere, labId: 'lab-a' }]) {
    const result = openSessionRule(
      managed,
      '2026-10-21T08:00:00.000Z',
      contextFor([other]),
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, 'active_session_conflict');
    }
  }
});

test('openSessionRule: sesi closed/cancelled tidak dihitung konflik', () => {
  for (const status of ['closed', 'cancelled'] as const) {
    const result = openSessionRule(
      managed,
      '2026-10-21T08:00:00.000Z',
      contextFor([{ ...openElsewhere, status }]),
    );
    assert.equal(result.ok, true, `${status} tidak memblokir`);
  }
});

test('openSessionRule: buka ulang sesi sendiri tetap diperbolehkan', () => {
  const result = openSessionRule(
    { ...managed, status: 'closed', closedAt: '2026-10-21T08:05:00.000Z' },
    '2026-10-21T08:06:00.000Z',
    contextFor([{ ...openElsewhere, assistantIds: ['asprak-2'] }]),
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.updatedSession.closedAt, null);
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

test('cancelSessionRule: hanya sesi scheduled yang bisa dibatalkan', () => {
  const cancelled = cancelSessionRule(session, '2026-10-21T07:00:00.000Z');
  assert.equal(cancelled.ok, true);
  if (cancelled.ok) {
    assert.equal(cancelled.updatedSession.status, 'cancelled');
    assert.equal(
      cancelled.updatedSession.cancelledAt,
      '2026-10-21T07:00:00.000Z',
    );
  }
  assert.equal(
    cancelSessionRule({ ...session, status: 'open' }).ok,
    false,
    'sesi open tidak bisa dibatalkan lewat aksi ini',
  );
  assert.equal(
    openSessionRule({ ...session, status: 'cancelled' }).ok,
    false,
    'sesi cancelled tidak bisa dibuka',
  );
});
