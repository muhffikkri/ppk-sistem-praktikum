import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  evaluateGeofence,
  haversineDistanceMeters,
  parseCoordinate,
  validateLabInput,
} from './geofenceRules';

const lab = {
  location: { latitude: -6.9175, longitude: 107.6191 },
  radiusMeters: 50,
};

test('haversine: titik sama = 0 m, 0.001° lintang ≈ 111 m', () => {
  assert.equal(haversineDistanceMeters(lab.location, lab.location), 0);
  const d = haversineDistanceMeters(lab.location, {
    latitude: lab.location.latitude + 0.001,
    longitude: lab.location.longitude,
  });
  assert.ok(d > 110 && d < 112, `got ${d}`);
});

test('evaluateGeofence: inside, outside, inaccurate, unavailable', () => {
  const inside = evaluateGeofence(
    { latitude: -6.9176, longitude: 107.6191, accuracyMeters: 10 },
    lab,
  );
  assert.equal(inside.status, 'inside');
  assert.equal(inside.withinRadius, true);

  const outside = evaluateGeofence(
    { latitude: -6.9195, longitude: 107.6191 },
    lab,
  );
  assert.equal(outside.status, 'outside');
  assert.equal(outside.withinRadius, false);
  assert.ok((outside.distanceMeters ?? 0) > 50);

  const inaccurate = evaluateGeofence(
    { latitude: -6.9175, longitude: 107.6191, accuracyMeters: 500 },
    lab,
  );
  assert.equal(inaccurate.status, 'inaccurate');
  assert.equal(inaccurate.withinRadius, false);

  assert.equal(evaluateGeofence(null, lab).status, 'unavailable');
  assert.equal(
    evaluateGeofence({ latitude: -6.9, longitude: 107.6 }, null).status,
    'unavailable',
  );
});

test('validateLabInput & parseCoordinate', () => {
  const ok = validateLabInput({
    name: 'Lab RPL',
    building: 'Gedung B',
    latitude: -6.9,
    longitude: 107.6,
    radiusMeters: 50,
    isActive: true,
  });
  assert.deepEqual(ok, {});

  const bad = validateLabInput({
    name: ' ',
    building: '',
    latitude: 91,
    longitude: Number.NaN,
    radiusMeters: 5,
    isActive: true,
  });
  assert.deepEqual(Object.keys(bad).sort(), [
    'building',
    'latitude',
    'longitude',
    'name',
    'radiusMeters',
  ]);

  assert.equal(parseCoordinate('-6,9175'), -6.9175);
  assert.ok(Number.isNaN(parseCoordinate('abc')));
  assert.ok(Number.isNaN(parseCoordinate('')));
});
