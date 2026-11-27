import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  HOUR_MS,
  diffSlots,
  labSlotId,
  releasableAfterClose,
  sessionHourSlots,
  sessionsOverlap,
  slotIdsFor,
} from './labSlotRules';

const H8 = Date.UTC(2026, 10, 26, 1); // 08.00 WIB
const at = (hours: number) => H8 + hours * HOUR_MS;

describe('sessionsOverlap (#68)', () => {
  it('rentang yang beririsan bentrok', () => {
    assert.equal(
      sessionsOverlap(
        { startsAtMs: at(0), endsAtMs: at(2) },
        { startsAtMs: at(1), endsAtMs: at(3) },
      ),
      true,
    );
  });

  it('rentang di dalam rentang lain bentrok', () => {
    assert.equal(
      sessionsOverlap(
        { startsAtMs: at(0), endsAtMs: at(4) },
        { startsAtMs: at(1), endsAtMs: at(2) },
      ),
      true,
    );
  });

  it('batas yang bersentuhan tidak bentrok', () => {
    assert.equal(
      sessionsOverlap(
        { startsAtMs: at(0), endsAtMs: at(2) },
        { startsAtMs: at(2), endsAtMs: at(4) },
      ),
      false,
    );
  });

  it('rentang terpisah tidak bentrok', () => {
    assert.equal(
      sessionsOverlap(
        { startsAtMs: at(0), endsAtMs: at(1) },
        { startsAtMs: at(3), endsAtMs: at(4) },
      ),
      false,
    );
  });
});

describe('slot lab per jam (#68)', () => {
  it('sesi dua jam menempati dua slot', () => {
    assert.deepEqual(sessionHourSlots(at(0), at(2)), [at(0), at(1)]);
    assert.deepEqual(
      slotIdsFor({ labId: 'lab-a', startsAtMs: at(0), endsAtMs: at(2) }),
      [labSlotId('lab-a', at(0)), labSlotId('lab-a', at(1))],
    );
  });

  it('slot yang sama berarti bentrok, slot bersebelahan tidak', () => {
    const first = slotIdsFor({
      labId: 'lab-a',
      startsAtMs: at(0),
      endsAtMs: at(2),
    });
    const overlapping = slotIdsFor({
      labId: 'lab-a',
      startsAtMs: at(1),
      endsAtMs: at(3),
    });
    const adjacent = slotIdsFor({
      labId: 'lab-a',
      startsAtMs: at(2),
      endsAtMs: at(4),
    });
    const otherLab = slotIdsFor({
      labId: 'lab-b',
      startsAtMs: at(0),
      endsAtMs: at(2),
    });
    assert.ok(overlapping.some((id) => first.includes(id)));
    assert.ok(!adjacent.some((id) => first.includes(id)));
    assert.ok(!otherLab.some((id) => first.includes(id)));
  });

  it('sesi tanpa lab atau dibatalkan tidak menempati slot', () => {
    assert.deepEqual(
      slotIdsFor({ labId: null, startsAtMs: at(0), endsAtMs: at(2) }),
      [],
    );
    assert.deepEqual(
      slotIdsFor({
        labId: 'lab-a',
        startsAtMs: at(0),
        endsAtMs: at(2),
        status: 'cancelled',
      }),
      [],
    );
  });

  it('edit sesi sendiri hanya membuat dan melepas selisih slot', () => {
    const before = slotIdsFor({
      labId: 'lab-a',
      startsAtMs: at(0),
      endsAtMs: at(2),
    });
    const after = slotIdsFor({
      labId: 'lab-a',
      startsAtMs: at(1),
      endsAtMs: at(3),
    });
    const diff = diffSlots(before, after);
    assert.deepEqual(diff.create, [labSlotId('lab-a', at(2))]);
    assert.deepEqual(diff.release, [labSlotId('lab-a', at(0))]);
    assert.deepEqual(diffSlots(before, before), { create: [], release: [] });
  });

  it('menutup sesi lebih awal melepas jam berikutnya saja', () => {
    const window = { labId: 'lab-a', startsAtMs: at(0), endsAtMs: at(3) };
    assert.deepEqual(releasableAfterClose(window, at(0) + 30 * 60 * 1000), [
      labSlotId('lab-a', at(1)),
      labSlotId('lab-a', at(2)),
    ]);
    assert.deepEqual(releasableAfterClose(window, at(3)), []);
  });
});
