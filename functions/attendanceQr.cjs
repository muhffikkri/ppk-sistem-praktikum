const { Buffer } = require('node:buffer');
const { createHmac, timingSafeEqual } = require('node:crypto');

const QR_SLOT_MS = 30_000;
const QR_MAX_AGE_MS = QR_SLOT_MS;
const EARLY_CHECK_IN_MS = 15 * 60_000;
const LATE_CHECK_IN_MS = 10 * 60_000;
const MAX_LOCATION_ACCURACY_M = 100;
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const SLOT_PATTERN = /^\d{12,15}$/;
const SIGNATURE_PATTERN = /^[a-f0-9]{64}$/;

function signatureFor(sessionId, slot, secret) {
  return createHmac('sha256', secret)
    .update(`${sessionId}.${slot}`)
    .digest('hex');
}

function qrSlot(nowMs = Date.now()) {
  return Math.floor(nowMs / QR_SLOT_MS) * QR_SLOT_MS;
}

/** Token `{sessionId}.{slotMs}.{hmac}`; slot ganti tiap 30 detik. */
function issueQrToken(sessionId, secret, nowMs = Date.now()) {
  if (!SESSION_ID_PATTERN.test(sessionId)) return null;
  const slot = qrSlot(nowMs);
  const signature = signatureFor(sessionId, slot, secret);
  return {
    token: `${sessionId}.${slot}.${signature}`,
    slot,
    expiresAt: new Date(slot + QR_SLOT_MS).toISOString(),
  };
}

/** Mengembalikan sessionId bila token sah untuk slot saat ini. */
function verifyQrToken(token, secret, nowMs = Date.now()) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [sessionId, slotText, signature] = parts;
  if (
    !SESSION_ID_PATTERN.test(sessionId) ||
    !SLOT_PATTERN.test(slotText) ||
    !SIGNATURE_PATTERN.test(signature)
  ) {
    return null;
  }

  const expected = Buffer.from(
    signatureFor(sessionId, slotText, secret),
    'hex',
  );
  const received = Buffer.from(signature, 'hex');
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return null;
  }

  const slot = Number(slotText);
  if (!Number.isFinite(slot) || Math.abs(nowMs - slot) > QR_MAX_AGE_MS) {
    return null;
  }
  return sessionId;
}

function haversineMeters(from, to) {
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const earthRadius = 6_371_000;
  const dLat = toRad(to.latitude - from.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}

function withinCheckInWindow(session, nowMs = Date.now()) {
  const start = Number(session?.startsAtMs);
  const end = Number(session?.endsAtMs);
  return (
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    end > start &&
    nowMs >= start - EARLY_CHECK_IN_MS &&
    nowMs <= end + LATE_CHECK_IN_MS
  );
}

/**
 * Validasi server untuk presensi QR. Lokasi dihitung server dari dokumen lab,
 * bukan dari `distanceMeters` yang dikirim klien.
 */
function validateQrCheckIn({
  session,
  lab,
  location,
  studentId,
  nowMs = Date.now(),
}) {
  if (!session) return { ok: false, reason: 'session_not_found' };
  if (session.status !== 'open') return { ok: false, reason: 'invalid_status' };
  if (!withinCheckInWindow(session, nowMs)) {
    return { ok: false, reason: 'outside_window' };
  }
  if (
    !Array.isArray(session.participantIds) ||
    !session.participantIds.includes(studentId)
  ) {
    return { ok: false, reason: 'not_participant' };
  }
  if (!session.labId || !lab) return { ok: false, reason: 'lab_not_linked' };
  if (lab.isActive === false) return { ok: false, reason: 'lab_inactive' };
  if (
    !location ||
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude)
  ) {
    return { ok: false, reason: 'location_unavailable' };
  }
  if (
    location.accuracyMeters != null &&
    (!Number.isFinite(location.accuracyMeters) ||
      location.accuracyMeters > MAX_LOCATION_ACCURACY_M)
  ) {
    return { ok: false, reason: 'inaccurate_location' };
  }

  const distance = haversineMeters(lab.location, location);
  if (!Number.isFinite(lab.radiusMeters) || distance > lab.radiusMeters) {
    return { ok: false, reason: 'outside_geofence', distanceMeters: distance };
  }
  return { ok: true, distanceMeters: Math.round(distance) };
}

module.exports = {
  QR_SLOT_MS,
  EARLY_CHECK_IN_MS,
  LATE_CHECK_IN_MS,
  haversineMeters,
  issueQrToken,
  qrSlot,
  validateQrCheckIn,
  verifyQrToken,
  withinCheckInWindow,
};
