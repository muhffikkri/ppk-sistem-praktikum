/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyLeaveReason } from '../../../ai/leaveClassifier';
import {
  requireRole,
  validateReason,
  leaveFailure,
} from '../../services/firestore/leaveService';

test('klasifikasi EDOM lokal: tanpa fetch, hasil deterministik, aman gagal', async () => {
  const empty = await classifyLeaveReason('   ');
  assert.deepEqual(empty, {
    status: 'unavailable',
    category: null,
    confidence: null,
    errorMessage:
      'Klasifikasi AI tidak tersedia. Pengajuan tetap dapat diperiksa asisten.',
  });

  const negatif = await classifyLeaveReason('malas praktikum, gak mau datang');
  assert.equal(negatif.status, 'classified');
  assert.equal(negatif.category, 'alasan_weak');
  assert.ok(
    negatif.confidence !== null &&
      negatif.confidence > 0 &&
      negatif.confidence <= 1,
  );

  const netral = await classifyLeaveReason('ada keperluan penting keluarga');
  assert.equal(netral.status, 'classified');
  assert.equal(netral.category, 'alasan_netral');

  const positif = await classifyLeaveReason('sakit demam dan flu');
  assert.equal(positif.status, 'classified');
  assert.equal(positif.category, 'alasan_strong');

  // Teks tanpa kata yang dikenal model -> netral, bukan diklaim terprediksi.
  const unknown = await classifyLeaveReason('zzz qqq www');
  assert.equal(unknown.status, 'classified');
  assert.equal(unknown.category, 'alasan_netral');
  assert.equal(unknown.confidence, 0.5);
});

test('leave validation requires a trimmed reason and the correct role', () => {
  assert.equal(validateReason('  demam  '), 'demam');
  assert.throws(() => validateReason('    '));
  assert.throws(() => validateReason('izin'));
  assert.throws(() => requireRole(null, 'student'));
  assert.throws(() =>
    requireRole(
      {
        uid: 'a',
        role: 'assistant',
        displayName: 'A',
        email: 'a@example.test',
        createdAt: '',
      },
      'student',
    ),
  );
  assert.equal(leaveFailure({ code: 'permission-denied' }).reason, 'forbidden');
});
