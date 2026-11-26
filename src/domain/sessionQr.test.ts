import assert from 'node:assert/strict';
import { test } from 'node:test';

import { encodeSessionQr, parseSessionQr } from './sessionQr';

const sampleToken = (sessionId: string) =>
  `${sessionId}.1764000000000.${'a'.repeat(64)}`;

test('encode lalu parse mengembalikan sessionId dan token yang sama', () => {
  for (const sessionId of ['session-02', 'aB3_xY9-kLm0']) {
    const token = sampleToken(sessionId);
    assert.deepEqual(parseSessionQr(encodeSessionQr(token)), {
      sessionId,
      token,
    });
  }
});

test('spasi di awal/akhir hasil scan diabaikan', () => {
  const token = sampleToken('session-01');
  assert.deepEqual(parseSessionQr(`  ${encodeSessionQr(token)}\n`), {
    sessionId: 'session-01',
    token,
  });
});

test('QR statis dan QR tanpa awalan presensi ditolak', () => {
  assert.equal(parseSessionQr('session-01'), null);
  assert.equal(parseSessionQr('ppk-presensi:session-01'), null);
  assert.equal(parseSessionQr('https://example.com'), null);
  assert.equal(parseSessionQr('8991234567890'), null);
});

test('token rusak ditolak', () => {
  assert.equal(parseSessionQr('ppk-presensi:v1:'), null);
  assert.equal(
    parseSessionQr(
      `ppk-presensi:v1:../users/abc.1764000000000.${'a'.repeat(64)}`,
    ),
    null,
  );
  assert.equal(
    parseSessionQr(`ppk-presensi:v1:session-01.${'a'.repeat(64)}`),
    null,
  );
  assert.equal(
    parseSessionQr('ppk-presensi:v1:session-01.1764000000000.z'),
    null,
  );
});
