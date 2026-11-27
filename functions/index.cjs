const { Buffer } = require('node:buffer');
const { createHash } = require('node:crypto');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const {
  onCall,
  onRequest,
  HttpsError,
} = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const { LATE_CHECK_IN_MS, closeExpiredSession } = require('./sessionClose.cjs');
const { openSessionPatch } = require('./sessionOpen.cjs');
const {
  createLabAdministration,
  toleranceForLab,
} = require('./labAdministration.cjs');
const {
  isLeaveBlockingCheckIn,
  issueQrToken,
  validateQrCheckIn,
  verifyQrToken,
  withinCheckInWindow,
} = require('./attendanceQr.cjs');

initializeApp();
const db = getFirestore();
const midtransServerKey = defineSecret('MIDTRANS_SERVER_KEY');
const attendanceQrSecret = defineSecret('ATTENDANCE_QR_SECRET');
const MIDTRANS_SNAP_URL =
  'https://app.sandbox.midtrans.com/snap/v1/transactions';
const MIDTRANS_STATUS_URL = 'https://api.sandbox.midtrans.com/v2';

exports.closeExpiredSessions = onSchedule(
  { schedule: 'every 1 minutes' },
  async () => {
    const threshold = new Date(Date.now() - LATE_CHECK_IN_MS).toISOString();
    const due = await db
      .collection('sessions')
      .where('endsAt', '<=', threshold)
      .get();
    const writer = db.bulkWriter();
    for (const snap of due.docs) {
      const patch = closeExpiredSession(snap.data());
      if (patch) writer.update(snap.ref, patch);
    }
    await writer.flush();
  },
);

function midtransAuth() {
  const key = midtransServerKey.value();
  return 'Basic ' + Buffer.from(key + ':').toString('base64');
}

function midtransSignature(orderId, statusCode, grossAmount, serverKey) {
  return createHash('sha512')
    .update(
      String(orderId) +
        String(statusCode) +
        String(grossAmount) +
        String(serverKey),
    )
    .digest('hex');
}

function mapMidtransStatus(payload) {
  const tx = String(payload.transaction_status || '');
  const fraud = String(payload.fraud_status || '');
  if (tx === 'capture') return fraud === 'accept' ? 'success' : 'pending';
  if (tx === 'settlement') return 'success';
  if (tx === 'pending') return 'pending';
  if (['deny', 'cancel', 'expire', 'failure'].includes(tx)) return 'failed';
  return 'pending';
}

async function fetchMidtransStatus(orderId) {
  const res = await fetch(
    MIDTRANS_STATUS_URL + '/' + encodeURIComponent(orderId) + '/status',
    {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: midtransAuth() },
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!res.ok) throw new Error('Midtrans status HTTP_' + res.status);
  return res.json();
}

async function createMidtransSnap(orderId, amount, fine, user) {
  const body = {
    transaction_details: {
      order_id: orderId,
      gross_amount: Math.round(amount),
    },
    item_details: [
      {
        id: fine.id,
        price: Math.round(amount),
        quantity: 1,
        name: ('Denda ' + (fine.courseName || 'Praktikum')).slice(0, 50),
      },
    ],
    customer_details: {
      first_name: (user.displayName || 'Praktikan').slice(0, 50),
      email: user.email || undefined,
    },
    callbacks: { finish: 'ppkmobile://payment-finish' },
  };
  const res = await fetch(MIDTRANS_SNAP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: midtransAuth(),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(data.error_messages?.join(', ') || 'Midtrans Snap gagal');
  return data;
}

// Pencarian praktikan by email dipindah ke server agar rules bisa melarang
// query `users` oleh klien asisten (profil mengandung email & data pribadi).
exports.resolveStudentByEmail = onCall({ cors: true }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Harus login.');

  const caller = await db.collection('users').doc(uid).get();
  const role = caller.exists ? caller.data().role : null;
  if (role !== 'assistant' && role !== 'lab_assistant')
    throw new HttpsError(
      'permission-denied',
      'Hanya asisten yang bisa mencari praktikan.',
    );

  const typed =
    typeof request.data?.email === 'string' ? request.data.email.trim() : '';
  const candidates = [...new Set([typed.toLowerCase(), typed])].filter(
    (email) => email.length > 0,
  );
  for (const email of candidates) {
    const snap = await db
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
    if (snap.empty) continue;
    const student = snap.docs[0];
    const data = student.data();
    if (data.role !== 'student') break;
    // Hanya field minimum yang dibutuhkan untuk menambah peserta kelas.
    return {
      uid: student.id,
      displayName: data.displayName || '',
      nim: data.nim || null,
    };
  }
  throw new HttpsError(
    'not-found',
    'Praktikan dengan email itu tidak ditemukan.',
  );
});

// QR presensi berputar tiap 30 detik. Klien tidak boleh menulis attendance;
// submitQrCheckIn memverifikasi token dan geofence dengan Admin SDK.
exports.issueAttendanceQr = onCall(
  { secrets: [attendanceQrSecret], cors: true },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Harus login.');

    const caller = await db.collection('users').doc(uid).get();
    const role = caller.exists ? caller.data().role : null;
    if (role !== 'assistant' && role !== 'lab_assistant')
      throw new HttpsError(
        'permission-denied',
        'Hanya asisten sesi yang bisa menampilkan kode presensi.',
      );

    const sessionId =
      typeof request.data?.sessionId === 'string'
        ? request.data.sessionId.trim()
        : '';
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(sessionId))
      throw new HttpsError('invalid-argument', 'sessionId tidak valid.');

    const snap = await db.collection('sessions').doc(sessionId).get();
    if (!snap.exists)
      throw new HttpsError('not-found', 'Sesi tidak ditemukan.');
    const session = snap.data();
    if (
      !Array.isArray(session.assistantIds) ||
      !session.assistantIds.includes(uid)
    )
      throw new HttpsError(
        'permission-denied',
        'Kamu bukan asisten pada sesi ini.',
      );
    if (session.status !== 'open')
      throw new HttpsError('failed-precondition', 'Sesi tidak sedang dibuka.', {
        reason: 'invalid_status',
      });
    if (!withinCheckInWindow(session))
      throw new HttpsError(
        'failed-precondition',
        'Kode QR hanya tersedia dalam jendela presensi.',
        { reason: 'outside_window' },
      );

    return issueQrToken(sessionId, attendanceQrSecret.value());
  },
);

// Buka sesi dipusatkan di callable agar konflik sesi open bisa divalidasi
// secara atomik. Firestore rules tidak bisa melakukan query lintas dokumen.
const openFailureMessages = {
  session_not_found: 'Sesi tidak ditemukan.',
  invalid_status:
    'Hanya sesi terjadwal atau yang baru ditutup yang bisa dibuka.',
  outside_window:
    'Sesi hanya bisa dibuka mulai 15 menit sebelum jadwal sampai waktu selesai.',
  active_session_conflict:
    'Asprak sudah memiliki sesi terbuka. Tutup sesi tersebut sebelum membuka sesi ini.',
  forbidden: 'Kamu bukan asisten pada sesi ini.',
};

function openFailure(reason) {
  return new HttpsError(
    'failed-precondition',
    openFailureMessages[reason] ?? 'Sesi tidak dapat dibuka.',
    { reason },
  );
}

const labAdministration = createLabAdministration({
  db,
  auth: getAuth(),
  FieldValue,
  HttpsError,
});
exports.importLab = onCall({ cors: true }, labAdministration.importLab);
exports.changeLabAssignment = onCall(
  { cors: true },
  labAdministration.changeLabAssignment,
);
exports.deleteLabSafely = onCall(
  { cors: true },
  labAdministration.deleteLabSafely,
);
exports.getLabSessionRoster = onCall(
  { cors: true },
  labAdministration.getLabSessionRoster,
);

exports.openSession = onCall({ cors: true }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Harus login.');

  const caller = await db.collection('users').doc(uid).get();
  const role = caller.exists ? caller.data().role : null;
  if (role !== 'assistant' && role !== 'lab_assistant') {
    throw new HttpsError(
      'permission-denied',
      'Hanya asisten sesi yang bisa membuka sesi.',
    );
  }

  const sessionId =
    typeof request.data?.sessionId === 'string'
      ? request.data.sessionId.trim()
      : '';
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(sessionId)) {
    throw new HttpsError('invalid-argument', 'sessionId tidak valid.');
  }

  const sessionRef = db.collection('sessions').doc(sessionId);
  const nowMs = Date.now();

  const result = await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(sessionRef);
    if (!snap.exists) return { error: 'session_not_found' };
    const session = { id: snap.id, ...snap.data() };
    const lab = session.labId
      ? await transaction.get(db.collection('labs').doc(session.labId))
      : null;
    const roster = await labAdministration.refreshScheduledRoster(
      transaction,
      session,
      lab?.data(),
    );
    Object.assign(session, roster);
    if (
      !Array.isArray(session.assistantIds) ||
      !session.assistantIds.includes(uid)
    ) {
      return { error: 'forbidden' };
    }

    const openSnap = await transaction.get(
      db.collection('sessions').where('status', '==', 'open'),
    );
    const openSessions = openSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const outcome = openSessionPatch(session, nowMs, openSessions, uid);
    if (outcome.error) return outcome;
    if (
      !Number.isInteger(session.toleranceMinutes) ||
      session.toleranceMinutes < 0 ||
      session.toleranceMinutes > 120
    ) {
      outcome.patch.toleranceMinutes = toleranceForLab(lab?.data());
    }
    transaction.update(sessionRef, { ...outcome.patch, ...roster });
    return outcome;
  });

  if (result.error === 'session_not_found') {
    throw new HttpsError('not-found', openFailureMessages.session_not_found, {
      reason: 'session_not_found',
    });
  }
  if (result.error === 'forbidden') {
    throw new HttpsError('permission-denied', openFailureMessages.forbidden, {
      reason: 'forbidden',
    });
  }
  if (result.error) throw openFailure(result.error);

  return { ok: true, sessionId };
});

const qrFailureMessages = {
  invalid_qr: 'Kode QR tidak valid atau sudah kedaluwarsa. Silakan scan ulang.',
  session_not_found: 'Sesi tidak ditemukan.',
  invalid_status: 'Sesi belum dibuka atau sudah ditutup.',
  outside_window:
    'Presensi hanya tersedia mulai 15 menit sebelum jadwal sampai 10 menit setelah sesi selesai.',
  not_participant: 'Kamu tidak terdaftar pada kelas sesi ini.',
  lab_not_linked: 'Sesi belum terhubung ke data lab.',
  lab_inactive: 'Lab untuk sesi ini sedang tidak aktif.',
  location_unavailable: 'Lokasi perangkat belum tersedia.',
  inaccurate_location: 'Akurasi GPS terlalu rendah. Coba lagi di area lab.',
  outside_geofence: 'Kamu berada di luar area laboratorium.',
  leave_approved: 'Izin kamu sudah disetujui untuk sesi ini.',
};

function qrFailure(reason) {
  return new HttpsError(
    'failed-precondition',
    qrFailureMessages[reason] ?? 'Presensi tidak dapat diverifikasi.',
    { reason },
  );
}

const finiteOrNull = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

exports.submitQrCheckIn = onCall(
  { secrets: [attendanceQrSecret], cors: true },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Harus login.');

    const token =
      typeof request.data?.token === 'string' ? request.data.token.trim() : '';
    const signedSessionId = verifyQrToken(token, attendanceQrSecret.value());
    if (!signedSessionId) throw qrFailure('invalid_qr');

    const requestedSessionId =
      typeof request.data?.sessionId === 'string'
        ? request.data.sessionId.trim()
        : '';
    if (requestedSessionId && requestedSessionId !== signedSessionId)
      throw qrFailure('invalid_qr');

    const sessionSnap = await db
      .collection('sessions')
      .doc(signedSessionId)
      .get();
    if (!sessionSnap.exists) throw qrFailure('session_not_found');
    const session = sessionSnap.data();

    const profileSnap = await db.collection('users').doc(uid).get();
    if (!profileSnap.exists || profileSnap.data().role !== 'student')
      throw new HttpsError(
        'permission-denied',
        'Hanya praktikan yang bisa melakukan presensi.',
      );

    const leaveSnap = await db
      .collection('leave_requests')
      .doc(`${signedSessionId}_${uid}`)
      .get();
    if (isLeaveBlockingCheckIn(leaveSnap.exists ? leaveSnap.data() : null))
      throw qrFailure('leave_approved');

    let lab = null;
    if (typeof session.labId === 'string' && session.labId) {
      const labSnap = await db.collection('labs').doc(session.labId).get();
      if (labSnap.exists) lab = { id: labSnap.id, ...labSnap.data() };
    }

    const rawLocation = request.data?.location ?? {};
    const location = {
      latitude: finiteOrNull(rawLocation.latitude),
      longitude: finiteOrNull(rawLocation.longitude),
      accuracyMeters: finiteOrNull(rawLocation.accuracyMeters),
    };
    const validation = validateQrCheckIn({
      session,
      lab,
      location,
      studentId: uid,
    });
    if (!validation.ok) throw qrFailure(validation.reason);

    const attendanceId = `${signedSessionId}_${uid}`;
    const profile = profileSnap.data();
    const checkInMs = Date.now();
    const checkedInAt = new Date(checkInMs).toISOString();
    const toleranceMinutes = toleranceForLab({
      lateToleranceMinutes: session.toleranceMinutes,
    });
    const deadline =
      (session.startsAtMs ?? Date.parse(session.startsAt)) +
      toleranceMinutes * 60_000;
    const isLate = Number.isFinite(deadline) && checkInMs > deadline;
    const payload = {
      id: attendanceId,
      sessionId: signedSessionId,
      classId: session.classId ?? '',
      studentId: uid,
      studentName: profile.displayName || '',
      ...(profile.nim ? { studentNim: profile.nim } : {}),
      checkedInAt,
      punctuality: isLate ? 'late' : 'ontime',
      minutesLate: isLate ? Math.ceil((checkInMs - deadline) / 60_000) : 0,
      deviceLocation: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracyMeters: location.accuracyMeters,
      },
      distanceMeters: validation.distanceMeters,
    };

    try {
      await db.collection('attendance').doc(attendanceId).create(payload);
    } catch (error) {
      if (error?.code === 6) {
        throw new HttpsError(
          'already-exists',
          'Kamu sudah presensi di sesi ini.',
          {
            reason: 'already_checked_in',
          },
        );
      }
      throw error;
    }

    return {
      attendanceId,
      checkedInAt,
      distanceMeters: validation.distanceMeters,
    };
  },
);

exports.createFineCheckout = onCall(
  { secrets: [midtransServerKey], cors: true },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Harus login.');

    const fineId =
      typeof request.data?.fineId === 'string'
        ? request.data.fineId.trim()
        : '';
    if (!fineId) throw new HttpsError('invalid-argument', 'fineId wajib.');

    const fineRef = db.collection('fines').doc(fineId);
    const txCol = db.collection('payment_transactions');

    const result = await db.runTransaction(async (tx) => {
      const fineSnap = await tx.get(fineRef);
      if (!fineSnap.exists)
        throw new HttpsError('not-found', 'Tagihan tidak ditemukan.');
      const fine = { id: fineSnap.id, ...fineSnap.data() };
      if (fine.studentId !== uid)
        throw new HttpsError('permission-denied', 'Bukan tagihan Anda.');
      if (fine.status === 'paid')
        throw new HttpsError('failed-precondition', 'Tagihan sudah dibayar.');
      if (fine.status === 'waived')
        throw new HttpsError(
          'failed-precondition',
          'Tagihan sudah dibebaskan.',
        );

      if (fine.pendingOrderId) {
        const pendingRef = txCol.doc(fine.pendingOrderId);
        const pendingSnap = await tx.get(pendingRef);
        if (pendingSnap.exists) {
          const pending = pendingSnap.data();
          if (pending.status === 'pending' && pending.snapRedirectUrl) {
            return {
              orderId: pendingSnap.id,
              redirectUrl: pending.snapRedirectUrl,
              reused: true,
            };
          }
        }
      }

      const orderId =
        'fine_' +
        fineId.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 60) +
        '_' +
        Date.now();
      const now = new Date().toISOString();
      const txRef = txCol.doc(orderId);
      tx.set(txRef, {
        fineId,
        studentId: uid,
        sessionId: fine.sessionId || null,
        amount: Math.round(fine.amount),
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        paidAt: null,
        snapRedirectUrl: null,
        midtransTransactionId: null,
        paymentType: null,
        failureReason: null,
      });
      tx.update(fineRef, { pendingOrderId: orderId, updatedAt: now });
      return { orderId, amount: Math.round(fine.amount), fine };
    });

    if (result.reused)
      return {
        ok: true,
        orderId: result.orderId,
        redirectUrl: result.redirectUrl,
      };

    try {
      const userSnap = await db.collection('users').doc(uid).get();
      const user = userSnap.exists ? userSnap.data() : {};
      const snap = await createMidtransSnap(
        result.orderId,
        result.amount,
        result.fine,
        user,
      );
      const redirectUrl = snap.redirect_url || snap.redirectUrl;
      await db
        .collection('payment_transactions')
        .doc(result.orderId)
        .update({
          snapRedirectUrl: redirectUrl || null,
          updatedAt: new Date().toISOString(),
        });
      if (!redirectUrl) throw new Error('Redirect URL kosong');
      return { ok: true, orderId: result.orderId, redirectUrl };
    } catch (err) {
      logger.error('createFineCheckout snap error', err);
      await db
        .collection('payment_transactions')
        .doc(result.orderId)
        .update({
          status: 'failed',
          failureReason: String(err.message || 'snap_error').slice(0, 200),
          updatedAt: new Date().toISOString(),
        });
      await db.collection('fines').doc(fineId).update({
        pendingOrderId: FieldValue.delete(),
        updatedAt: new Date().toISOString(),
      });
      throw new HttpsError('internal', 'Gagal membuat transaksi pembayaran.');
    }
  },
);

exports.midtransWebhook = onRequest(
  { secrets: [midtransServerKey], cors: false },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }
    const body = req.body || {};
    const orderId = String(body.order_id || '');
    const statusCode = String(body.status_code || '');
    const grossAmount = String(body.gross_amount || '');
    const signature = String(body.signature_key || '');

    if (!orderId || !statusCode || !grossAmount || !signature) {
      res.status(400).send('bad request');
      return;
    }

    const expected = midtransSignature(
      orderId,
      statusCode,
      grossAmount,
      midtransServerKey.value(),
    );
    if (signature !== expected) {
      logger.warn('Invalid Midtrans signature', { orderId });
      res.status(403).send('invalid signature');
      return;
    }

    try {
      const official = await fetchMidtransStatus(orderId);
      const status = mapMidtransStatus(official);
      const paidAt =
        official.settlement_time ||
        official.transaction_time ||
        new Date().toISOString();
      const txRef = db.collection('payment_transactions').doc(orderId);

      await db.runTransaction(async (tx) => {
        const txSnap = await tx.get(txRef);
        if (!txSnap.exists) return;
        const current = txSnap.data();
        if (current.status === 'success') return; // never downgrade
        if (current.status === 'failed' && status === 'pending') return;

        const amount = Math.round(
          Number(official.gross_amount || current.amount),
        );
        if (amount !== Math.round(Number(current.amount))) {
          logger.warn('Midtrans amount mismatch', {
            orderId,
            expected: current.amount,
            got: amount,
          });
          return;
        }

        const now = new Date().toISOString();
        const update = {
          status,
          updatedAt: now,
          midtransTransactionId:
            official.transaction_id || current.midtransTransactionId || null,
          paymentType: official.payment_type || current.paymentType || null,
        };
        if (status === 'success') update.paidAt = paidAt;
        if (status === 'failed')
          update.failureReason = String(
            official.transaction_status || 'failed',
          );
        tx.update(txRef, update);

        const fineRef = db.collection('fines').doc(current.fineId);
        const fineSnap = await tx.get(fineRef);
        if (!fineSnap.exists) return;
        const fine = fineSnap.data();
        if (fine.studentId !== current.studentId) return;

        if (
          status === 'success' &&
          fine.status !== 'paid' &&
          fine.status !== 'waived'
        ) {
          tx.update(fineRef, {
            status: 'paid',
            paidAt,
            pendingOrderId: FieldValue.delete(),
            updatedAt: now,
          });
        } else if (
          status === 'failed' &&
          fine.pendingOrderId === orderId &&
          fine.status === 'unpaid'
        ) {
          tx.update(fineRef, {
            pendingOrderId: FieldValue.delete(),
            updatedAt: now,
          });
        }
      });

      res.status(200).json({ ok: true });
    } catch (err) {
      logger.error('midtransWebhook error', err);
      res.status(500).send('error');
    }
  },
);
