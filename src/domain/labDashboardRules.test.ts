import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import type { Lab } from './geoTypes';
import {
  buildLabDashboard,
  isWithinRange,
  periodRange,
} from './labDashboardRules';
import type { PracticalClass, Session } from './types';

// Kamis, 26 November 2026 10.00 waktu perangkat.
const NOW = new Date(2026, 10, 26, 10, 0);

function lab(id: string, overrides: Partial<Lab> = {}): Lab {
  return {
    id,
    name: `Lab ${id}`,
    building: 'Gedung B',
    description: null,
    courseId: 'IF3121',
    location: { latitude: -6.2, longitude: 106.8 },
    radiusMeters: 50,
    isActive: true,
    createdBy: 'aslab',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

function session(
  id: string,
  start: Date,
  overrides: Partial<Session> = {},
): Session {
  return {
    id,
    classId: 'class-a',
    courseName: 'Praktikum Sistem Terdistribusi',
    groupName: 'A',
    labId: 'l1',
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    status: 'scheduled',
    openedAt: null,
    closedAt: null,
    ...overrides,
  };
}

function cls(id: string, participantIds: string[]): PracticalClass {
  return {
    id,
    courseCode: 'IF3121',
    courseName: 'Praktikum Sistem Terdistribusi',
    groupName: id,
    assistantIds: [],
    participantIds,
    createdBy: 'asprak',
    createdAt: '',
    updatedAt: '',
  };
}

describe('periodRange', () => {
  it('hari: tengah malam hingga tengah malam berikutnya', () => {
    const range = periodRange('day', 0, NOW);
    assert.deepEqual(range.start, new Date(2026, 10, 26));
    assert.deepEqual(range.end, new Date(2026, 10, 27));
  });

  it('minggu: Senin sampai Senin berikutnya, dapat digeser', () => {
    assert.deepEqual(periodRange('week', 0, NOW).start, new Date(2026, 10, 23));
    assert.deepEqual(periodRange('week', 0, NOW).end, new Date(2026, 10, 30));
    assert.deepEqual(
      periodRange('week', -1, NOW).start,
      new Date(2026, 10, 16),
    );
  });

  it('minggu: hari Minggu tetap ikut minggu yang dimulai Senin sebelumnya', () => {
    const sunday = new Date(2026, 10, 29, 9);
    assert.deepEqual(
      periodRange('week', 0, sunday).start,
      new Date(2026, 10, 23),
    );
  });

  it('bulan: melintasi pergantian tahun', () => {
    const range = periodRange('month', 1, NOW);
    assert.deepEqual(range.start, new Date(2026, 11, 1));
    assert.deepEqual(range.end, new Date(2027, 0, 1));
  });

  it('isWithinRange: batas akhir tidak termasuk', () => {
    const range = periodRange('day', 0, NOW);
    assert.equal(isWithinRange(range.start.toISOString(), range), true);
    assert.equal(isWithinRange(range.end.toISOString(), range), false);
  });
});

describe('buildLabDashboard (SRS-4.12, SRS-4.13)', () => {
  const range = periodRange('week', 0, NOW);

  it('menghitung praktikan unik sekali di seluruh kelas', () => {
    const summary = buildLabDashboard({
      labs: [lab('l1'), lab('l2', { isActive: false })],
      classes: [cls('a', ['s1', 's2']), cls('b', ['s2', 's3'])],
      periodSessions: [],
      currentSessions: [],
      range,
      now: NOW,
    });
    assert.equal(summary.labCount, 2);
    assert.equal(summary.activeLabCount, 1);
    assert.equal(summary.participantCount, 3);
  });

  it('menentukan status lab: berlangsung, terjadwal, kosong, nonaktif', () => {
    const open = session('open', new Date(2026, 10, 26, 9), {
      status: 'open',
      labId: 'l1',
    });
    const next = session('next', new Date(2026, 10, 27, 9), { labId: 'l2' });
    const summary = buildLabDashboard({
      labs: [
        lab('l3', { name: 'C' }),
        lab('l2', { name: 'B' }),
        lab('l1', { name: 'A' }),
        lab('l4', { name: 'D', isActive: false }),
      ],
      classes: [],
      periodSessions: [],
      currentSessions: [open, next],
      range,
      now: NOW,
    });
    assert.deepEqual(
      summary.labs.map((row) => [row.lab.id, row.status]),
      [
        ['l1', 'live'],
        ['l2', 'scheduled'],
        ['l3', 'idle'],
        ['l4', 'inactive'],
      ],
    );
    assert.equal(summary.labs[0].current?.id, 'open');
    assert.equal(summary.labs[1].next?.id, 'next');
  });

  it('memisahkan sesi berlangsung, akan datang, dan riwayat periode', () => {
    const closed = session('closed', new Date(2026, 10, 24, 9), {
      status: 'closed',
    });
    const cancelled = session('cancelled', new Date(2026, 10, 25, 9), {
      status: 'cancelled',
    });
    const missed = session('missed', new Date(2026, 10, 25, 13));
    const open = session('open', new Date(2026, 10, 26, 9), { status: 'open' });
    const later = session('later', new Date(2026, 10, 26, 13));
    const outside = session('outside', new Date(2026, 10, 10, 9), {
      status: 'closed',
    });

    const summary = buildLabDashboard({
      labs: [lab('l1')],
      classes: [],
      periodSessions: [closed, cancelled, missed, open, later],
      // Sesi yang sama dari dua query tidak boleh terhitung ganda.
      currentSessions: [open, later, outside],
      range,
      now: NOW,
    });

    assert.deepEqual(
      summary.live.map((s) => s.id),
      ['open'],
    );
    assert.deepEqual(
      summary.upcoming.map((s) => s.id),
      ['later'],
    );
    assert.deepEqual(
      summary.history.map((s) => s.id),
      ['missed', 'cancelled', 'closed'],
    );
    assert.equal(summary.periodSessionCount, 4);
    assert.equal(summary.labs[0].periodSessionCount, 4);
  });

  it('menghitung praktikan periode dari sesi, dengan cadangan roster kelas', () => {
    const summary = buildLabDashboard({
      labs: [],
      classes: [cls('class-a', ['s1', 's2'])],
      periodSessions: [
        session('x', new Date(2026, 10, 24, 9), { participantIds: ['s3'] }),
        session('y', new Date(2026, 10, 25, 9)),
        session('z', new Date(2026, 10, 25, 13), {
          status: 'cancelled',
          participantIds: ['s9'],
        }),
      ],
      currentSessions: [],
      range,
      now: NOW,
    });
    assert.equal(summary.periodParticipantCount, 3);
  });

  it('cakupan kosong menghasilkan ringkasan nol', () => {
    const summary = buildLabDashboard({
      labs: [],
      classes: [],
      periodSessions: [],
      currentSessions: [],
      range,
      now: NOW,
    });
    assert.equal(summary.labCount, 0);
    assert.equal(summary.participantCount, 0);
    assert.deepEqual(summary.labs, []);
    assert.deepEqual(summary.history, []);
  });
});
