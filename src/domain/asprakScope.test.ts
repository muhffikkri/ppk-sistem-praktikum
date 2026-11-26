import assert from 'node:assert/strict';
import test from 'node:test';

import { canManageLabMaster, isAssistantRole } from './asprakScope';

test('canManageLabMaster: membatasi wewenang master lab (SRS-4.07)', () => {
  // Hanya Aslab (lab_assistant) yang berwenang
  assert.equal(canManageLabMaster('lab_assistant'), true);

  // Asprak (assistant) dan Praktikan (student) tidak berwenang
  assert.equal(canManageLabMaster('assistant'), false);
  assert.equal(canManageLabMaster('student'), false);
  assert.equal(canManageLabMaster(null), false);
  assert.equal(canManageLabMaster(undefined), false);
});

test('isAssistantRole: mencakup Asprak dan Aslab', () => {
  assert.equal(isAssistantRole('assistant'), true);
  assert.equal(isAssistantRole('lab_assistant'), true);
  assert.equal(isAssistantRole('student'), false);
  assert.equal(isAssistantRole(null), false);
  assert.equal(isAssistantRole(undefined), false);
});
