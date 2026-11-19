/**
 * ViewModel hook for Interactive Lab Maps — Sprint 3 (SRS-3.3)
 * Mengelola state real-time aktivitas lab, pelacakan posisi GPS pengguna, dan interaksi peta.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import * as Location from 'expo-location';
import {
  DEFAULT_CAMPUS_CENTER,
  type LabActivity,
  type LabMapFilter,
  type UserLocationState,
} from '../../domain/geoTypes';
import {
  seedDefaultLabsIfEmpty,
  subscribeLabActivities,
} from '../../services/firestore/labActivityService';

export function useLabMapsViewModel() {
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

  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null,
  );

  // 1. Subscribe ke aktivitas lab (Firestore)
  useEffect(() => {
    setLoading(true);
    seedDefaultLabsIfEmpty();

    const unsubscribe = subscribeLabActivities(
      (data) => {
        setActivities(data);
        setLoading(false);

        // Jika ada lab yang sedang dipilih, perbarui datanya secara real-time
        setSelectedLab((prev) => {
          if (!prev) return null;
          return data.find((a) => a.lab.id === prev.lab.id) ?? prev;
        });
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // 2. Lacak lokasi perangkat pengguna secara real-time
  useEffect(() => {
    let isMounted = true;

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
          if (isMounted) {
            setUserLocation({
              coordinates: {
                latitude: initialPos.coords.latitude,
                longitude: initialPos.coords.longitude,
                altitude: initialPos.coords.altitude,
                accuracy: initialPos.coords.accuracy,
              },
              accuracy: initialPos.coords.accuracy,
              timestamp: initialPos.timestamp,
              error: null,
              isLocating: false,
              permissionGranted: true,
            });
          }
        } catch {
          // Abaikan jika initial GPS timeout, watcher di bawah akan update
        }

        // Mulai watcher lokasi berkesinambungan selama halaman aktif
        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 5,
          },
          (loc) => {
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
          },
        );

        locationSubscriptionRef.current = sub;
      } catch (e) {
        if (!isMounted) return;
        setUserLocation((prev) => ({
          ...prev,
          error:
            e instanceof Error
              ? e.message
              : 'Gagal memperoleh lokasi perangkat.',
          isLocating: false,
          permissionGranted: false,
        }));
      }
    }

    startLocationTracking();

    return () => {
      isMounted = false;
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
    };
  }, []);

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
        error:
          e instanceof Error ? e.message : 'Gagal memperbarui posisi GPS.',
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
  };
}
