/**
 * Master laboratorium untuk presensi dan peta.
 * Semua pengguna terautentikasi dapat membaca. Aslab menulis sesuai courseId.
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import {
  hasLabInputErrors,
  validateLabInput,
} from '../../domain/geofenceRules';
import type { Lab, LabInput } from '../../domain/geoTypes';
import type { AsyncActionResult } from '../../domain/types';
import { DEFAULT_TOLERANCE_MINUTES } from '../../domain/lateToleranceRules';
import { db, functions } from '../firebase';
import { callableFailureReason } from './callableFailure';

const LABS = 'labs';
const labsCol = collection(db, LABS);

type AsyncFailure = { ok: false; reason: string; message: string };

export const LAB_IN_USE_MESSAGE =
  'Laboratorium masih digunakan oleh sesi praktikum. Nonaktifkan lab agar riwayat dan presensi tetap tersimpan.';

function toFailure(e: unknown): AsyncFailure {
  const code =
    typeof e === 'object' && e !== null && 'code' in e
      ? String((e as { code?: unknown }).code)
      : '';
  if (code === 'permission-denied' || code === 'functions/permission-denied') {
    return {
      ok: false,
      reason: 'forbidden',
      message:
        'Akses ditolak. Hanya Aslab pada mata kuliah terkait yang dapat mengelola lab.',
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
  const courseId = input.courseId?.trim() || null;
  const courseCode = input.courseCode?.trim() || courseId;
  return {
    name: input.name.trim(),
    building: input.building.trim(),
    description: description ? description : null,
    courseId,
    courseCode,
    location: { latitude: input.latitude, longitude: input.longitude },
    radiusMeters: input.radiusMeters,
    lateToleranceMinutes:
      input.lateToleranceMinutes ?? DEFAULT_TOLERANCE_MINUTES,
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
    lateToleranceMinutes:
      typeof data.lateToleranceMinutes === 'number'
        ? data.lateToleranceMinutes
        : DEFAULT_TOLERANCE_MINUTES,
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

/**
 * Mengambil detail lab berdasarkan ID atau nama untuk kebutuhan tampilan/riwayat/geofence.
 * Tidak memfilter `isActive` agar sesi historis yang merujuk lab nonaktif tetap terbaca.
 */
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

export async function setLabActive(
  labId: string,
  isActive: boolean,
): Promise<AsyncActionResult> {
  try {
    await updateDoc(doc(db, LABS, labId), {
      isActive,
      updatedAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (e) {
    return toFailure(e);
  }
}

export async function deleteLab(labId: string): Promise<AsyncActionResult> {
  try {
    await httpsCallable(functions, 'deleteLabSafely')({ labId });
    return { ok: true };
  } catch (e) {
    if (callableFailureReason(e) === 'lab_in_use') {
      return { ok: false, reason: 'lab_in_use', message: LAB_IN_USE_MESSAGE };
    }
    return toFailure(e);
  }
}
