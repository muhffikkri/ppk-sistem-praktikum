/**
 * Penulisan slot lab per jam (#68). Slot ditulis dalam batch yang sama
 * dengan sesinya sehingga bentrok ditolak secara atomik oleh rules.
 */
import { doc, getDoc, type WriteBatch } from 'firebase/firestore';

import { diffSlots } from '../../domain/labSlotRules';
import { formatClock, formatSessionDate } from '../../shared/format/date';
import { db } from '../firebase';

const LAB_SLOTS = 'lab_slots';

export type SlotOwner = {
  sessionId: string;
  courseName: string;
  groupName: string;
  createdBy: string;
};

export type SlotConflict = {
  courseName: string;
  groupName: string;
  hourMs: number;
};

function parseSlotId(id: string): { labId: string; hourMs: number } {
  const split = id.lastIndexOf('_');
  return { labId: id.slice(0, split), hourMs: Number(id.slice(split + 1)) };
}

/** Tambahkan pembuatan dan pelepasan slot ke batch sesi. */
export function queueSlotChanges(
  batch: WriteBatch,
  previous: readonly string[],
  next: readonly string[],
  owner: SlotOwner,
): void {
  const { create, release } = diffSlots(previous, next);
  for (const id of release) batch.delete(doc(db, LAB_SLOTS, id));
  for (const id of create) {
    batch.set(doc(db, LAB_SLOTS, id), { ...parseSlotId(id), ...owner });
  }
}

/** Slot pertama yang sudah ditempati sesi lain, bila ada. */
export async function findSlotConflict(
  slotIds: readonly string[],
  sessionId: string,
): Promise<SlotConflict | null> {
  const snaps = await Promise.all(
    slotIds.map((id) => getDoc(doc(db, LAB_SLOTS, id))),
  );
  for (const snap of snaps) {
    if (!snap.exists()) continue;
    const data = snap.data();
    if (data.sessionId === sessionId) continue;
    return {
      courseName: String(data.courseName ?? ''),
      groupName: String(data.groupName ?? ''),
      hourMs: Number(data.hourMs),
    };
  }
  return null;
}

export function labConflictFailure(conflict: SlotConflict): {
  ok: false;
  reason: 'lab_conflict';
  message: string;
} {
  const iso = new Date(conflict.hourMs).toISOString();
  const who = [conflict.courseName, conflict.groupName]
    .filter(Boolean)
    .join(' · ');
  return {
    ok: false,
    reason: 'lab_conflict',
    message: `Lab sudah dipakai ${who || 'sesi lain'} pada ${formatSessionDate(iso)} pukul ${formatClock(iso)}. Pilih jam atau lab lain.`,
  };
}
