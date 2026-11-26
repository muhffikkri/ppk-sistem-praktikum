import assert from 'node:assert/strict';
import test from 'node:test';

import { canSubmitLeave } from './leaveRules';
import type { Session } from './types';

const base: Session = {
  id: 's-leave',
  courseName: 'Praktikum',
  groupName: 'A',
  startsAt: '2026-10-21T08:00:00.000Z',
  endsAt: '2026-10-21T10:00:00.000Z',
  status: 'scheduled',
  openedAt: null,
  closedAt: null,
};

test('canSubmitLeave: scheduled dan open sebelum selesai diizinkan', () => {
  const now = Date.parse('2026-10-21T09:00:00.000Z');
  assert.equal(canSubmitLeave(base, now), true);
  assert.equal(canSubmitLeave({ ...base, status: 'open' }, now), true);
});

test('canSubmitLeave: closed, lewat jadwal, atau tanpa sesi ditolak', () => {
  assert.equal(
    canSubmitLeave({ ...base, status: 'closed' }, Date.parse(base.startsAt)),
    false,
  );
  assert.equal(canSubmitLeave(base, Date.parse(base.endsAt) + 1), false);
  assert.equal(canSubmitLeave(undefined), false);
});
