import { useCallback, useEffect, useMemo, useState } from 'react';

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
} from '../../domain/types';
import { checkInWithGeofence } from '../../services/firestore/geoAttendanceService';
import { getLabById } from '../../services/firestore/labService';
import { getCurrentDeviceLocation } from '../../services/location/deviceLocationService';
import { useAuth } from '../../state';
import { useStudentAttendanceViewModel } from '../../state/StudentAttendanceContext';

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
  refreshLocation: () => Promise<void>;
  performCheckIn: () => Promise<AsyncActionResult>;
  clearError: () => void;
};

export function useStudentCheckIn(sessionId: string): StudentCheckInViewModel {
  const { user } = useAuth();
  const {
    getSessionById,
    getAttendanceForSession,
    loading: sessionsLoading,
  } = useStudentAttendanceViewModel();

  const session = getSessionById(sessionId);
  const attendance = getAttendanceForSession(sessionId);

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
    if (!session?.lab) return;
    let active = true;
    if (!labKey) return;

    getLabById(labKey).then((res) => {
      if (!active) return;
      setLabResult(
        res.ok
          ? { key: labKey, lab: res.data, error: null }
          : { key: labKey, lab: null, error: res.message },
      );
    });
    getLabById(session.lab)
      .then((res) => {
        if (!active) return;
        if (res.ok) setFetchedLab(res.data);
      })
      .finally(() => {
        if (active) setLabFetchLoading(false);
      });

    return () => {
      active = false;
    };
  }, [labKey]);

  // Hasil lab hanya berlaku untuk labKey yang sedang aktif.
  const currentLab = labKey && labResult?.key === labKey ? labResult : null;
  const lab = currentLab?.lab ?? null;
  const labError = currentLab?.error ?? null;
  const labLoading = !!labKey && !currentLab;

  const lab =
    session?.lab && fetchedLab && (fetchedLab.id === session.lab || fetchedLab.name === session.lab)
      ? fetchedLab
      : null;
  const labLoading = !!session?.lab && !lab && labFetchLoading;

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

    if (!user) {
      const msg = 'Pengguna belum terautentikasi.';
      setError(msg);
      return { ok: false, reason: 'unauthenticated', message: msg };
    }

    if (!session) {
      const msg = 'Sesi praktikum tidak ditemukan.';
      setError(msg);
      return { ok: false, reason: 'session_not_found', message: msg };
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
      const result = await checkInWithGeofence({
        session,
        student: user,
        deviceFix: currentFix,
        lab,
        existingAttendance: attendance ? [attendance] : [],
      });

      if (!result.ok) {
        setError(result.message);
        return result;
      }

      return { ok: true };
    } finally {
      setSubmitting(false);
    }
  }, [attendance, deviceFix, lab, session, user]);

  const isAlreadyCheckedIn = attendance !== undefined;
  const isOpen = session?.status === 'open';

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
    refreshLocation,
    performCheckIn,
    clearError: () => setError(null),
  };
}
