/**
 * Aturan geofence murni (tanpa Firebase / native API) — Sprint 3 (SRS-3.1).
 * Presensi (P2) wajib memanggil `evaluateGeofence` sebelum mencatat kehadiran.
 */
import type {
  DeviceFix,
  GeofenceCheckResult,
  GeoPoint,
  Lab,
  LabInput,
  LabInputErrors,
} from './geoTypes';

export const DEFAULT_RADIUS_METERS = 50;
export const MIN_RADIUS_METERS = 10;
export const MAX_RADIUS_METERS = 500;
/** Pembacaan GPS dengan akurasi lebih buruk dari ini dianggap tidak andal. */
export const MAX_ACCEPTABLE_ACCURACY_METERS = 100;

const EARTH_RADIUS_METERS = 6_371_000;

const toRadians = (deg: number) => (deg * Math.PI) / 180;

export function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

export function isValidGeoPoint(point: GeoPoint | null | undefined): boolean {
  return (
    !!point &&
    isValidLatitude(point.latitude) &&
    isValidLongitude(point.longitude)
  );
}

/** Jarak great-circle (rumus haversine) antara dua titik, dalam meter. */
export function haversineDistanceMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) *
      Math.cos(toRadians(b.latitude)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Parse teks koordinat dari form. Menerima koma desimal (`-6,9`) agar ramah
 * keyboard lokal. Mengembalikan `NaN` bila tidak valid.
 */
export function parseCoordinate(raw: string): number {
  const text = raw.trim().replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(text)) return Number.NaN;
  return Number(text);
}

export function validateLabInput(input: LabInput): LabInputErrors {
  const errors: LabInputErrors = {};
  if (!input.name.trim()) errors.name = 'Nama lab wajib diisi';
  if (!input.building.trim()) errors.building = 'Gedung wajib diisi';
  if (!isValidLatitude(input.latitude)) {
    errors.latitude = 'Latitude harus antara -90 dan 90';
  }
  if (!isValidLongitude(input.longitude)) {
    errors.longitude = 'Longitude harus antara -180 dan 180';
  }
  if (
    !Number.isInteger(input.radiusMeters) ||
    input.radiusMeters < MIN_RADIUS_METERS ||
    input.radiusMeters > MAX_RADIUS_METERS
  ) {
    errors.radiusMeters = `Radius harus bilangan bulat ${MIN_RADIUS_METERS}–${MAX_RADIUS_METERS} meter`;
  }
  return errors;
}

export function hasLabInputErrors(errors: LabInputErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Periksa apakah perangkat berada di dalam radius lab.
 * Hasil `withinRadius` adalah satu-satunya syarat lokasi untuk presensi.
 */
export function evaluateGeofence(
  device: DeviceFix | null | undefined,
  lab: Pick<Lab, 'location' | 'radiusMeters'> | null | undefined,
): GeofenceCheckResult {
  const accuracyMeters =
    device?.accuracyMeters != null && Number.isFinite(device.accuracyMeters)
      ? device.accuracyMeters
      : null;

  if (!lab || !isValidGeoPoint(lab.location) || !(lab.radiusMeters > 0)) {
    return {
      status: 'unavailable',
      withinRadius: false,
      distanceMeters: null,
      radiusMeters: lab?.radiusMeters ?? null,
      accuracyMeters,
      message: 'Lokasi laboratorium belum diatur. Hubungi asisten.',
    };
  }

  if (!device || !isValidGeoPoint(device)) {
    return {
      status: 'unavailable',
      withinRadius: false,
      distanceMeters: null,
      radiusMeters: lab.radiusMeters,
      accuracyMeters,
      message: 'Lokasi perangkat belum tersedia. Aktifkan GPS lalu coba lagi.',
    };
  }

  const distanceMeters = Math.round(
    haversineDistanceMeters(device, lab.location),
  );

  if (
    accuracyMeters !== null &&
    accuracyMeters > MAX_ACCEPTABLE_ACCURACY_METERS
  ) {
    return {
      status: 'inaccurate',
      withinRadius: false,
      distanceMeters,
      radiusMeters: lab.radiusMeters,
      accuracyMeters,
      message: `Akurasi GPS terlalu rendah (±${Math.round(accuracyMeters)} m). Pindah ke area terbuka lalu coba lagi.`,
    };
  }

  if (distanceMeters <= lab.radiusMeters) {
    return {
      status: 'inside',
      withinRadius: true,
      distanceMeters,
      radiusMeters: lab.radiusMeters,
      accuracyMeters,
      message: `Anda berada dalam radius lab (${distanceMeters} m dari ${lab.radiusMeters} m).`,
    };
  }

  return {
    status: 'outside',
    withinRadius: false,
    distanceMeters,
    radiusMeters: lab.radiusMeters,
    accuracyMeters,
    message: `Anda berada ${distanceMeters} m dari lab, di luar radius ${lab.radiusMeters} m.`,
  };
}
