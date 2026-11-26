const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  QR_SLOT_MS,
  issueQrToken,
  validateQrCheckIn,
  verifyQrToken,
} = require('./attendanceQr.cjs');

const secret = 'test-only-secret';
const now = 1_764_000_000_000;
const lab = {
  labId: 'lab-rpl',
  isActive: true,
  radiusMeters: 50,
  location: { latitude: -7.05068, longitude: 110.43828 },
};
const session = {
  status: 'open',
  labId: 'lab-rpl',
  participantIds: ['budi'],
  startsAtMs: now - 10 * 60_000,
  endsAtMs: now + 50 * 60_000,
};
const inside = { latitude: -7.05068, longitude: 110.43828, accuracyMeters: 15 };

test('QR token berputar per slot dan terverifikasi dengan secret yang sama', () => {
  const issued = issueQrToken('session-01', secret, now);
  assert.equal(issued?.token.split('.')[0], 'session-01');
  assert.equal(issued?.slot % QR_SLOT_MS, 0);
  assert.equal(verifyQrToken(issued?.token, secret, now), 'session-01');
  assert.equal(
    verifyQrToken(issued?.token, secret, now + QR_SLOT_MS),
    'session-01',
  );
  assert.equal(
    verifyQrToken(issued?.token, secret, now + 2 * QR_SLOT_MS),
    null,
  );
});

test('QR token ditolak bila signature diubah atau secret berbeda', () => {
  const issued = issueQrToken('session-01', secret, now);
  assert.equal(
    verifyQrToken(issued?.token.replace(/.$/, '0'), secret, now),
    null,
  );
  assert.equal(verifyQrToken(issued?.token, 'secret-lain', now), null);
  assert.equal(
    verifyQrToken('session-01.123.' + 'a'.repeat(64), secret, now),
    null,
  );
  assert.equal(issueQrToken('../users/abc', secret, now), null);
});

test('validasi presensi QR memakai radius lab dan akurasi dari server', () => {
  assert.deepEqual(
    validateQrCheckIn({
      session,
      lab,
      location: inside,
      studentId: 'budi',
      nowMs: now,
    }),
    { ok: true, distanceMeters: 0 },
  );
  assert.equal(
    validateQrCheckIn({
      session,
      lab,
      location: { ...inside, latitude: inside.latitude - 200 / 111320 },
      studentId: 'budi',
      nowMs: now,
    }).reason,
    'outside_geofence',
  );
  assert.equal(
    validateQrCheckIn({
      session,
      lab,
      location: { ...inside, accuracyMeters: 150 },
      studentId: 'budi',
      nowMs: now,
    }).reason,
    'inaccurate_location',
  );
});

test('validasi presensi QR menolak sesi, peserta, dan jendela yang tidak sah', () => {
  for (const override of [
    { status: 'scheduled' },
    { participantIds: ['orang-lain'] },
    { startsAtMs: now - 30 * 60_000, endsAtMs: now - 20 * 60_000 },
  ]) {
    assert.equal(
      validateQrCheckIn({
        session: { ...session, ...override },
        lab,
        location: inside,
        studentId: 'budi',
        nowMs: now,
      }).reason,
      override.status
        ? 'invalid_status'
        : override.endsAtMs
          ? 'outside_window'
          : 'not_participant',
    );
  }
  assert.equal(
    validateQrCheckIn({
      session,
      lab: { ...lab, isActive: false },
      location: inside,
      studentId: 'budi',
      nowMs: now,
    }).reason,
    'lab_inactive',
  );
});
