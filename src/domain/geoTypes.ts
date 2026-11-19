/**
 * Domain Geo & Lab Types — Sprint 3 (Location, Geofencing, Maps)
 * Reference: docs/sprint-3-work-split.md (SRS-3.1, SRS-3.2, SRS-3.3)
 */
import type { SessionStatus } from './types';

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
}

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
 * Titik tengah default lingkungan Laboratorium Informatika.
 * Koordinat referensi area kampus Informatika.
 */
export const DEFAULT_CAMPUS_CENTER: GeoCoordinates = {
  latitude: -6.89148,
  longitude: 107.61065,
};

/**
 * Data awal (fallback & seed) laboratorium lingkungan Informatika
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
      latitude: -6.89142,
      longitude: 107.61058,
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
      latitude: -6.89149,
      longitude: 107.61062,
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
      latitude: -6.89158,
      longitude: 107.61075,
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
      latitude: -6.89135,
      longitude: 107.61048,
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
      latitude: -6.89165,
      longitude: 107.61082,
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
      latitude: -6.89125,
      longitude: 107.61035,
    },
    radiusMeters: 60,
    capacity: 30,
    isActive: true,
  },
];
