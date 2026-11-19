/**
 * Layanan pembacaan lokasi perangkat — Sprint 3 (SRS-3.2).
 *
 * Menggunakan Geolocation Web API standar jika tersedia (Navigator / WebView / browser),
 * atau fallback aman jika perangkat/simulator tidak memiliki modul native expo-location.
 * Modul ini mengekspos DeviceFix standar domain.
 */
import type { DeviceFix } from '../../domain/geoTypes';

export type LocationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'unknown';

export type LocationReadResult =
  | { ok: true; fix: DeviceFix }
  | { ok: false; reason: 'permission_denied' | 'unavailable' | 'timeout'; message: string };

/**
 * Mendapatkan posisi GPS perangkat satu kali (one-shot fix).
 */
export async function getCurrentDeviceLocation(options?: {
  timeoutMs?: number;
  maxAgeMs?: number;
}): Promise<LocationReadResult> {
  const timeoutMs = options?.timeoutMs ?? 10000;
  const maxAgeMs = options?.maxAgeMs ?? 30000;

  // Cek apakah navigator.geolocation tersedia di runtime platform
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

        const fix: DeviceFix = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters:
            typeof position.coords.accuracy === 'number'
              ? Math.round(position.coords.accuracy)
              : null,
          capturedAt: new Date(position.timestamp).toISOString(),
        };

        resolve({ ok: true, fix });
      },
      (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);

        if (error.code === 1) {
          // PERMISSION_DENIED
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
