import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canDistributeParticipants,
  canManageLabMaster,
  filterAssignedClasses,
  filterAssignedSessions,
  isClassAssignedToAsprak,
  isSessionAssignedToAsprak,
} from './asprakScope';
import type { PracticalClass, Session } from './types';

test('isSessionAssignedToAsprak: mencocokkan asisten yang ditugaskan', () => {
  const session: Pick<Session, 'assistantIds'> = {
    assistantIds: ['asprak-1', 'asprak-2'],
  };

  assert.equal(isSessionAssignedToAsprak(session, 'asprak-1'), true);
  assert.equal(isSessionAssignedToAsprak(session, 'asprak-2'), true);
  assert.equal(isSessionAssignedToAsprak(session, 'asprak-3'), false);
  assert.equal(isSessionAssignedToAsprak(null, 'asprak-1'), false);
  assert.equal(isSessionAssignedToAsprak(session, ''), false);
});

test('isClassAssignedToAsprak: mencocokkan kelas yang ditugaskan', () => {
  const classObj: Pick<PracticalClass, 'assistantIds'> = {
    assistantIds: ['asprak-1'],
  };

  assert.equal(isClassAssignedToAsprak(classObj, 'asprak-1'), true);
  assert.equal(isClassAssignedToAsprak(classObj, 'asprak-2'), false);
  assert.equal(isClassAssignedToAsprak(undefined, 'asprak-1'), false);
});

test('filterAssignedSessions: menyaring sesi sesuai penugasan Asprak', () => {
  const sessions = [
    { id: 's1', assistantIds: ['asprak-1'] },
    { id: 's2', assistantIds: ['asprak-2'] },
    { id: 's3', assistantIds: ['asprak-1', 'asprak-3'] },
  ] as Session[];

  const result1 = filterAssignedSessions(sessions, 'asprak-1');
  assert.deepEqual(
    result1.map((s) => s.id),
    ['s1', 's3'],
  );

  const result2 = filterAssignedSessions(sessions, 'asprak-2');
  assert.deepEqual(
    result2.map((s) => s.id),
    ['s2'],
  );

  const resultNone = filterAssignedSessions(sessions, 'asprak-99');
  assert.equal(resultNone.length, 0);
});

test('filterAssignedClasses: menyaring kelas sesuai penugasan Asprak', () => {
  const classes = [
    { id: 'c1', assistantIds: ['asprak-1'] },
    { id: 'c2', assistantIds: ['asprak-2'] },
  ] as PracticalClass[];

  const result = filterAssignedClasses(classes, 'asprak-1');
  assert.deepEqual(
    result.map((c) => c.id),
    ['c1'],
  );
});

test('canManageLabMaster: membatasi wewenang master lab (SRS-4.07)', () => {
  // Hanya Aslab (lab_assistant) yang berwenang
  assert.equal(canManageLabMaster('lab_assistant'), true);

  // Asprak (assistant) dan Praktikan (student) tidak berwenang
  assert.equal(canManageLabMaster('assistant'), false);
  assert.equal(canManageLabMaster('student'), false);
  assert.equal(canManageLabMaster(null), false);
  assert.equal(canManageLabMaster(undefined), false);
});

test('canDistributeParticipants: membatasi wewenang distribusi peserta (SRS-4.07)', () => {
  // Hanya Aslab (lab_assistant) yang berwenang
  assert.equal(canDistributeParticipants('lab_assistant'), true);

  // Asprak (assistant) tidak berwenang
  assert.equal(canDistributeParticipants('assistant'), false);
  assert.equal(canDistributeParticipants('student'), false);
});
