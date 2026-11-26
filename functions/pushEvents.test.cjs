const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  sessionCreatedEvents,
  sessionEvents,
  leaveEvents,
  fineCreatedEvents,
  paymentEvents,
  noticeContent,
  inboxEntries,
  pushMessage,
} = require('./pushEvents.cjs');

const session = {
  status: 'scheduled',
  startsAt: '2026-11-20T01:00:00Z',
  endsAt: '2026-11-20T03:00:00Z',
  participantIds: ['student1', 'student1', 'student2', 'bad/id', null],
  assistantIds: ['assistant1'],
};

test('session opening targets only distinct participants when scheduled becomes open', () => {
  const open = { ...session, status: 'open' };
  assert.deepEqual(sessionEvents(session, open, 's1'), [
    {
      type: 'session_opened',
      sessionId: 's1',
      recipients: ['student1', 'student2'],
    },
  ]);
  assert.deepEqual(
    sessionEvents(open, { ...open, status: 'closed' }, 's1'),
    [],
  );
  assert.deepEqual(
    sessionEvents(open, { ...open, updatedAt: 'new' }, 's1'),
    [],
  );
});

test('schedule changes notify the new roster for time or lab changes', () => {
  for (const change of [
    { endsAt: 'later' },
    { startsAt: 'earlier' },
    { lab: 'Lab 2' },
    { labId: 'lab-2' },
  ]) {
    assert.deepEqual(
      sessionEvents(
        session,
        { ...session, ...change, participantIds: ['student2'] },
        's1',
      ),
      [{ type: 'schedule_changed', sessionId: 's1', recipients: ['student2'] }],
    );
  }
  assert.deepEqual(
    sessionEvents(session, { ...session, title: 'new title' }, 's1'),
    [],
  );
});

test('leave notifications require a final decision and the original applicant', () => {
  const leave = {
    status: 'pending',
    studentId: 'student1',
    reason: 'Detail pribadi',
  };
  for (const status of ['approved', 'rejected']) {
    assert.deepEqual(leaveEvents(leave, { ...leave, status }, 'l1'), [
      { type: 'leave_decided', leaveId: 'l1', recipients: ['student1'] },
    ]);
  }
  assert.deepEqual(
    leaveEvents(
      leave,
      { ...leave, studentId: 'student2', status: 'approved' },
      'l1',
    ),
    [],
  );
  assert.deepEqual(
    leaveEvents(
      { ...leave, status: 'approved' },
      { ...leave, status: 'rejected' },
      'l1',
    ),
    [],
  );
  const payload = pushMessage(
    {
      type: 'leave_decided',
      uid: 'student1',
      leaveId: 'l1',
      sendUntil: Date.now() + 60_000,
    },
    'ExpoPushToken[token]',
  );
  assert.deepEqual(payload.data, {
    recipientUid: 'student1',
    type: 'leave_decided',
    leaveId: 'l1',
  });
  assert.ok(!JSON.stringify(payload).includes(leave.reason));
});

test('new scheduled sessions notify their distinct participants', () => {
  assert.deepEqual(sessionCreatedEvents(session, 's1'), [
    {
      type: 'session_scheduled',
      sessionId: 's1',
      recipients: ['student1', 'student2'],
    },
  ]);
  assert.deepEqual(
    sessionCreatedEvents({ ...session, participantIds: [] }, 's1'),
    [],
  );
  assert.deepEqual(
    sessionCreatedEvents({ ...session, status: 'open' }, 's1'),
    [],
  );
});

test('new session push uses its own title', () => {
  const message = pushMessage(
    {
      type: 'session_scheduled',
      uid: 'student1',
      sessionId: 's1',
      sendUntil: Date.now() + 60_000,
    },
    'ExponentPushToken[abc]',
  );
  assert.equal(message.title, 'Jadwal praktikum baru');
  assert.equal(message.data.type, 'session_scheduled');
});

const sessionDoc = {
  ...session,
  courseName: 'Praktikum RPL',
  groupName: 'Kelas A',
  lab: 'Lab 3.2 RPL',
  startsAt: '2026-11-27T01:00:00Z',
};

test('notice content describes the session in WIB without leaking leave details', () => {
  assert.deepEqual(noticeContent('session_scheduled', sessionDoc), {
    title: 'Jadwal praktikum baru',
    body: 'Praktikum RPL · Kelas A — Jum, 27 Nov, 08.00 WIB di Lab 3.2 RPL.',
  });
  assert.equal(
    noticeContent('session_opened', sessionDoc).body,
    'Praktikum RPL · Kelas A sudah dibuka. Silakan presensi dari area lab.',
  );
  const leave = {
    status: 'rejected',
    courseName: 'Praktikum RPL',
    groupName: 'Kelas A',
    reason: 'Detail pribadi',
    decisionNote: 'Catatan asisten',
  };
  const content = noticeContent('leave_decided', leave);
  assert.equal(content.body, 'Izin Praktikum RPL · Kelas A ditolak.');
  assert.ok(!JSON.stringify(content).includes('Detail pribadi'));
  assert.ok(!JSON.stringify(content).includes('Catatan asisten'));
  assert.equal(
    noticeContent('session_opened', {}).body,
    'Buka PPK Mobile untuk melihat detail.',
  );
  assert.ok(
    noticeContent('session_scheduled', { ...sessionDoc, lab: 'x'.repeat(300) })
      .body.length <= 160,
  );
});

test('inbox entries are one per recipient with stable ids', () => {
  const now = new Date('2026-11-25T10:00:00Z');
  const notices = sessionCreatedEvents(sessionDoc, 's1');
  const first = inboxEntries('event-1', notices, sessionDoc, now);
  const retry = inboxEntries('event-1', notices, sessionDoc, now);
  assert.deepEqual(
    first.map((entry) => entry.uid),
    ['student1', 'student2'],
  );
  assert.deepEqual(
    first.map((entry) => entry.id),
    retry.map((entry) => entry.id),
  );
  assert.notEqual(first[0].id, first[1].id);
  assert.notEqual(
    first[0].id,
    inboxEntries('event-2', notices, sessionDoc, now)[0].id,
  );
  assert.deepEqual(first[0].data, {
    type: 'session_scheduled',
    title: 'Jadwal praktikum baru',
    body: 'Praktikum RPL · Kelas A — Jum, 27 Nov, 08.00 WIB di Lab 3.2 RPL.',
    sessionId: 's1',
    createdAt: '2026-11-25T10:00:00.000Z',
    readAt: null,
  });
});

test('push message reuses inbox content and links the inbox entry', () => {
  const message = pushMessage(
    {
      type: 'session_opened',
      uid: 'student1',
      sessionId: 's1',
      title: 'Sesi praktikum dibuka',
      body: 'Praktikum RPL · Kelas A sudah dibuka.',
      notificationId: 'abc123',
      sendUntil: Date.now() + 60_000,
    },
    'ExpoPushToken[token]',
  );
  assert.equal(message.body, 'Praktikum RPL · Kelas A sudah dibuka.');
  assert.deepEqual(message.data, {
    recipientUid: 'student1',
    type: 'session_opened',
    sessionId: 's1',
    notificationId: 'abc123',
  });
});

test('fine and payment events build notifications with fineId', () => {
  const fine = {
    studentId: 'u1',
    status: 'unpaid',
    amount: 15000,
    courseName: 'RPL',
    groupName: 'A',
  };
  assert.deepEqual(fineCreatedEvents(fine, 'f1'), [
    { type: 'fine_issued', fineId: 'f1', recipients: ['u1'] },
  ]);
  assert.deepEqual(fineCreatedEvents({ ...fine, status: 'paid' }, 'f1'), []);

  const tx = { studentId: 'u1', fineId: 'f1', status: 'pending' };
  assert.deepEqual(paymentEvents(tx, { ...tx, status: 'success' }), [
    { type: 'payment_success', fineId: 'f1', recipients: ['u1'] },
  ]);
  assert.deepEqual(paymentEvents(tx, { ...tx, status: 'failed' }), [
    { type: 'payment_failed', fineId: 'f1', recipients: ['u1'] },
  ]);
  assert.deepEqual(paymentEvents(tx, { ...tx, status: 'pending' }), []);

  const content = noticeContent('fine_issued', fine);
  assert.equal(content.title, 'Tagihan denda baru');
  assert.ok(content.body.includes('Rp'));

  const push = pushMessage(
    {
      type: 'fine_issued',
      uid: 'u1',
      fineId: 'f1',
      sendUntil: Date.now() + 60000,
    },
    'ExpoPushToken[t]',
  );
  assert.equal(push.data.fineId, 'f1');
});
