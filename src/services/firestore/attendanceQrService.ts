/**
 * Presensi QR: token diambil dari Cloud Function dan diverifikasi server
 * bersama geofence. Klien tidak menulis dokumen `attendance` langsung.
 */
import { httpsCallable } from 'firebase/functions';

import type { DeviceFix } from '../../domain/geoTypes';
import type { AsyncActionResult } from '../../domain/types';
import { functions } from '../firebase';

export type AttendanceQr = {
  token: string;
  slot: number;
  expiresAt: string;
};

export type QrCheckInInput = {
  sessionId: string;
  token: string;
  deviceFix: DeviceFix;
};

export type QrCheckInData = {
  attendanceId: string;
  checkedInAt: string;
  distanceMeters: number;
};

type CallableFailure = {
  code?: string;
  details?: { reason?: string } | null;
  message?: string;
};

function failure(
  error: unknown,
  fallbackReason: string,
  fallbackMessage: string,
): Extract<AsyncActionResult, { ok: false }> {
  const callable = error as CallableFailure;
  const code = String(callable.code ?? '')
    .split('/')
    .pop();
  const reason =
    callable.details?.reason ??
    (code === 'already-exists'
      ? 'already_checked_in'
      : code === 'unauthenticated'
        ? 'unauthenticated'
        : code === 'permission-denied'
          ? 'forbidden'
          : code === 'unavailable'
            ? 'network_error'
            : fallbackReason);
  return {
    ok: false,
    reason,
    message: callable.message || fallbackMessage,
  };
}

export async function requestAttendanceQr(
  sessionId: string,
): Promise<AsyncActionResult<AttendanceQr>> {
  try {
    const callable = httpsCallable(functions, 'issueAttendanceQr');
    const response = await callable({ sessionId });
    return { ok: true, data: response.data as AttendanceQr };
  } catch (error) {
    return failure(
      error,
      'qr_unavailable',
      'Kode presensi belum bisa diambil. Coba lagi.',
    );
  }
}

export async function checkInWithQr(
  input: QrCheckInInput,
): Promise<AsyncActionResult<QrCheckInData>> {
  try {
    const callable = httpsCallable(functions, 'submitQrCheckIn');
    const response = await callable({
      sessionId: input.sessionId,
      token: input.token,
      location: {
        latitude: input.deviceFix.latitude,
        longitude: input.deviceFix.longitude,
        accuracyMeters: input.deviceFix.accuracyMeters ?? null,
      },
    });
    return { ok: true, data: response.data as QrCheckInData };
  } catch (error) {
    return failure(
      error,
      'qr_check_in_failed',
      'Presensi QR gagal. Coba lagi.',
    );
  }
}
