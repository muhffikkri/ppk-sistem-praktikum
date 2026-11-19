/**
 * Tipe domain geolokasi — Sprint 3 (SRS-3.1).
 * Dipakai bersama oleh pengelolaan lab (P1), presensi berbasis lokasi (P2),
 * dan peta laboratorium (P3).
 */

/** Koordinat dalam derajat desimal (WGS84). */
export type GeoPoint = {
  latitude: number;
  longitude: number;
};

/** Posisi perangkat hasil pembacaan GPS. */
export type DeviceFix = GeoPoint & {
  /** Radius ketidakpastian dalam meter, jika tersedia dari perangkat. */
  accuracyMeters?: number | null;
  /** Waktu pembacaan, ISO 8601 UTC. */
  capturedAt?: string;
};

/** Dokumen koleksi Firestore `labs/{labId}`. */
export type Lab = {
  id: string;
  name: string;
  building: string;
  description: string | null;
  location: GeoPoint;
  /** Radius geofence presensi dalam meter. */
  radiusMeters: number;
  /** Lab nonaktif tidak dipakai untuk sesi baru dan disembunyikan di peta. */
  isActive: boolean;
  createdBy: string;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
};

/** Input form tambah/edit lab dari asisten. */
export type LabInput = {
  name: string;
  building: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
};

export type LabInputField =
  'name' | 'building' | 'latitude' | 'longitude' | 'radiusMeters';

export type LabInputErrors = Partial<Record<LabInputField, string>>;

/**
 * Hasil pemeriksaan geofence:
 * - `inside`: dalam radius, presensi boleh dicatat.
 * - `outside`: di luar radius.
 * - `inaccurate`: lokasi terbaca tapi akurasi GPS terlalu rendah.
 * - `unavailable`: lokasi perangkat atau koordinat lab tidak tersedia.
 */
export type GeofenceStatus =
  'inside' | 'outside' | 'inaccurate' | 'unavailable';

export type GeofenceCheckResult = {
  status: GeofenceStatus;
  /** `true` hanya jika `status === 'inside'`. */
  withinRadius: boolean;
  /** Jarak perangkat ke titik lab (meter, dibulatkan), `null` jika tidak terukur. */
  distanceMeters: number | null;
  radiusMeters: number | null;
  accuracyMeters: number | null;
  /** Pesan siap tampil untuk pengguna. */
  message: string;
};
