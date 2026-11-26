/**
 * Layanan presensi berbasis lokasi (geofence) — Sprint 3 (SRS-3.2).
 *
 * Bertanggung jawab memvalidasi lokasi perangkat terhadap radius lab
 * dan mencatat kehadiran ke koleksi Firestore `attendance` dengan ID deterministik.
 */
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';

import { checkInRule } from '../../domain/attendanceRules';
import { evaluateGeofence } from '../../domain/geofenceRules';
import type {
  DeviceFix,
  GeofenceCheckResult,
  Lab,
} from '../../domain/geoTypes';
import type {
  AsyncActionResult,
  AttendanceRecord,
  Session,
  UserProfile,
} from '../../domain/types';
import { db } from '../firebase';
import { getLabById } from './labService';

export type GeoCheckInInput = {
  session: Session;
  student: UserProfile;
  deviceFix: DeviceFix;
  lab?: Lab | null;
  existingAttendance?: AttendanceRecord[];
};

export type GeoCheckInResult = AsyncActionResult<{
  attendanceId: string;
  geofence: GeofenceCheckResult;
}>;

function errorCode(e: unknown): string {
  return typeof e === 'object' && e !== null && 'code' in e
    ? String((e as { code?: unknown }).code)
    : '';
}

/**
 * Mencatat kehadiran mahasiswa dengan validasi geofence lab dan aturan anti-duplikasi.
 */
export async function checkInWithGeofence(
  input: GeoCheckInInput,
): Promise<GeoCheckInResult> {
  const { session, student, deviceFix, existingAttendance = [] } = input;

  // 1. Validasi domain rule status sesi & duplikasi lokal
  const validation = checkInRule(
    session,
    { id: student.uid, displayName: student.displayName },
    existingAttendance,
  );

  if (!validation.ok) {
    const message =
      validation.reason === 'invalid_status'
        ? 'Sesi belum dibuka atau sudah ditutup.'
        : validation.reason === 'already_checked_in'
          ? 'Kamu sudah presensi di sesi ini.'
          : 'Sesi tidak ditemukan.';
    return { ok: false, reason: validation.reason, message };
  }

  // 2. Sesi wajib terhubung ke dokumen lab: rules memvalidasi radius dari labs/{labId}
  if (!session.labId) {
    return {
      ok: false,
      reason: 'lab_not_linked',
      message:
        'Sesi ini belum terhubung ke data lab. Minta asisten memilih lab pada sesi.',
    };
  }

  let labData = input.lab?.id === session.labId ? input.lab : null;
  if (!labData) {
    const labFetch = await getLabById(session.labId);
    if (!labFetch.ok) {
      return {
        ok: false,
        reason: labFetch.reason,
        message: labFetch.message,
      };
    }
    labData = labFetch.data;
  }

  // 3. Evaluasi geofence lokasi perangkat terhadap lab
  const geofenceResult = evaluateGeofence(deviceFix, labData);

  if (!geofenceResult.withinRadius) {
    return {
      ok: false,
      reason:
        geofenceResult.status === 'inaccurate'
          ? 'inaccurate_location'
          : 'outside_geofence',
      message: geofenceResult.message,
    };
  }

  // 4. Catat presensi ke Firestore dengan ID deterministik: {sessionId}_{studentId}
  const attendanceId = `${session.id}_${student.uid}`;
  const attendanceRef = doc(collection(db, 'attendance'), attendanceId);

  const payload: AttendanceRecord & {
    deviceLocation?: {
      latitude: number;
      longitude: number;
      accuracyMeters?: number | null;
    };
    distanceMeters?: number | null;
  } = {
    id: attendanceId,
    sessionId: session.id,
    classId: session.classId ?? '',
    studentId: student.uid,
    studentName: student.displayName,
    checkedInAt: new Date().toISOString(),
    deviceLocation: {
      latitude: deviceFix.latitude,
      longitude: deviceFix.longitude,
      accuracyMeters: deviceFix.accuracyMeters ?? null,
    },
    distanceMeters: geofenceResult.distanceMeters,
  };

  try {
    await setDoc(attendanceRef, payload);
    return {
      ok: true,
      data: {
        attendanceId,
        geofence: geofenceResult,
      },
    };
  } catch (e) {
    if (errorCode(e) === 'permission-denied') {
      try {
        const snap = await getDoc(attendanceRef);
        if (snap.exists()) {
          return {
            ok: false,
            reason: 'already_checked_in',
            message: 'Kamu sudah presensi di sesi ini.',
          };
        }
      } catch {
        // Abaikan kegagalan baca dokumen
      }

      return {
        ok: false,
        reason: 'forbidden',
        message:
          'Presensi ditolak. Pastikan sesi masih terbuka dan kamu terdaftar di kelas ini.',
      };
    }

    if (errorCode(e) === 'unavailable') {
      return {
        ok: false,
        reason: 'network_error',
        message: 'Koneksi bermasalah. Coba lagi.',
      };
    }

    return {
      ok: false,
      reason: 'unknown_error',
      message: e instanceof Error ? e.message : 'Presensi gagal. Coba lagi.',
    };
  }
}
