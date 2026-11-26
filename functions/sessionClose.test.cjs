const assert = require('node:assert/strict');
const test = require('node:test');

const { closeExpiredSession, LATE_CHECK_IN_MS } = require('./sessionClose.cjs');

const now = Date.parse('2026-10-21T11:00:00.000Z');
const endsAtMs = Date.parse('2026-10-21T10:00:00.000Z');

test('closeExpiredSession: sesi open lewat toleransi ditutup', () => {
  const patch = closeExpiredSession(
    { status: 'open', endsAt: new Date(endsAtMs).toISOString(), endsAtMs },
    now,
  );
  assert.deepEqual(patch, {
    status: 'closed',
    closedAt: '2026-10-21T11:00:00.000Z',
  });
});

test('closeExpiredSession: masih dalam toleransi tidak ditutup', () => {
  assert.equal(
    closeExpiredSession(
      { status: 'open', endsAtMs },
      endsAtMs + LATE_CHECK_IN_MS - 1,
    ),
    null,
  );
});

test('closeExpiredSession: sesi bukan open tidak diubah', () => {
  assert.equal(closeExpiredSession({ status: 'closed', endsAtMs }, now), null);
  assert.equal(
    closeExpiredSession({ status: 'scheduled', endsAtMs }, now),
    null,
  );
  assert.equal(closeExpiredSession(undefined, now), null);
});
