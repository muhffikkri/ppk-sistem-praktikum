import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  formatDateTime,
  formatHourMinute,
  formatSessionDate,
  formatTimeRange,
  formatWeekdayDayMonth,
} from './date';

// Cached formatters must render exactly what the per-call locale methods did.
const samples = [
  '2026-11-25T08:05:09.000Z',
  '2026-01-01T00:00:00.000Z',
  '2026-06-30T23:59:59.000Z',
];

test('formatSessionDate matches toLocaleDateString', () => {
  for (const iso of samples) {
    assert.equal(
      formatSessionDate(iso),
      new Date(iso).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    );
  }
});

test('formatWeekdayDayMonth matches toLocaleDateString', () => {
  for (const iso of samples) {
    const date = new Date(iso);
    assert.equal(
      formatWeekdayDayMonth(date),
      date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    );
  }
});

test('formatHourMinute matches toLocaleTimeString', () => {
  for (const iso of samples) {
    const date = new Date(iso);
    assert.equal(
      formatHourMinute(date),
      date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    );
  }
});

test('formatDateTime matches toLocaleString', () => {
  for (const iso of samples) {
    const date = new Date(iso);
    assert.equal(formatDateTime(date), date.toLocaleString('id-ID'));
  }
});

test('formatTimeRange joins two clock times', () => {
  const start = new Date(2026, 10, 25, 15, 30).toISOString();
  const end = new Date(2026, 10, 25, 17, 0).toISOString();
  assert.equal(formatTimeRange(start, end), '15.30 – 17.00');
});
