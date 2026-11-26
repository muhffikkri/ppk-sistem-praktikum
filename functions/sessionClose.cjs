const LATE_CHECK_IN_MS = 10 * 60_000;

/** Patch penutup untuk sesi open yang sudah lewat masa toleransi presensi. */
function closeExpiredSession(session, nowMs = Date.now()) {
  if (!session || session.status !== 'open') return null;
  const ends =
    typeof session.endsAtMs === 'number'
      ? session.endsAtMs
      : Date.parse(session.endsAt);
  if (!Number.isFinite(ends) || ends + LATE_CHECK_IN_MS > nowMs) return null;
  return { status: 'closed', closedAt: new Date(nowMs).toISOString() };
}

module.exports = { LATE_CHECK_IN_MS, closeExpiredSession };
