import { useCallback, useEffect, useState } from 'react';

import { evaluateGeofence } from '../../domain/geofenceRules';
import type { DeviceFix, GeofenceCheckResult, Lab } from '../../domain/geoTypes';
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

  const [lab, setLab] = useState<Lab | null>(null);
  const [labLoading, setLabLoading] = useState(false);
  const [deviceFix, setDeviceFix] = useState<DeviceFix | null>(null);
  const [geofence, setGeofence] = useState<GeofenceCheckResult | null>(null);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ambil data lab terkait sesi jika ada
  useEffect(() => {
    let active = true;
    if (!session?.lab) {
      setLab(null);
      return;
    }

    setLabLoading(true);
    getLabById(session.lab).then((res) => {
      if (!active) return;
      setLabLoading(false);
      if (res.ok) {
        setLab(res.data);
      }
    });

    return () => {
      active = false;
    };
  }, [session?.lab]);

  // Evaluasi ulang geofence saat lab atau deviceFix berubah
  useEffect(() => {
    if (deviceFix && lab) {
      const result = evaluateGeofence(deviceFix, lab);
      setGeofence(result);
    } else if (!lab && deviceFix) {
      setGeofence(evaluateGeofence(deviceFix, null));
    }
  }, [deviceFix, lab]);

  const refreshLocation = useCallback(async () => {
    setError(null);
    setCheckingLocation(true);
    try {
      const locResult = await getCurrentDeviceLocation();
      if (!locResult.ok) {
        setError(locResult.message);
        setGeofence({
          status: 'unavailable',
          withinRadius: false,
          distanceMeters: null,
          radiusMeters: lab?.radiusMeters ?? null,
          accuracyMeters: null,
          message: locResult.message,
        });
        return;
      }

      setDeviceFix(locResult.fix);
      const evalRes = evaluateGeofence(locResult.fix, lab);
      setGeofence(evalRes);
    } finally {
      setCheckingLocation(false);
    }
  }, [lab]);

  // Cek lokasi awal otomatis saat layar dibuka
  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

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
        return { ok: false, reason: 'location_unavailable', message: locResult.message };
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

      setGeofence(result.data.geofence);
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
    error,
    isAlreadyCheckedIn,
    isOpen,
    refreshLocation,
    performCheckIn,
    clearError: () => setError(null),
  };
}
