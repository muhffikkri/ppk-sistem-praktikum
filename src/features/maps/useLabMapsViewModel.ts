/**
 * ViewModel hook for Interactive Lab Maps — Sprint 3 (SRS-3.3)
 * Mengelola state real-time aktivitas lab, pelacakan posisi GPS pengguna, dan interaksi peta.
 */
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import {
  DEFAULT_CAMPUS_CENTER,
  type LabActivity,
  type LabMapFilter,
  type UserLocationState,
} from '../../domain/geoTypes';
import { subscribeLabActivities } from '../../services/firestore/labActivityService';
import { useAuth } from '../../state';

// Balanced accuracy is enough to show the user's dot on the campus map.
// Check-in takes its own high-accuracy fix in deviceLocationService.
const WATCH_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 5000,
  distanceInterval: 10,
};

export function useLabMapsViewModel() {
  const { user } = useAuth();
  const uid = user?.uid;
  const role = user?.role;
  const [attempt, setAttempt] = useState(0);
  const [activities, setActivities] = useState<LabActivity[]>([]);
  const [selectedLab, setSelectedLab] = useState<LabActivity | null>(null);
  const [filter, setFilter] = useState<LabMapFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userLocation, setUserLocation] = useState<UserLocationState>({
    coordinates: null,
    accuracy: null,
    timestamp: null,
    error: null,
    isLocating: true,
    permissionGranted: null,
  });

  const navigation = useNavigation();

  // 1. Subscribe ke aktivitas lab (Firestore)
  useEffect(() => {
    if (!uid || !role) return;

    const unsubscribe = subscribeLabActivities(
      { uid, role },
      (data) => {
        setActivities(data);
        setError(null);
        setLoading(false);

        // Jika ada lab yang sedang dipilih, perbarui datanya secara real-time
        setSelectedLab((prev) => {
          if (!prev) return null;
          return data.find((a) => a.lab.id === prev.lab.id) ?? prev;
        });
      },
      (message) => {
        setError(message);
        setLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [uid, role, attempt]);

  const retry = () => {
    setError(null);
    setLoading(true);
    setAttempt((n) => n + 1);
  };

  // 2. Lacak lokasi perangkat pengguna secara real-time, hanya selama layar
  // peta fokus. Memakai event focus/blur (bukan useIsFocused): layar yang
  // tertutup di-freeze sehingga render ulang tidak terjadi sampai kembali.
  useEffect(() => {
    let isMounted = true;
    let focused = navigation.isFocused();
    let granted = false;
    let starting = false;
    let subscription: Location.LocationSubscription | null = null;

    const onLocation = (loc: Location.LocationObject) => {
      if (!isMounted) return;
      setUserLocation({
        coordinates: {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          altitude: loc.coords.altitude,
          accuracy: loc.coords.accuracy,
        },
        accuracy: loc.coords.accuracy,
        timestamp: loc.timestamp,
        error: null,
        isLocating: false,
        permissionGranted: true,
      });
    };

    const failWith = (e: unknown) => {
      if (!isMounted) return;
      setUserLocation((prev) => ({
        ...prev,
        error:
          e instanceof Error ? e.message : 'Gagal memperoleh lokasi perangkat.',
        isLocating: false,
        permissionGranted: false,
      }));
    };

    async function startWatching() {
      if (!isMounted || !focused || !granted || subscription || starting) {
        return;
      }
      starting = true;
      try {
        const next = await Location.watchPositionAsync(
          WATCH_OPTIONS,
          onLocation,
        );
        // Screen left (or blurred) while the watcher was starting.
        if (!isMounted || !focused) next.remove();
        else subscription = next;
      } catch (e) {
        failWith(e);
      } finally {
        starting = false;
      }
    }

    function stopWatching() {
      subscription?.remove();
      subscription = null;
    }

    async function startLocationTracking() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!isMounted) return;

        if (status !== 'granted') {
          setUserLocation({
            coordinates: null,
            accuracy: null,
            timestamp: null,
            error: 'Izin akses lokasi perangkat ditolak.',
            isLocating: false,
            permissionGranted: false,
          });
          return;
        }

        // Dapatkan lokasi awal
        try {
          const initialPos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          onLocation(initialPos);
        } catch {
          // Abaikan jika initial GPS timeout, watcher di bawah akan update
        }

        granted = true;
        await startWatching();
      } catch (e) {
        failWith(e);
      }
    }

    const offFocus = navigation.addListener('focus', () => {
      focused = true;
      void startWatching();
    });
    const offBlur = navigation.addListener('blur', () => {
      focused = false;
      stopWatching();
    });

    void startLocationTracking();

    return () => {
      isMounted = false;
      offFocus();
      offBlur();
      stopWatching();
    };
  }, [navigation]);

  // Filter daftar lab sesuai opsi yang dipilih
  const filteredActivities = useMemo(() => {
    if (filter === 'occupied') {
      return activities.filter((a) => a.isOccupied);
    }
    if (filter === 'available') {
      return activities.filter((a) => !a.isOccupied);
    }
    return activities;
  }, [activities, filter]);

  // Statistik ringkas untuk banner/header
  const stats = useMemo(() => {
    const total = activities.length;
    const occupied = activities.filter((a) => a.isOccupied).length;
    const available = total - occupied;
    return { total, occupied, available };
  }, [activities]);

  const refreshLocation = async () => {
    setUserLocation((prev) => ({ ...prev, isLocating: true }));
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setUserLocation({
        coordinates: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          altitude: pos.coords.altitude,
          accuracy: pos.coords.accuracy,
        },
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
        error: null,
        isLocating: false,
        permissionGranted: true,
      });
    } catch (e) {
      setUserLocation((prev) => ({
        ...prev,
        isLocating: false,
        error: e instanceof Error ? e.message : 'Gagal memperbarui posisi GPS.',
      }));
    }
  };

  return {
    activities,
    filteredActivities,
    selectedLab,
    filter,
    loading,
    error,
    userLocation,
    stats,
    defaultCenter: DEFAULT_CAMPUS_CENTER,
    setSelectedLab,
    setFilter,
    refreshLocation,
    retry,
  };
}
