import assert from 'node:assert/strict';
import { test } from 'node:test';

import { encodeSessionQr, parseSessionQr } from './sessionQr';

test('encode lalu parse mengembalikan ID sesi yang sama', () => {
  assert.equal(parseSessionQr(encodeSessionQr('session-02')), 'session-02');
  assert.equal(parseSessionQr(encodeSessionQr('aB3_xY9-kLm0')), 'aB3_xY9-kLm0');
});

test('spasi di awal/akhir hasil scan diabaikan', () => {
  assert.equal(parseSessionQr('  ppk-presensi:session-01\n'), 'session-01');
});

test('QR tanpa awalan presensi ditolak', () => {
  assert.equal(parseSessionQr('session-01'), null);
  assert.equal(parseSessionQr('https://example.com'), null);
  assert.equal(parseSessionQr('8991234567890'), null);
});

test('ID sesi kosong atau berisi karakter path ditolak', () => {
  assert.equal(parseSessionQr('ppk-presensi:'), null);
  assert.equal(parseSessionQr('ppk-presensi:../users/abc'), null);
  assert.equal(parseSessionQr('ppk-presensi:a b'), null);
});
