import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  blockHourOf,
  defaultEndHour,
  endHourOptions,
  formatHourLabel,
  startHourOptions,
  validateSessionTimeBlock,
} from './sessionTimeRules';

const at = (hour: number, minute = 0, day = 26) =>
  new Date(2026, 10, day, hour, minute);

const reason = (start: Date, end: Date) => {
  const result = validateSessionTimeBlock(start, end);
  return result.ok ? 'ok' : result.reason;
};

describe('pilihan jam sesi (#69)', () => {
  it('jam mulai 07.00 sampai 19.00', () => {
    const hours = startHourOptions();
    assert.equal(hours[0], 7);
    assert.equal(hours.at(-1), 19);
    assert.equal(hours.length, 13);
  });

  it('jam selesai 1–4 jam setelah mulai dan tidak lewat 20.00', () => {
    assert.deepEqual(endHourOptions(8), [9, 10, 11, 12]);
    assert.deepEqual(endHourOptions(18), [19, 20]);
    assert.deepEqual(endHourOptions(19), [20]);
  });

  it('jam selesai bawaan dua jam, dipotong di 20.00', () => {
    assert.equal(defaultEndHour(8), 10);
    assert.equal(defaultEndHour(19), 20);
  });

  it('label jam bulat memakai titik', () => {
    assert.equal(formatHourLabel(7), '07.00');
    assert.equal(formatHourLabel(20), '20.00');
  });

  it('jam tersimpan di luar blok tidak dipilih otomatis', () => {
    const options = startHourOptions();
    assert.equal(blockHourOf(at(9), options), 9);
    assert.equal(blockHourOf(at(9, 31), options), null);
    assert.equal(blockHourOf(at(6), options), null);
  });
});

describe('validateSessionTimeBlock (#69)', () => {
  it('menerima blok jam bulat yang sah, termasuk batas 07.00 dan 20.00', () => {
    assert.equal(reason(at(7), at(8)), 'ok');
    assert.equal(reason(at(16), at(20)), 'ok');
    assert.equal(reason(at(9), at(11)), 'ok');
  });

  it('menolak menit selain 00', () => {
    assert.equal(reason(at(9, 31), at(11)), 'not_whole_hour');
    assert.equal(reason(at(9), at(10, 37)), 'not_whole_hour');
    assert.equal(reason(at(19, 36), at(20)), 'not_whole_hour');
  });

  it('menolak di luar 07.00–20.00', () => {
    assert.equal(reason(at(6), at(8)), 'outside_hours');
    assert.equal(reason(at(18), at(21)), 'outside_hours');
  });

  it('menolak durasi di bawah 1 jam atau di atas 4 jam', () => {
    assert.equal(reason(at(9), at(9)), 'too_short');
    assert.equal(reason(at(10), at(9)), 'too_short');
    assert.equal(reason(at(8), at(13)), 'too_long');
  });

  it('menolak sesi yang melewati hari', () => {
    assert.equal(reason(at(19), at(9, 0, 27)), 'too_long');
    assert.equal(
      reason(new Date(2026, 10, 26, 22), new Date(2026, 10, 27, 0)),
      'different_day',
    );
  });

  it('menolak waktu tidak valid', () => {
    assert.equal(reason(new Date('x'), at(9)), 'invalid_time');
  });
});
