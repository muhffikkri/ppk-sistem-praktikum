import * as Location from 'expo-location';
import type { DeviceFix } from '../../domain/geoTypes';

export type LocationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'unknown';

export type LocationReadResult =
  | { ok: true; fix: DeviceFix }
  | {
      ok: false;
      reason: 'permission_denied' | 'unavailable' | 'timeout';
      message: string;
    };

function mapPositionToFix(
  latitude: number,
  longitude: number,
  accuracy: number | null | undefined,
  timestamp: number,
): DeviceFix {
  return {
    latitude,
    longitude,
    accuracyMeters: typeof accuracy === 'number' ? Math.round(accuracy) : null,
    capturedAt: new Date(timestamp).toISOString(),
  };
}

async function readViaWebGeolocation(
  timeoutMs: number,
  maxAgeMs: number,
): Promise<LocationReadResult> {
  const navGeo =
    typeof navigator !== 'undefined' && 'geolocation' in navigator
      ? navigator.geolocation
      : null;

  if (!navGeo) {
    return {
      ok: false,
      reason: 'unavailable',
      message: 'Layanan lokasi tidak tersedia pada perangkat ini.',
    };
  }

  return new Promise((resolve) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve({
        ok: false,
        reason: 'timeout',
        message: 'Waktu tunggu pembacaan GPS habis. Silakan coba lagi.',
      });
    }, timeoutMs);

    navGeo.getCurrentPosition(
      (position) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);

        resolve({
          ok: true,
          fix: mapPositionToFix(
            position.coords.latitude,
            position.coords.longitude,
            position.coords.accuracy,
            position.timestamp,
          ),
        });
      },
      (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);

        if (error.code === 1) {
          resolve({
            ok: false,
            reason: 'permission_denied',
            message: 'Izin akses lokasi ditolak. Harap izinkan akses lokasi.',
          });
        } else {
          resolve({
            ok: false,
            reason: 'unavailable',
            message: error.message || 'Gagal membaca koordinat GPS perangkat.',
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: maxAgeMs,
      },
    );
  });
}

/**
 * Mendapatkan posisi GPS perangkat satu kali (one-shot fix).
 */
export async function getCurrentDeviceLocation(options?: {
  timeoutMs?: number;
  maxAgeMs?: number;
}): Promise<LocationReadResult> {
  const timeoutMs = options?.timeoutMs ?? 10000;
  const maxAgeMs = options?.maxAgeMs ?? 30000;

  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      return {
        ok: false,
        reason: 'unavailable',
        message:
          'Layanan lokasi perangkat nonaktif. Silakan aktifkan GPS/Lokasi terlebih dahulu.',
      };
    }

    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      return {
        ok: false,
        reason: 'permission_denied',
        message: 'Izin akses lokasi ditolak. Harap izinkan akses lokasi.',
      };
    }

    const position = await Promise.race<Location.LocationObject | null>([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      }),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);

    const resolvedPosition =
      position ?? (await Location.getLastKnownPositionAsync());

    if (!resolvedPosition) {
      return {
        ok: false,
        reason: 'timeout',
        message: 'Waktu tunggu pembacaan GPS habis. Silakan coba lagi.',
      };
    }

    return {
      ok: true,
      fix: mapPositionToFix(
        resolvedPosition.coords.latitude,
        resolvedPosition.coords.longitude,
        resolvedPosition.coords.accuracy,
        resolvedPosition.timestamp,
      ),
    };
  } catch {
    return readViaWebGeolocation(timeoutMs, maxAgeMs);
  }
}