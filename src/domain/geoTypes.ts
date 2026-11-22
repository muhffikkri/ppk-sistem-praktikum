import type { SessionStatus } from './types';

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
}

export type DeviceFix = GeoPoint & {
  accuracyMeters?: number | null;
  capturedAt?: string;
};

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
  | 'name'
  | 'building'
  | 'latitude'
  | 'longitude'
  | 'radiusMeters';

export type LabInputErrors = Partial<Record<LabInputField, string>>;

/**
 * Hasil pemeriksaan geofence:
 * - `inside`: dalam radius, presensi boleh dicatat.
 * - `outside`: di luar radius.
 * - `inaccurate`: lokasi terbaca tapi akurasi GPS terlalu rendah.
 * - `unavailable`: lokasi perangkat atau koordinat lab tidak tersedia.
 */
export type GeofenceStatus =
  | 'inside'
  | 'outside'
  | 'inaccurate'
  | 'unavailable';

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

export interface LabLocation {
  id: string;
  name: string;
  code?: string;
  building: string;
  floor?: string;
  description?: string;
  coordinates: GeoCoordinates;
  radiusMeters: number; // radius toleransi presensi dalam meter (default: 50m)
  capacity?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LabSessionInfo {
  id: string;
  classId?: string;
  courseName: string;
  groupName: string;
  title?: string;
  startsAt: string; // ISO 8601
  endsAt: string; // ISO 8601
  status: SessionStatus;
  lab?: string;
  assistantName?: string;
}

export interface LabActivity {
  lab: LabLocation;
  currentSession: LabSessionInfo | null; // sesi yang sedang berlangsung
  nextSession: LabSessionInfo | null; // sesi terjadwal berikutnya
  isOccupied: boolean; // true jika ada sesi aktif
}

export interface UserLocationState {
  coordinates: GeoCoordinates | null;
  accuracy: number | null;
  timestamp: number | null;
  error: string | null;
  isLocating: boolean;
  permissionGranted: boolean | null;
}

export type LabMapFilter = 'all' | 'occupied' | 'available';

/**
 * Titik tengah default lingkungan Laboratorium Informatika Undip Tembalang.
 */
export const DEFAULT_CAMPUS_CENTER: GeoCoordinates = {
  latitude: -7.0507,
  longitude: 110.4383,
};

/**
 * Data awal (fallback & seed) laboratorium lingkungan Informatika Undip Tembalang
 * yang selaras dengan data sesi di Sprint 1 & 2.
 */
export const DEFAULT_CAMPUS_LABS: LabLocation[] = [
  {
    id: 'lab-rpl-32',
    name: 'Lab 3.2 RPL · Ged B',
    code: 'RPL-32',
    building: 'Gedung B',
    floor: 'Lantai 3',
    description: 'Laboratorium Rekayasa Perangkat Lunak & Sistem Cerdas',
    coordinates: {
      latitude: -7.05068,
      longitude: 110.43828,
    },
    radiusMeters: 50,
    capacity: 40,
    isActive: true,
  },
  {
    id: 'lab-rpl-31',
    name: 'Lab 3.1 RPL · Ged B',
    code: 'RPL-31',
    building: 'Gedung B',
    floor: 'Lantai 3',
    description: 'Laboratorium Pemrograman & Basis Data Lanjut',
    coordinates: {
      latitude: -7.05074,
      longitude: 110.43834,
    },
    radiusMeters: 50,
    capacity: 35,
    isActive: true,
  },
  {
    id: 'lab-database',
    name: 'Lab Database · Ged C',
    code: 'DBS-01',
    building: 'Gedung C',
    floor: 'Lantai 2',
    description: 'Laboratorium Basis Data & Sistem Informasi',
    coordinates: {
      latitude: -7.05082,
      longitude: 110.43845,
    },
    radiusMeters: 50,
    capacity: 45,
    isActive: true,
  },
  {
    id: 'lab-jaringan',
    name: 'Lab Jaringan · Ged B302',
    code: 'NET-302',
    building: 'Gedung B',
    floor: 'Lantai 3',
    description: 'Laboratorium Jaringan Komputer & Cyber Security',
    coordinates: {
      latitude: -7.05062,
      longitude: 110.4382,
    },
    radiusMeters: 50,
    capacity: 30,
    isActive: true,
  },
  {
    id: 'lab-ai',
    name: 'Lab AI & Vision · Ged C',
    code: 'AI-201',
    building: 'Gedung C',
    floor: 'Lantai 2',
    description: 'Laboratorium Kecerdasan Buatan & Pengolahan Citra',
    coordinates: {
      latitude: -7.05088,
      longitude: 110.43852,
    },
    radiusMeters: 50,
    capacity: 35,
    isActive: true,
  },
  {
    id: 'lab-sensor',
    name: 'Lab Sensor & IoT · Ged A',
    code: 'IOT-101',
    building: 'Gedung A',
    floor: 'Lantai 1',
    description: 'Laboratorium Internet of Things & Sistem Tertanam',
    coordinates: {
      latitude: -7.05055,
      longitude: 110.43812,
    },
    radiusMeters: 60,
    capacity: 30,
    isActive: true,
  },
];