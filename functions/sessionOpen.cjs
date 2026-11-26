const OPEN_EARLY_MS = 15 * 60_000;

/**
 * Patch pembuka sesi yang aman dipakai di dalam transaction Admin SDK.
 * Murni: tidak membaca Firestore, mudah diuji, dan menolak konflik sesi open
 * milik asisten yang sama (termasuk di lab berbeda).
 */
function openSessionPatch(
  session,
  nowMs = Date.now(),
  openSessions = [],
  actorUid = '',
) {
  if (!session) return { error: 'session_not_found' };
  if (session.status !== 'scheduled' && session.status !== 'closed') {
    return { error: 'invalid_status' };
  }

  const starts =
    typeof session.startsAtMs === 'number'
      ? session.startsAtMs
      : Date.parse(session.startsAt);
  const ends =
    typeof session.endsAtMs === 'number'
      ? session.endsAtMs
      : Date.parse(session.endsAt);
  if (
    !Number.isFinite(starts) ||
    !Number.isFinite(ends) ||
    nowMs < starts - OPEN_EARLY_MS ||
    nowMs > ends
  ) {
    return { error: 'outside_window' };
  }

  if (
    actorUid &&
    openSessions.some(
      (other) =>
        other &&
        other.id !== session.id &&
        other.status === 'open' &&
        Array.isArray(other.assistantIds) &&
        other.assistantIds.includes(actorUid),
    )
  ) {
    return { error: 'active_session_conflict' };
  }

  return {
    patch: {
      status: 'open',
      openedAt: new Date(nowMs).toISOString(),
      closedAt: null,
    },
  };
}

module.exports = { OPEN_EARLY_MS, openSessionPatch };
