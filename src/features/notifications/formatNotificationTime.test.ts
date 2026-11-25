import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatNotificationTime } from './formatNotificationTime';

const now = new Date('2026-11-25T10:00:00.000Z');

test('waktu notifikasi ditampilkan relatif untuk 24 jam terakhir', () => {
  assert.equal(
    formatNotificationTime('2026-11-25T09:59:30.000Z', now),
    'Baru saja',
  );
  assert.equal(
    formatNotificationTime('2026-11-25T09:55:00.000Z', now),
    '5 mnt lalu',
  );
  assert.equal(
    formatNotificationTime('2026-11-25T07:00:00.000Z', now),
    '3 jam lalu',
  );
});

test('notifikasi lama menampilkan tanggal, data rusak menjadi kosong', () => {
  assert.match(
    formatNotificationTime('2026-11-20T01:00:00.000Z', now),
    /20 Nov/,
  );
  assert.equal(formatNotificationTime('bukan-tanggal', now), '');
});
