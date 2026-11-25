/**
- CRUD master laboratorium (koleksi Firestore `labs`) — Sprint 3 (SRS-3.1) & Sprint 4 (SRS-4.02–4.03).
- Baca: semua pengguna login (dipakai presensi & peta). Tulis: Aslab.
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';

import {
  DEFAULT_LATE_TOLERANCE_MINUTES,
  hasLabInputErrors,
  validateLabInput,
} from '../../domain/geofenceRules';
import type { Lab, LabInput } from '../../domain/geoTypes';
import type { AsyncActionResult } from '../../domain/types';
import { db } from '../firebase';

const LABS = 'labs';
const SESSIONS = 'sessions';
const labsCol = collection(db, LABS);
const sessionsCol = collection(db, SESSIONS);

type AsyncFailure = { ok: false; reason: string; message: string };

function toFailure(e: unknown): AsyncFailure {
  const code =
    typeof e === 'object' && e !== null && 'code' in e
      ? String((e as { code?: unknown }).code)
      : '';
  if (code === 'permission-denied') {
    return {
      ok: false,
      reason: 'forbidden',
      message: 'Akses ditolak. Hanya Aslab yang dapat mengelola lab.',
    };
  }
  if (code === 'unavailable') {
    return {
      ok: false,
      reason: 'network_error',
      message: 'Koneksi bermasalah. Coba lagi.',
    };
  }
  return {
    ok: false,
    reason: 'unknown_error',
    message: e instanceof Error ? e.message : 'Terjadi kesalahan. Coba lagi.',
  };
}

function validationFailure(input: LabInput): AsyncFailure | null {
  const errors = validateLabInput(input);
  if (!hasLabInputErrors(errors)) return null;
  return {
    ok: false,
    reason: 'validation_error',
    message: Object.values(errors)[0] ?? 'Data lab tidak valid.',
  };
}

function toPayload(input: LabInput) {
  const description = input.description?.trim();
  const courseId = input.courseId?.trim();
  const courseCode = input.courseCode?.trim();
  const lateToleranceMinutes =
    input.lateToleranceMinutes ?? DEFAULT_LATE_TOLERANCE_MINUTES;

  return {
    name: input.name.trim(),
    building: input.building.trim(),
    description: description ? description : null,
    courseId: courseId ? courseId : null,
    courseCode: courseCode ? courseCode : null,
    location: { latitude: input.latitude, longitude: input.longitude },
    radiusMeters: input.radiusMeters,
    lateToleranceMinutes,
    isActive: input.isActive,
  };
}

function asNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.trim().replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }
  return Number.NaN;
}

export function normalizeLab(id: string, data: Record<string, unknown>): Lab {
  const location = (data.location ?? {}) as Record<string, unknown>;
  const rawTolerance = asNumber(data.lateToleranceMinutes);
  return {
    id,
    name: String(data.name ?? ''),
    building: String(data.building ?? ''),
    description: typeof data.description === 'string' ? data.description : null,
    courseId: typeof data.courseId === 'string' ? data.courseId : null,
    courseCode: typeof data.courseCode === 'string' ? data.courseCode : null,
    location: {
      latitude: asNumber(location.latitude),
      longitude: asNumber(location.longitude),
    },
    radiusMeters: asNumber(data.radiusMeters),
    lateToleranceMinutes: Number.isFinite(rawTolerance)
      ? rawTolerance
      : DEFAULT_LATE_TOLERANCE_MINUTES,
    isActive: data.isActive !== false,
    createdBy: String(data.createdBy ?? ''),
    createdAt: String(data.createdAt ?? ''),
    updatedAt: String(data.updatedAt ?? ''),
  };
}

/** Langganan real-time seluruh lab, urut nama. Kembalikan fungsi unsubscribe. */
export function subscribeLabs(
  onData: (labs: Lab[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  return onSnapshot(
    query(labsCol, orderBy('name')),
    (snap) => onData(snap.docs.map((d) => normalizeLab(d.id, d.data()))),
    (e) => onError(toFailure(e).message),
  );
}

export async function getLabById(
  labIdOrName: string,
): Promise<AsyncActionResult<Lab>> {
  const key = labIdOrName.trim();
  if (!key) {
    return {
      ok: false,
      reason: 'lab_not_found',
      message: 'Laboratorium tidak ditemukan.',
    };
  }

  try {
    const snap = await getDoc(doc(db, LABS, key));
    if (snap.exists()) {
      return { ok: true, data: normalizeLab(snap.id, snap.data()) };
    }

    // Fallback: jika sesi menyimpan nama lab (misal "Lab Informatika D") bukan ID dokumen
    const byNameSnap = await getDocs(query(labsCol, where('name', '==', key)));
    if (!byNameSnap.empty) {
      const matchedDoc = byNameSnap.docs[0];
      return {
        ok: true,
        data: normalizeLab(matchedDoc.id, matchedDoc.data()),
      };
    }

    return {
      ok: false,
      reason: 'lab_not_found',
      message: 'Laboratorium tidak ditemukan.',
    };
  } catch (e) {
    return toFailure(e);
  }
}

export async function createLab(
  actorUid: string,
  input: LabInput,
): Promise<AsyncActionResult<string>> {
  const invalid = validationFailure(input);
  if (invalid) return invalid;
  try {
    const now = new Date().toISOString();
    const ref = await addDoc(labsCol, {
      ...toPayload(input),
      createdBy: actorUid,
      createdAt: now,
      updatedAt: now,
    });
    return { ok: true, data: ref.id };
  } catch (e) {
    return toFailure(e);
  }
}

export async function updateLab(
  labId: string,
  input: LabInput,
): Promise<AsyncActionResult> {
  const invalid = validationFailure(input);
  if (invalid) return invalid;
  try {
    await updateDoc(doc(db, LABS, labId), {
      ...toPayload(input),
      updatedAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (e) {
    return toFailure(e);
  }
}

export async function deleteLab(labId: string): Promise<AsyncActionResult> {
  try {
    // Lindungi riwayat sesi: jika lab sudah dirujuk sesi, arahkan ke penonaktifan (isActive: false).
    const referencedSnap = await getDocs(
      query(sessionsCol, where('labId', '==', labId), limit(1)),
    );
    if (!referencedSnap.empty) {
      return {
        ok: false,
        reason: 'lab_in_use',
        message:
          'Lab masih dirujuk oleh sesi praktikum. Ubah status menjadi Nonaktif agar riwayat tetap terbaca.',
      };
    }

    await deleteDoc(doc(db, LABS, labId));
    return { ok: true };
  } catch (e) {
    return toFailure(e);
  }
}