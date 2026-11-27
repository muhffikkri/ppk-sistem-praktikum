import { useCallback, useEffect, useMemo, useState } from 'react';

import { evaluateGeofence } from '../../domain/geofenceRules';
import { isLeaveBlockingCheckIn } from '../../domain/leaveRules';
import { isWithinCheckInWindow } from '../../domain/sessionRules';
import type {
  DeviceFix,
  GeofenceCheckResult,
  Lab,
} from '../../domain/geoTypes';
import type {
  AsyncActionResult,
  AttendanceRecord,
  Session,
} from '../../domain/types';
import { checkInWithQr } from '../../services/firestore/attendanceQrService';
import { getLabById } from '../../services/firestore/labService';
import { getCurrentDeviceLocation } from '../../services/location/deviceLocationService';
import { useStudentAttendanceViewModel } from '../../state/StudentAttendanceContext';
import { useStudentLeaveViewModel } from '../leave/useStudentLeaveViewModel';

export type StudentCheckInViewModel = {
  session: Session | undefined;
  lab: Lab | null;
  attendance: AttendanceRecord | undefined;
  deviceFix: DeviceFix | null;
  geofence: GeofenceCheckResult | null;
  loading: boolean;
  checkingLocation: boolean;
  submitting: boolean;
  error: string | null;
  isAlreadyCheckedIn: boolean;
  isOpen: boolean;
  leaveApproved: boolean;
  refreshLocation: () => Promise<void>;
  performCheckIn: () => Promise<AsyncActionResult>;
  clearError: () => void;
};

export function useStudentCheckIn(
  sessionId: string,
  qrToken?: string,
): StudentCheckInViewModel {
  const {
    getSessionById,
    getAttendanceForSession,
    reportError,
    loading: sessionsLoading,
  } = useStudentAttendanceViewModel();
  const { getLeaveForSession } = useStudentLeaveViewModel();

  const session = getSessionById(sessionId);
  const attendance = getAttendanceForSession(sessionId);
  const leaveApproved = isLeaveBlockingCheckIn(getLeaveForSession(sessionId));

  const [labResult, setLabResult] = useState<{
    key: string;
    lab: Lab | null;
    error: string | null;
  } | null>(null);
  const [deviceFix, setDeviceFix] = useState<DeviceFix | null>(null);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ambil data lab terkait sesi: labId dulu, nama lab untuk sesi lama.
  const labKey = session?.labId ?? session?.lab ?? null;
  useEffect(() => {
    if (!labKey) return;
    let active = true;
    getLabById(labKey).then((res) => {
      if (!active) return;
      setLabResult(
        res.ok
          ? { key: labKey, lab: res.data, error: null }
          : { key: labKey, lab: null, error: res.message },
      );
    });
    return () => {
      active = false;
    };
  }, [labKey]);

  // Hasil lab hanya berlaku untuk labKey yang sedang aktif.
  const currentLab = labKey && labResult?.key === labKey ? labResult : null;
  const lab = currentLab?.lab ?? null;
  const labError = currentLab?.error ?? null;
  const labLoading = !!labKey && labResult?.key !== labKey;

  // Derived geofence evaluation computed purely from state without cascading setState
  const geofence = useMemo<GeofenceCheckResult | null>(() => {
    if (!deviceFix) return null;
    return evaluateGeofence(deviceFix, lab);
  }, [deviceFix, lab]);

  const refreshLocation = useCallback(async () => {
    setError(null);
    setCheckingLocation(true);
    try {
      const locResult = await getCurrentDeviceLocation();
      if (!locResult.ok) {
        setError(locResult.message);
        return;
      }
      setDeviceFix(locResult.fix);
    } finally {
      setCheckingLocation(false);
    }
  }, []);

  // Cek lokasi awal otomatis saat layar dibuka
  useEffect(() => {
    let active = true;
    getCurrentDeviceLocation().then((locResult) => {
      if (!active) return;
      if (!locResult.ok) {
        setError(locResult.message);
      } else {
        setDeviceFix(locResult.fix);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const performCheckIn = useCallback(async (): Promise<AsyncActionResult> => {
    setError(null);

    if (!qrToken) {
      const msg = 'Presensi wajib memindai QR yang ditampilkan asisten.';
      setError(msg);
      reportError(msg);
      return { ok: false, reason: 'qr_required', message: msg };
    }

    if (!session) {
      const msg = 'Sesi praktikum tidak ditemukan.';
      setError(msg);
      reportError(msg);
      return { ok: false, reason: 'session_not_found', message: msg };
    }

    // Guard lokal sebelum mengambil lokasi/memanggil server: izin approved
    // memang sudah ditolak backend, tapi UI tidak boleh mengirimkan usaha sia-sia.
    if (leaveApproved) {
      const msg = 'Izin kamu sudah disetujui untuk sesi ini.';
      setError(msg);
      reportError(msg);
      return { ok: false, reason: 'leave_approved', message: msg };
    }

    let currentFix = deviceFix;
    if (!currentFix) {
      setCheckingLocation(true);
      const locResult = await getCurrentDeviceLocation();
      setCheckingLocation(false);
      if (!locResult.ok) {
        setError(locResult.message);
        return {
          ok: false,
          reason: 'location_unavailable',
          message: locResult.message,
        };
      }
      currentFix = locResult.fix;
      setDeviceFix(currentFix);
    }

    setSubmitting(true);
    try {
      const result = await checkInWithQr({
        sessionId,
        token: qrToken,
        deviceFix: currentFix,
      });

      if (!result.ok) {
        setError(result.message);
        // Layar bisa sudah di-unmount; Home memakai error global ini.
        reportError(result.message);
        return result;
      }

      reportError(null);
      return { ok: true };
    } finally {
      setSubmitting(false);
    }
  }, [deviceFix, leaveApproved, qrToken, reportError, session, sessionId]);

  const isAlreadyCheckedIn = attendance !== undefined;
  const isOpen = Boolean(
    session && session.status === 'open' && isWithinCheckInWindow(session),
  );

  return {
    session,
    lab,
    attendance,
    deviceFix,
    geofence,
    loading: sessionsLoading || labLoading,
    checkingLocation,
    submitting,
    error: error ?? labError,
    isAlreadyCheckedIn,
    isOpen,
    leaveApproved,
    refreshLocation,
    performCheckIn,
    clearError: () => setError(null),
  };
}
