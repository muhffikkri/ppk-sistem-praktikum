const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  sessionCreatedEvents,
  sessionEvents,
  leaveEvents,
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
