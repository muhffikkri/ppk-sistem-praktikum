const { createHash } = require('node:crypto');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const {
  onDocumentCreated,
  onDocumentUpdated,
} = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const {
  sessionCreatedEvents,
  sessionEvents,
  leaveEvents,
  inboxEntries,
  pushMessage,
} = require('./pushEvents.cjs');

initializeApp();
const db = getFirestore();
const jobs = db.collection('push_delivery');
const expoAccessToken = defineSecret('EXPO_PUSH_ACCESS_TOKEN');
const minute = 60_000;
const day = 24 * 60 * minute;
const tokenPattern = /^(Expo|Exponent)PushToken\[[A-Za-z0-9_-]+\]$/;

const tokenCollection = (uid) =>
  db.collection('users').doc(uid).collection('push_tokens');

const ignoreExisting = (error) => (error.code === 6 ? null : error);

async function enqueue(eventId, eventTime, notices, source) {
  const occurredAt = Date.parse(eventTime) || Date.now();
  const sendUntil = occurredAt + 60 * minute;
  const inbox = inboxEntries(eventId, notices, source, new Date(occurredAt));
  const inboxByKey = new Map(
    inbox.map((entry) => [entry.data.type + '/' + entry.uid, entry]),
  );
  const writer = db.bulkWriter();
  const writes = [];

  try {
    // Inbox selalu ditulis, walau push sudah kedaluwarsa atau token tidak ada.
    for (const entry of inbox) {
      writes.push(
        writer
          .create(
            db
              .collection('users')
              .doc(entry.uid)
              .collection('notifications')
              .doc(entry.id),
            entry.data,
          )
          .catch(ignoreExisting),
      );
    }
    // Push yang sudah lewat 60 menit tidak dikirim lagi (inbox tetap ada).
    const pushNotices = sendUntil > Date.now() ? notices : [];
    for (const { recipients, ...notice } of pushNotices) {
      for (const uid of recipients) {
        const entry = inboxByKey.get(notice.type + '/' + uid);
        const tokens = await tokenCollection(uid).get();
        for (const device of tokens.docs) {
          if (!tokenPattern.test(device.get('token'))) continue;
          const id = createHash('sha256')
            .update(JSON.stringify([eventId, notice.type, uid, device.id]))
            .digest('hex');
          writes.push(
            writer
              .create(jobs.doc(id), {
                ...notice,
                uid,
                title: entry.data.title,
                body: entry.data.body,
                notificationId: entry.id,
                installationId: device.id,
                phase: 'send',
                dueAt: occurredAt,
                sendUntil,
                expireAt: new Date(occurredAt + 7 * day),
                attempts: 0,
              })
              .catch(ignoreExisting),
          );
        }
      }
    }
  } finally {
    await writer.close();
  }
  const failure = (await Promise.all(writes)).find(Boolean);
  if (failure) throw failure;
}

exports.notifySessionScheduled = onDocumentCreated(
  { document: 'sessions/{sessionId}', retry: true },
  (event) => {
    if (!event.data) return;
    return enqueue(
      event.id,
      event.time,
      sessionCreatedEvents(event.data.data(), event.params.sessionId),
      event.data.data(),
    );
  },
);

exports.notifySessionChanged = onDocumentUpdated(
  { document: 'sessions/{sessionId}', retry: true },
  (event) => {
    if (!event.data) return;
    return enqueue(
      event.id,
      event.time,
      sessionEvents(
        event.data.before.data(),
        event.data.after.data(),
        event.params.sessionId,
      ),
      event.data.after.data(),
    );
  },
);

exports.notifyLeaveDecided = onDocumentUpdated(
  { document: 'leave_requests/{leaveId}', retry: true },
  (event) => {
    if (!event.data) return;
    return enqueue(
      event.id,
      event.time,
      leaveEvents(
        event.data.before.data(),
        event.data.after.data(),
        event.params.leaveId,
      ),
      event.data.after.data(),
    );
  },
);

async function callExpo(endpoint, body) {
  const response = await fetch('https://exp.host/--/api/v2/push/' + endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + expoAccessToken.value(),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status === 429 || response.status >= 500)
    throw new Error('Expo push temporarily unavailable');
  if (!response.ok)
    return { status: 'error', details: { error: 'HTTP_' + response.status } };
  const { data } = await response.json();
  return endpoint === 'send' ? data?.[0] : data?.[body.ids[0]];
}

async function stillEligible(job) {
  if (job.sessionId) {
    const session = await db.collection('sessions').doc(job.sessionId).get();
    const participants = session.get('participantIds');
    return (
      Array.isArray(participants) &&
      participants.includes(job.uid) &&
      (job.type !== 'session_opened' || session.get('status') === 'open')
    );
  }
  const leave = await db.collection('leave_requests').doc(job.leaveId).get();
  return (
    leave.get('studentId') === job.uid &&
    ['approved', 'rejected'].includes(leave.get('status'))
  );
}

async function invalidateToken(ref, token) {
  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(ref);
    if (current.get('token') === token) transaction.delete(ref);
  });
}

async function deliver(ref) {
  const job = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data();
    if (!data || typeof data.dueAt !== 'number' || data.dueAt > Date.now())
      return null;
    transaction.update(ref, { dueAt: Date.now() + 5 * minute });
    return data;
  });
  if (!job) return;

  const finish = (phase, error = null) =>
    ref.update({
      phase,
      error,
      dueAt: FieldValue.delete(),
      token: FieldValue.delete(),
    });
  const retry = () =>
    ref.update({
      attempts: job.attempts + 1,
      dueAt: Date.now() + Math.min(30, 2 ** job.attempts) * minute,
    });
  const tokenRef = tokenCollection(job.uid).doc(job.installationId);

  try {
    if (job.phase === 'receipt') {
      if (Date.now() >= job.receiptUntil)
        return await finish('unknown', 'receipt_missing');
      const receipt = await callExpo('getReceipts', { ids: [job.ticketId] });
      if (!receipt) return await retry();
      if (receipt.status === 'ok') return await finish('accepted');
      const code = receipt.details?.error ?? 'receipt_error';
      if (code === 'DeviceNotRegistered')
        await invalidateToken(tokenRef, job.token);
      return await finish('failed', code);
    }

    if (Date.now() >= job.sendUntil || !(await stillEligible(job)))
      return await finish('skipped');
    const token = (await tokenRef.get()).get('token');
    if (!tokenPattern.test(token)) return await finish('skipped');

    const ticket = await callExpo('send', [pushMessage(job, token)]);
    if (ticket?.status === 'ok' && ticket.id) {
      return await ref.update({
        phase: 'receipt',
        ticketId: ticket.id,
        token,
        dueAt: Date.now() + 15 * minute,
        receiptUntil: Date.now() + day,
        attempts: 0,
      });
    }
    const code = ticket?.details?.error ?? 'invalid_ticket';
    if (code === 'DeviceNotRegistered') await invalidateToken(tokenRef, token);
    if (code === 'MessageRateExceeded') return await retry();
    await finish('failed', code);
  } catch {
    logger.warn('Push delivery will be retried', {
      deliveryId: ref.id,
      phase: job.phase,
    });
    await retry();
  }
}

exports.sendQueuedPush = onDocumentCreated(
  { document: 'push_delivery/{deliveryId}', secrets: [expoAccessToken] },
  (event) => (event.data ? deliver(event.data.ref) : undefined),
);

exports.retryPushAndCheckReceipts = onSchedule(
  { schedule: 'every 1 minutes', secrets: [expoAccessToken] },
  async () => {
    const due = await jobs
      .where('dueAt', '<=', Date.now())
      .orderBy('dueAt')
      .limit(100)
      .get();
    for (let i = 0; i < due.size; i += 20) {
      await Promise.all(
        due.docs.slice(i, i + 20).map((job) => deliver(job.ref)),
      );
    }
  },
);
