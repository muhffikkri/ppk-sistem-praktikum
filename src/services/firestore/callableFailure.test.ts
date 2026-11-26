import assert from 'node:assert/strict';
import test from 'node:test';

import { callableFailureReason } from './callableFailure';

test('callableFailureReason: membaca reason dari details', () => {
  assert.equal(
    callableFailureReason({
      code: 'functions/failed-precondition',
      details: { reason: 'active_session_conflict' },
    }),
    'active_session_conflict',
  );
});

test('callableFailureReason: mengabaikan error tanpa details yang valid', () => {
  assert.equal(callableFailureReason(new Error('network')), undefined);
  assert.equal(callableFailureReason({ details: null }), undefined);
  assert.equal(callableFailureReason({ details: { reason: '' } }), undefined);
  assert.equal(callableFailureReason({ details: { reason: 42 } }), undefined);
  assert.equal(callableFailureReason(null), undefined);
});
