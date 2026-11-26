const { createHash } = require('node:crypto');

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

const titles = {
  session_opened: 'Sesi praktikum dibuka',
  session_scheduled: 'Jadwal praktikum baru',
  schedule_changed: 'Jadwal praktikum berubah',
  leave_decided: 'Keputusan izin tersedia',
  fine_issued: 'Tagihan denda baru',
  payment_success: 'Pembayaran denda berhasil',
  payment_failed: 'Pembayaran denda perlu tindakan',
};
const defaultBody = 'Buka PPK Mobile untuk melihat detail.';
const maxBodyLength = 160;

const timeFormat = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function when(iso) {
  const date = new Date(text(iso));
  return Number.isNaN(date.getTime()) ? '' : timeFormat.format(date) + ' WIB';
}

/**
 * Judul & isi notifikasi untuk satu event. `source` adalah dokumen sesi
 * (event sesi) atau dokumen izin (event izin) setelah perubahan.
 * Alasan izin dan catatan asisten sengaja tidak dimasukkan karena isi
 * notifikasi bisa tampil di layar kunci.
 */
function noticeContent(type, source = {}) {
  const title = titles[type] ?? 'Notifikasi PPK Mobile';
  const name = [text(source.courseName), text(source.groupName)]
    .filter(Boolean)
    .join(' · ');
  const schedule = when(source.startsAt);
  const lab = text(source.lab);
  const atLab = lab ? ' di ' + lab : '';
  let body = '';

  if (type === 'session_scheduled' && name) {
    body = name + (schedule ? ' — ' + schedule : '') + atLab + '.';
  } else if (type === 'session_opened' && name) {
    body = name + ' sudah dibuka. Silakan presensi dari area lab.';
  } else if (type === 'schedule_changed' && name) {
    body = name + ' kini ' + (schedule || 'berubah') + atLab + '.';
  } else if (type === 'leave_decided') {
    const decision =
      source.status === 'approved'
        ? 'disetujui'
        : source.status === 'rejected'
          ? 'ditolak'
          : 'sudah diputuskan';
    body = 'Izin ' + (name || 'praktikum') + ' ' + decision + '.';
  } else if (type === 'fine_issued') {
    const amount =
      typeof source.amount === 'number'
        ? 'Rp ' + Math.round(source.amount).toLocaleString('id-ID')
        : 'denda';
    body =
      'Tagihan ' +
      amount +
      (name ? ' untuk ' + name : '') +
      '. Buka aplikasi untuk detail.';
  } else if (type === 'payment_success') {
    body =
      'Pembayaran denda ' +
      (name || 'praktikum') +
      ' berhasil diverifikasi.';
  } else if (type === 'payment_failed') {
    body =
      'Pembayaran denda ' +
      (name || 'praktikum') +
      ' gagal atau perlu tindakan lanjutan.';
  }

  body = body || defaultBody;
  return {
    title,
    body:
      body.length > maxBodyLength
        ? body.slice(0, maxBodyLength - 1) + '…'
        : body,
  };
}

/** ID inbox deterministik: event yang diulang tidak membuat notifikasi ganda. */
function inboxId(eventId, type, uid) {
  return createHash('sha256')
    .update(JSON.stringify([eventId, type, uid]))
    .digest('hex')
    .slice(0, 40);
}

/**
 * Dokumen `users/{uid}/notifications/{id}` untuk setiap penerima event.
 * Dipakai Cloud Functions maupun worker Node.js agar isi inbox sama.
 */
function inboxEntries(eventId, notices, source, now = new Date()) {
  const entries = [];
  for (const { recipients, ...notice } of notices) {
    const content = noticeContent(notice.type, source);
    for (const uid of recipients) {
      entries.push({
        uid,
        id: inboxId(eventId, notice.type, uid),
        data: {
          type: notice.type,
          ...content,
                      ...(notice.sessionId ? { sessionId: notice.sessionId } : {}),
            ...(notice.leaveId ? { leaveId: notice.leaveId } : {}),
            ...(notice.fineId ? { fineId: notice.fineId } : {}),
          createdAt: now.toISOString(),
          readAt: null,
        },
      });
    }
  }
  return entries;
}

function pushMessage(job, token) {
  return {
    to: token,
    title: job.title ?? titles[job.type],
    body: job.body ?? defaultBody,
    channelId: 'practicum',
    sound: 'default',
    ttl: Math.max(1, Math.floor((job.sendUntil - Date.now()) / 1000)),
    data: {
      recipientUid: job.uid,
      type: job.type,
      ...(job.sessionId ? { sessionId: job.sessionId } : {}),
      ...(job.leaveId ? { leaveId: job.leaveId } : {}),
      ...(job.fineId ? { fineId: job.fineId } : {}),
      ...(job.notificationId ? { notificationId: job.notificationId } : {}),
    },
  };
}

function fineCreatedEvents(fine, fineId) {
  if (
    !fine ||
    typeof fine.studentId !== 'string' ||
    !fine.studentId ||
    fine.studentId.includes('/') ||
    fine.status !== 'unpaid'
  )
    return [];
  return [{ type: 'fine_issued', fineId, recipients: [fine.studentId] }];
}

function paymentEvents(before, after, transactionId) {
  if (
    !before ||
    !after ||
    before.status === after.status ||
    typeof after.studentId !== 'string' ||
    !after.studentId ||
    after.studentId.includes('/')
  )
    return [];
  if (after.status === 'success') {
    return [
      {
        type: 'payment_success',
        fineId: after.fineId,
        transactionId,
        recipients: [after.studentId],
      },
    ];
  }
  if (after.status === 'failed') {
    return [
      {
        type: 'payment_failed',
        fineId: after.fineId,
        transactionId,
        recipients: [after.studentId],
      },
    ];
  }
  return [];
}

module.exports = {
  sessionCreatedEvents,
  sessionEvents,
  leaveEvents,
  fineCreatedEvents,
  paymentEvents,
  noticeContent,
  inboxId,
  inboxEntries,
  pushMessage,
};
