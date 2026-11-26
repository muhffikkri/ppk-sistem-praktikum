import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canDistributeLab,
  isSessionAssignedToAssistant,
  validateLabAssignmentInput,
  validateMoveParticipantInput,
} from './labDistributionRules';
import type { PracticalClass, Session } from './types';

describe('labDistributionRules (SRS-4.04–4.07)', () => {
  it('mengizinkan hanya Aslab (lab_assistant) untuk distribusi lab', () => {
    assert.equal(canDistributeLab('lab_assistant'), true);
    assert.equal(canDistributeLab('assistant'), false);
    assert.equal(canDistributeLab('student'), false);
    assert.equal(canDistributeLab(undefined), false);
  });

  it('memvalidasi input penempatan praktikan/asisten by email', () => {
    assert.equal(
      validateLabAssignmentInput({
        actorUid: 'aslab-1',
        actorRole: 'lab_assistant',
        email: 'mhs@example.com',
        targetLabId: 'lab-a',
      }).ok,
      true,
    );

    const forbidden = validateLabAssignmentInput({
      actorUid: 'asprak-1',
      actorRole: 'assistant',
      email: 'mhs@example.com',
      targetLabId: 'lab-a',
    });
    assert.equal(forbidden.ok, false);
    if (!forbidden.ok) {
      assert.equal(forbidden.reason, 'forbidden');
    }

    const invalidEmail = validateLabAssignmentInput({
      actorUid: 'aslab-1',
      actorRole: 'lab_assistant',
      email: 'bukan-email',
      targetLabId: 'lab-a',
    });
    assert.equal(invalidEmail.ok, false);
    if (!invalidEmail.ok) {
      assert.equal(invalidEmail.reason, 'invalid_input');
    }
  });

  it('memvalidasi pemindahan praktikan antar lab dan menolak lab yang sama', () => {
    assert.equal(
      validateMoveParticipantInput({
        actorUid: 'aslab-1',
        actorRole: 'lab_assistant',
        participantUid: 'mhs-uid-1',
        fromLabId: 'lab-a',
        toLabId: 'lab-b',
      }).ok,
      true,
    );

    const sameLab = validateMoveParticipantInput({
      actorUid: 'aslab-1',
      actorRole: 'lab_assistant',
      participantUid: 'mhs-uid-1',
      fromLabId: 'lab-a',
      toLabId: 'lab-a',
    });
    assert.equal(sameLab.ok, false);
    if (!sameLab.ok) {
      assert.equal(sameLab.reason, 'same_lab');
    }
  });

  it('menentukan apakah sesi berada dalam cakupan Asprak/Aslab', () => {
    const classes: PracticalClass[] = [
      {
        id: 'cls-1',
        courseCode: 'IF201',
        courseName: 'Basis Data',
        groupName: 'A1',
        labId: 'lab-b',
        assistantIds: [],
        participantIds: ['mhs-1'],
        createdBy: 'aslab-1',
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
      },
    ];

    const sessionByLab: Session = {
      id: 'ses-1',
      courseName: 'Basis Data',
      groupName: 'A1',
      labId: 'lab-b',
      startsAt: '2026-11-27T07:00:00.000Z',
      endsAt: '2026-11-27T09:00:00.000Z',
      status: 'scheduled',
      openedAt: null,
      closedAt: null,
    };

    const sessionByClass: Session = {
      id: 'ses-2',
      classId: 'cls-1',
      courseName: 'Basis Data',
      groupName: 'A1',
      startsAt: '2026-11-27T09:30:00.000Z',
      endsAt: '2026-11-27T11:30:00.000Z',
      status: 'scheduled',
      openedAt: null,
      closedAt: null,
    };

    assert.equal(
      isSessionAssignedToAssistant({
        session: sessionByLab,
        assistantUid: 'asprak-1',
        role: 'assistant',
        assignedLabIds: ['lab-b'],
        classes,
      }),
      true,
    );

    assert.equal(
      isSessionAssignedToAssistant({
        session: sessionByClass,
        assistantUid: 'asprak-1',
        role: 'assistant',
        assignedLabIds: ['lab-b'],
        classes,
      }),
      true,
    );

    assert.equal(
      isSessionAssignedToAssistant({
        session: sessionByLab,
        assistantUid: 'mhs-1',
        role: 'student',
        assignedLabIds: ['lab-b'],
        classes,
      }),
      false,
    );
  });
});