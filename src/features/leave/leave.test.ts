/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyLeaveReason } from '../../services/ai/leaveClassifier';
import {
  requireRole,
  validateReason,
  leaveFailure,
} from '../../services/firestore/leaveService';

test('AI normalizes supported responses, fails safely, and sends trimmed reason', async () => {
  const original = globalThis.fetch;
  try {
    let body: string | undefined;
    globalThis.fetch = async (_url, init) => {
      body = init?.body as string;
      return new Response(JSON.stringify({ label: 'Sakit', score: 0.85 }));
    };
    assert.deepEqual(
      await classifyLeaveReason('  demam tinggi  ', 'https://example.test'),
      { status: 'classified', category: 'Sakit', confidence: 0.85 },
    );
    assert.deepEqual(JSON.parse(body!), {
      text: 'demam tinggi',
      reason: 'demam tinggi',
    });
    for (const data of [
      null,
      {},
      { category: '' },
      { category: 5 },
      { category: 'Sakit', confidence: 2 },
    ]) {
      globalThis.fetch = async () => new Response(JSON.stringify(data));
      assert.equal(
        (await classifyLeaveReason('demam', 'https://example.test')).status,
        'unavailable',
      );
    }
    globalThis.fetch = async () => new Response('error', { status: 503 });
    assert.equal(
      (await classifyLeaveReason('demam', 'https://example.test')).status,
      'unavailable',
    );
    globalThis.fetch = async () => {
      throw new Error('offline');
    };
    assert.equal(
      (await classifyLeaveReason('demam', 'https://example.test')).status,
      'unavailable',
    );
    assert.equal(
      (await classifyLeaveReason('demam', '')).status,
      'unavailable',
    );
  } finally {
    globalThis.fetch = original;
  }
});

test('AI times out even when transport ignores abort', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = () => new Promise(() => {});
    const result = await classifyLeaveReason('demam', 'https://example.test');
    assert.equal(result.status, 'unavailable');
    assert.equal(result.category, null);
    assert.equal(result.confidence, null);
  } finally {
    globalThis.fetch = original;
  }
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
