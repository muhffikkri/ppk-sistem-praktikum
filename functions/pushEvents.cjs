const scheduleFields = ['startsAt', 'endsAt', 'lab', 'labId'];

function participantsOf(session) {
  return [
    ...new Set(
      (Array.isArray(session.participantIds)
        ? session.participantIds
        : []
      ).filter(
        (uid) => typeof uid === 'string' && uid.length && !uid.includes('/'),
      ),
    ),
  ];
}

function sessionCreatedEvents(created, sessionId) {
  const recipients = participantsOf(created);
  if (!recipients.length || created.status !== 'scheduled') return [];
  return [{ type: 'session_scheduled', sessionId, recipients }];
}

function sessionEvents(before, after, sessionId) {
  const recipients = participantsOf(after);
  if (!recipients.length) return [];

  const events = [];
  if (before.status === 'scheduled' && after.status === 'open') {
    events.push({ type: 'session_opened', sessionId, recipients });
  }
  if (
    scheduleFields.some(
      (field) => (before[field] ?? null) !== (after[field] ?? null),
    )
  ) {
    events.push({ type: 'schedule_changed', sessionId, recipients });
  }
  return events;
}

function leaveEvents(before, after, leaveId) {
  if (
    before.status !== 'pending' ||
    !['approved', 'rejected'].includes(after.status) ||
    typeof before.studentId !== 'string' ||
    !before.studentId ||
    before.studentId.includes('/') ||
    before.studentId !== after.studentId
  )
    return [];
  return [{ type: 'leave_decided', leaveId, recipients: [after.studentId] }];
}

function pushMessage(job, token) {
  const title = {
    session_opened: 'Sesi praktikum dibuka',
    session_scheduled: 'Jadwal praktikum baru',
    schedule_changed: 'Jadwal praktikum berubah',
    leave_decided: 'Keputusan izin tersedia',
  }[job.type];
  return {
    to: token,
    title,
    body: 'Buka PPK Mobile untuk melihat detail.',
    channelId: 'practicum',
    sound: 'default',
    ttl: Math.max(1, Math.floor((job.sendUntil - Date.now()) / 1000)),
    data: {
      recipientUid: job.uid,
      type: job.type,
      ...(job.sessionId
        ? { sessionId: job.sessionId }
        : { leaveId: job.leaveId }),
    },
  };
}

module.exports = {
  sessionCreatedEvents,
  sessionEvents,
  leaveEvents,
  pushMessage,
};
