/**
 * Geofencing distance & validation rules — Sprint 3
 * Reference: docs/sprint-3-work-split.md (SRS-3.1, SRS-3.2, SRS-3.3)
 */
import type { GeoCoordinates } from './geoTypes';

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Menghitung jarak antara dua koordinat geografis menggunakan rumus Haversine.
 * Hasil dalam satuan meter.
 */
export function calculateDistanceMeters(
  coord1: GeoCoordinates,
  coord2: GeoCoordinates,
): number {
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);

  const lat1 = toRadians(coord1.latitude);
  const lat2 = toRadians(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c * 10) / 10;
}

/**
 * Memeriksa apakah lokasi pengguna berada di dalam radius toleransi laboratorium.
 */
export function isWithinGeofence(
  userCoord: GeoCoordinates,
  labCoord: GeoCoordinates,
  radiusMeters: number,
): boolean {
  const distance = calculateDistanceMeters(userCoord, labCoord);
  return distance <= radiusMeters;
}

/**
 * Format jarak manusiawi (misal: "35 m" atau "1.2 km").
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}
