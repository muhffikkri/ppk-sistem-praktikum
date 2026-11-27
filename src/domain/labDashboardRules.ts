/**
 * labDashboardRules.ts — Agregasi dashboard Aslab (SRS-4.12, SRS-4.13).
 *
 * Fungsi murni tanpa Firebase: menerima lab, kelas, dan sesi dalam cakupan
 * mata kuliah Aslab, lalu menghasilkan ringkasan per periode. Rentang periode
 * memakai zona waktu perangkat, sama dengan filter rekap presensi.
 */

import type { Lab } from './geoTypes';
import type { PracticalClass, Session } from './types';

export type DashboardPeriod = 'day' | 'week' | 'month';

/** Rentang setengah terbuka `[start, end)`. */
export type PeriodRange = { start: Date; end: Date };

export type LabActivityStatus = 'live' | 'scheduled' | 'idle' | 'inactive';

export type LabDashboardRow = {
  lab: Lab;
  status: LabActivityStatus;
  /** Sesi terbuka di lab ini, bila ada. */
  current: Session | null;
  /** Sesi terjadwal terdekat yang belum berakhir. */
  next: Session | null;
  /** Sesi tidak dibatalkan pada periode terpilih. */
  periodSessionCount: number;
};

export type LabDashboardSummary = {
  labCount: number;
  activeLabCount: number;
  /** Praktikan unik di seluruh kelas dalam cakupan. */
  participantCount: number;
  /** Sesi tidak dibatalkan yang dimulai pada periode terpilih. */
  periodSessionCount: number;
  /** Praktikan unik yang terdaftar di sesi periode terpilih. */
  periodParticipantCount: number;
  labs: LabDashboardRow[];
  live: Session[];
  upcoming: Session[];
  history: Session[];
};

export type LabDashboardInput = {
  labs: readonly Lab[];
  classes: readonly PracticalClass[];
  /** Sesi yang dimulai di dalam `range`. */
  periodSessions: readonly Session[];
  /** Sesi sejak awal hari ini untuk status langsung dan jadwal berikutnya. */
  currentSessions: readonly Session[];
  range: PeriodRange;
  now?: Date;
};

const LAB_STATUS_ORDER: Record<LabActivityStatus, number> = {
  live: 0,
  scheduled: 1,
  idle: 2,
  inactive: 3,
};

export function periodRange(
  period: DashboardPeriod,
  offset = 0,
  now: Date = new Date(),
): PeriodRange {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  if (period === 'day') {
    return {
      start: new Date(y, m, d + offset),
      end: new Date(y, m, d + offset + 1),
    };
  }
  if (period === 'week') {
    // Minggu dimulai Senin, sama dengan `isCurrentWeek`.
    const monday = d - ((now.getDay() + 6) % 7) + offset * 7;
    return { start: new Date(y, m, monday), end: new Date(y, m, monday + 7) };
  }
  return {
    start: new Date(y, m + offset, 1),
    end: new Date(y, m + offset + 1, 1),
  };
}

export function isWithinRange(iso: string, range: PeriodRange): boolean {
  const time = Date.parse(iso);
  return time >= range.start.getTime() && time < range.end.getTime();
}

function byStartAsc(a: Session, b: Session): number {
  return Date.parse(a.startsAt) - Date.parse(b.startsAt);
}

function byStartDesc(a: Session, b: Session): number {
  return Date.parse(b.startsAt) - Date.parse(a.startsAt);
}

function isUpcoming(session: Session, nowMs: number): boolean {
  return session.status === 'scheduled' && Date.parse(session.endsAt) > nowMs;
}

/** Sesi yang sudah selesai: ditutup, dibatalkan, atau melewati jam akhir. */
function isFinished(session: Session, nowMs: number): boolean {
  if (session.status === 'closed' || session.status === 'cancelled')
    return true;
  return session.status === 'scheduled' && Date.parse(session.endsAt) <= nowMs;
}

function mergeById(...lists: readonly (readonly Session[])[]): Session[] {
  const byId = new Map<string, Session>();
  for (const list of lists) {
    for (const session of list) byId.set(session.id, session);
  }
  return [...byId.values()];
}

export function buildLabDashboard({
  labs,
  classes,
  periodSessions,
  currentSessions,
  range,
  now = new Date(),
}: LabDashboardInput): LabDashboardSummary {
  const nowMs = now.getTime();
  const sessions = mergeById(periodSessions, currentSessions);

  const participants = new Set<string>();
  for (const cls of classes) {
    for (const uid of cls.participantIds ?? []) participants.add(uid);
  }

  const inPeriod = sessions.filter((s) => isWithinRange(s.startsAt, range));
  const heldInPeriod = inPeriod.filter((s) => s.status !== 'cancelled');
  const classById = new Map(classes.map((cls) => [cls.id, cls]));
  const periodParticipants = new Set<string>();
  for (const session of heldInPeriod) {
    const ids =
      session.participantIds ??
      classById.get(session.classId ?? '')?.participantIds ??
      [];
    for (const uid of ids) periodParticipants.add(uid);
  }

  const sessionsByLab = new Map<string, Session[]>();
  for (const session of sessions) {
    if (!session.labId) continue;
    const list = sessionsByLab.get(session.labId);
    if (list) list.push(session);
    else sessionsByLab.set(session.labId, [session]);
  }

  const rows = labs.map((lab): LabDashboardRow => {
    const labSessions = sessionsByLab.get(lab.id) ?? [];
    const current = labSessions.find((s) => s.status === 'open') ?? null;
    const next =
      labSessions.filter((s) => isUpcoming(s, nowMs)).sort(byStartAsc)[0] ??
      null;
    const status: LabActivityStatus = !lab.isActive
      ? 'inactive'
      : current
        ? 'live'
        : next
          ? 'scheduled'
          : 'idle';
    const periodSessionCount = labSessions.filter(
      (s) => s.status !== 'cancelled' && isWithinRange(s.startsAt, range),
    ).length;
    return { lab, status, current, next, periodSessionCount };
  });

  rows.sort(
    (a, b) =>
      LAB_STATUS_ORDER[a.status] - LAB_STATUS_ORDER[b.status] ||
      a.lab.name.localeCompare(b.lab.name),
  );

  return {
    labCount: labs.length,
    activeLabCount: labs.filter((lab) => lab.isActive).length,
    participantCount: participants.size,
    periodSessionCount: heldInPeriod.length,
    periodParticipantCount: periodParticipants.size,
    labs: rows,
    live: sessions.filter((s) => s.status === 'open').sort(byStartAsc),
    upcoming: sessions.filter((s) => isUpcoming(s, nowMs)).sort(byStartAsc),
    history: inPeriod.filter((s) => isFinished(s, nowMs)).sort(byStartDesc),
  };
}
