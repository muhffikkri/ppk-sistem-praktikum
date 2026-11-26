import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  countUnread,
  notificationRoute,
  toInboxNotification,
  unreadBadgeLabel,
  type InboxNotification,
} from './notificationTypes';

test('sesi dibuka membuka halaman presensi, jadwal membuka detail sesi', () => {
  assert.deepEqual(
    notificationRoute({ type: 'session_opened', sessionId: 's1' }),
    { screen: 'StudentCheckIn', sessionId: 's1' },
  );
  for (const type of ['session_scheduled', 'schedule_changed'] as const) {
    assert.deepEqual(notificationRoute({ type, sessionId: 's1' }), {
      screen: 'StudentSessionDetail',
      sessionId: 's1',
    });
  }
  assert.deepEqual(
    notificationRoute({ type: 'leave_decided', leaveId: 'l1' }),
    {
      screen: 'StudentLeaveList',
    },
  );
});

test('notifikasi tanpa ID tujuan tidak membuka apa pun', () => {
  assert.equal(notificationRoute({ type: 'session_opened' }), null);
  assert.equal(notificationRoute({ type: 'leave_decided' }), null);
});

test('data Firestore yang rusak diabaikan', () => {
  assert.equal(
    toInboxNotification('n1', { type: 'unknown', title: 'x', createdAt: 'x' }),
    null,
  );
  assert.equal(
    toInboxNotification('n1', { type: 'session_opened', createdAt: 'x' }),
    null,
  );
  assert.deepEqual(
    toInboxNotification('n1', {
      type: 'session_opened',
      title: 'Sesi praktikum dibuka',
      body: 'RPL · A sudah dibuka.',
      sessionId: 's1',
      createdAt: '2026-11-25T10:00:00.000Z',
      readAt: null,
      extra: 'diabaikan',
    }),
    {
      id: 'n1',
      type: 'session_opened',
      title: 'Sesi praktikum dibuka',
      body: 'RPL · A sudah dibuka.',
      sessionId: 's1',
      createdAt: '2026-11-25T10:00:00.000Z',
      readAt: null,
    },
  );
});

test('badge menghitung yang belum dibaca dan dibatasi 9+', () => {
  const base: InboxNotification = {
    id: 'n',
    type: 'session_opened',
    title: 't',
    body: '',
    createdAt: '2026-11-25T10:00:00.000Z',
    readAt: null,
  };
  assert.equal(
    countUnread([base, { ...base, readAt: '2026-11-25T10:01:00.000Z' }, base]),
    2,
  );
  assert.equal(unreadBadgeLabel(0), null);
  assert.equal(unreadBadgeLabel(3), '3');
  assert.equal(unreadBadgeLabel(12), '9+');
});
