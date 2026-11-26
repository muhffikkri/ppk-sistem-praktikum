const assert = require('node:assert/strict');
const test = require('node:test');

const { OPEN_EARLY_MS, openSessionPatch } = require('./sessionOpen.cjs');

const startsAtMs = Date.parse('2026-10-21T08:00:00.000Z');
const endsAtMs = Date.parse('2026-10-21T10:00:00.000Z');
const now = Date.parse('2026-10-21T08:30:00.000Z');

const scheduled = {
  id: 's-target',
  status: 'scheduled',
  labId: 'lab-a',
  assistantIds: ['asprak-1'],
  startsAt: new Date(startsAtMs).toISOString(),
  endsAt: new Date(endsAtMs).toISOString(),
  startsAtMs,
  endsAtMs,
};

const openElsewhere = {
  ...scheduled,
  id: 's-open',
  labId: 'lab-b',
  status: 'open',
  openedAt: new Date(startsAtMs).toISOString(),
};

test('openSessionPatch: menyiapkan patch buka sesi', () => {
  assert.deepEqual(openSessionPatch(scheduled, now), {
    patch: {
      status: 'open',
      openedAt: '2026-10-21T08:30:00.000Z',
      closedAt: null,
    },
  });
  assert.deepEqual(openSessionPatch(scheduled, startsAtMs - OPEN_EARLY_MS), {
    patch: {
      status: 'open',
      openedAt: '2026-10-21T07:45:00.000Z',
      closedAt: null,
    },
  });
});

test('openSessionPatch: menolak status dan jendela yang tidak valid', () => {
  assert.deepEqual(openSessionPatch(undefined, now), {
    error: 'session_not_found',
  });
  assert.deepEqual(openSessionPatch({ ...scheduled, status: 'open' }, now), {
    error: 'invalid_status',
  });
  assert.deepEqual(
    openSessionPatch({ ...scheduled, status: 'cancelled' }, now),
    {
      error: 'invalid_status',
    },
  );
  assert.deepEqual(
    openSessionPatch(scheduled, startsAtMs - OPEN_EARLY_MS - 1),
    { error: 'outside_window' },
  );
  assert.deepEqual(openSessionPatch(scheduled, endsAtMs + 1), {
    error: 'outside_window',
  });
});

test('openSessionPatch: konflik sesi open asprak yang sama ditolak', () => {
  const sameLab = { ...openElsewhere, labId: 'lab-a' };
  for (const other of [openElsewhere, sameLab]) {
    assert.deepEqual(openSessionPatch(scheduled, now, [other], 'asprak-1'), {
      error: 'active_session_conflict',
    });
  }
});

test('openSessionPatch: sesi asprak lain dan sesi non-open tidak menghalangi', () => {
  assert.deepEqual(
    openSessionPatch(scheduled, now, [openElsewhere], 'asprak-2'),
    { patch: openSessionPatch(scheduled, now).patch },
  );
  for (const status of ['closed', 'cancelled']) {
    assert.deepEqual(
      openSessionPatch(
        scheduled,
        now,
        [{ ...openElsewhere, status }],
        'asprak-1',
      ),
      { patch: openSessionPatch(scheduled, now).patch },
    );
  }
});

test('openSessionPatch: buka ulang sesi closed milik sendiri diperbolehkan', () => {
  const closed = {
    ...scheduled,
    status: 'closed',
    openedAt: new Date(startsAtMs).toISOString(),
    closedAt: new Date(startsAtMs + 5 * 60_000).toISOString(),
  };
  assert.deepEqual(openSessionPatch(closed, now, [openElsewhere], 'asprak-1'), {
    error: 'active_session_conflict',
  });
  assert.deepEqual(
    openSessionPatch(
      closed,
      now,
      [{ ...openElsewhere, assistantIds: ['asprak-2'] }],
      'asprak-1',
    ),
    { patch: openSessionPatch(closed, now).patch },
  );
});
