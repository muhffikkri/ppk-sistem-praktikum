import assert from 'node:assert/strict';
import { test } from 'node:test';

import { encodeSessionQr } from '../../../domain/sessionQr';
import { buildQrRows } from './qrRows';

const token = (sessionId: string) =>
  encodeSessionQr(`${sessionId}.1764000000000.${'a'.repeat(64)}`);

test('setiap baris QR punya lebar yang sama dengan jumlah baris', () => {
  const rows = buildQrRows(token('session-02'));
  for (const runs of rows) {
    const width = runs.reduce((sum, run) => sum + run.length, 0);
    assert.equal(width, rows.length);
  }
});

test('run berdampingan selalu berganti warna', () => {
  const rows = buildQrRows(token('aB3_xY9-kLm0Zq'));
  for (const runs of rows) {
    for (let i = 1; i < runs.length; i += 1) {
      assert.notEqual(runs[i].dark, runs[i - 1].dark);
    }
  }
});

test('pola penanda posisi QR ada di pojok kiri atas', () => {
  const rows = buildQrRows(token('session-01'));
  // Baris pertama selalu diawali 7 modul gelap (finder pattern).
  assert.deepEqual(rows[0][0], { dark: true, length: 7 });
});
