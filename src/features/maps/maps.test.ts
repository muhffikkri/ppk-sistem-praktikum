import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateDistanceMeters,
  formatDistance,
  isWithinGeofence,
} from '../../domain/geofenceRules';
import {
  DEFAULT_CAMPUS_LABS,
  type GeoCoordinates,
  type LabLocation,
} from '../../domain/geoTypes';
import { computeLabActivities } from '../../services/firestore/labActivityService';
import type { Session } from '../../domain/types';

test('calculateDistanceMeters: menghitung jarak haversine dengan benar', () => {
  const coordA: GeoCoordinates = { latitude: -6.89148, longitude: 107.61065 };
  const coordB: GeoCoordinates = { latitude: -6.89148, longitude: 107.61065 };

  // Jarak ke titik yang sama harus 0
  assert.equal(calculateDistanceMeters(coordA, coordB), 0);

  // Titik yang berjarak ~50 meter
  const coordC: GeoCoordinates = { latitude: -6.89188, longitude: 107.61065 };
  const dist = calculateDistanceMeters(coordA, coordC);
  assert.ok(dist > 40 && dist < 60, `Jarak terhitung: ${dist}m`);
});

test('isWithinGeofence: memvalidasi radius toleransi laboratorium', () => {
  const labCoord: GeoCoordinates = { latitude: -6.89148, longitude: 107.61065 };
  const userInside: GeoCoordinates = {
    latitude: -6.89155,
    longitude: 107.61065,
  };
  const userFarAway: GeoCoordinates = {
    latitude: -6.89500,
    longitude: 107.61500,
  };

  assert.equal(isWithinGeofence(userInside, labCoord, 50), true);
  assert.equal(isWithinGeofence(userFarAway, labCoord, 50), false);
});

test('formatDistance: format satuan meter dan kilometer', () => {
  assert.equal(formatDistance(35), '35 m');
  assert.equal(formatDistance(999), '999 m');
  assert.equal(formatDistance(1500), '1.5 km');
});

test('computeLabActivities: mendeteksi sesi aktif dan sesi berikutnya per lab', () => {
  const sampleLabs: LabLocation[] = [DEFAULT_CAMPUS_LABS[0]]; // Lab 3.2 RPL · Ged B
  const now = new Date('2026-11-19T10:00:00.000Z');

  const sessions: Session[] = [
    {
      id: 'sess-active',
      classId: 'cls-1',
      courseName: 'Rekayasa Perangkat Lunak',
      groupName: 'Kelas 3SE1',
      title: 'Sprint 3 Review',
      lab: 'Lab 3.2 RPL · Ged B',
      startsAt: '2026-11-19T09:00:00.000Z',
      endsAt: '2026-11-19T11:00:00.000Z',
      status: 'open',
      openedAt: '2026-11-19T09:05:00.000Z',
      closedAt: null,
    },
    {
      id: 'sess-next',
      classId: 'cls-2',
      courseName: 'Pemrograman Web Lanjut',
      groupName: 'Kelas 3SE2',
      lab: 'Lab 3.2 RPL · Ged B',
      startsAt: '2026-11-19T13:00:00.000Z',
      endsAt: '2026-11-19T15:00:00.000Z',
      status: 'scheduled',
      openedAt: null,
      closedAt: null,
    },
  ];

  const activities = computeLabActivities(sampleLabs, sessions, now);

  assert.equal(activities.length, 1);
  const act = activities[0];
  assert.equal(act.isOccupied, true);
  assert.equal(act.currentSession?.id, 'sess-active');
  assert.equal(act.currentSession?.courseName, 'Rekayasa Perangkat Lunak');
  assert.equal(act.nextSession?.id, 'sess-next');
  assert.equal(act.nextSession?.courseName, 'Pemrograman Web Lanjut');
});

test('computeLabActivities: lab kosong jika tidak ada sesi berjalan', () => {
  const sampleLabs: LabLocation[] = [DEFAULT_CAMPUS_LABS[0]];
  const now = new Date('2026-11-19T16:00:00.000Z');

  const sessions: Session[] = [
    {
      id: 'sess-past',
      courseName: 'Praktikum Selesai',
      groupName: 'Kelas 3SE1',
      lab: 'Lab 3.2 RPL · Ged B',
      startsAt: '2026-11-19T08:00:00.000Z',
      endsAt: '2026-11-19T10:00:00.000Z',
      status: 'closed',
      openedAt: null,
      closedAt: '2026-11-19T10:00:00.000Z',
    },
  ];

  const activities = computeLabActivities(sampleLabs, sessions, now);
  assert.equal(activities[0].isOccupied, false);
  assert.equal(activities[0].currentSession, null);
  assert.equal(activities[0].nextSession, null);
});
