/**
 * labSlotRules.ts — Cegah bentrok lab antar sesi (#68).
 *
 * Sesi menempati jam bulat (#69), sehingga pemakaian lab dapat dikunci per
 * jam lewat dokumen deterministik `lab_slots/{labId}_{hourMs}`. Sesi dan slot
 * ditulis dalam satu batch; rules menolak membuat slot yang sudah ada,
 * sehingga dua sesi tidak bisa memakai lab yang sama pada jam yang sama
 * meskipun dibuat oleh Asprak berbeda yang tidak saling melihat sesinya.
 */

export const HOUR_MS = 60 * 60 * 1000;

/** Status sesi yang tidak lagi menempati lab. */
const RELEASED_STATUSES = new Set(['cancelled']);

export type SlotWindow = {
  labId?: string | null;
  startsAtMs: number;
  endsAtMs: number;
  status?: string;
};

export function labSlotId(labId: string, hourMs: number): string {
  return `${labId}_${hourMs}`;
}

/** Awal setiap jam yang ditempati `[startsAtMs, endsAtMs)`. */
export function sessionHourSlots(
  startsAtMs: number,
  endsAtMs: number,
): number[] {
  const hours: number[] = [];
  if (!Number.isFinite(startsAtMs) || !Number.isFinite(endsAtMs)) return hours;
  const first = Math.floor(startsAtMs / HOUR_MS) * HOUR_MS;
  for (let hour = first; hour < endsAtMs; hour += HOUR_MS) hours.push(hour);
  return hours;
}

/** ID slot yang ditempati sesi; kosong bila tanpa lab atau sudah dilepas. */
export function slotIdsFor(window: SlotWindow | null | undefined): string[] {
  if (!window?.labId) return [];
  if (window.status && RELEASED_STATUSES.has(window.status)) return [];
  return sessionHourSlots(window.startsAtMs, window.endsAtMs).map((hour) =>
    labSlotId(window.labId as string, hour),
  );
}

/** Slot yang perlu dibuat dan dilepas saat sesi berpindah jam atau lab. */
export function diffSlots(
  previous: readonly string[],
  next: readonly string[],
): { create: string[]; release: string[] } {
  const before = new Set(previous);
  const after = new Set(next);
  return {
    create: next.filter((id) => !before.has(id)),
    release: previous.filter((id) => !after.has(id)),
  };
}

/** Slot yang masih bisa dipakai sesi lain setelah sesi ditutup lebih awal. */
export function releasableAfterClose(
  window: SlotWindow,
  nowMs: number,
): string[] {
  const currentHour = Math.floor(nowMs / HOUR_MS) * HOUR_MS;
  if (!window.labId) return [];
  return sessionHourSlots(window.startsAtMs, window.endsAtMs)
    .filter((hour) => hour > currentHour)
    .map((hour) => labSlotId(window.labId as string, hour));
}

/**
 * Aturan overlap dari issue: dua rentang bentrok bila
 * `start < other.end && end > other.start`. Batas yang bersentuhan
 * (08.00–10.00 dan 10.00–12.00) tidak bentrok.
 */
export function sessionsOverlap(a: SlotWindow, b: SlotWindow): boolean {
  return a.startsAtMs < b.endsAtMs && a.endsAtMs > b.startsAtMs;
}
