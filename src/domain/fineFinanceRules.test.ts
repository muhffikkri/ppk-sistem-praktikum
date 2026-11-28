import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildFineFinance, paymentTimeMs } from './fineFinanceRules';
import type { PeriodRange } from './labDashboardRules';
import type { Fine } from './types';

// November 2026 dalam WIB.
const NOVEMBER: PeriodRange = {
  start: new Date('2026-10-31T17:00:00.000Z'),
  end: new Date('2026-11-30T17:00:00.000Z'),
};

function fine(id: string, overrides: Partial<Fine> = {}): Fine {
  return {
    id,
    studentId: `s-${id}`,
    studentName: 'Budi',
    sessionId: `session-${id}`,
    attendanceId: `session-${id}_s-${id}`,
    labId: 'lab-a',
    amount: 10000,
    status: 'unpaid',
    createdAt: '2026-11-20T02:00:00.000Z',
    ...overrides,
  };
}

describe('paymentTimeMs', () => {
  it('membaca ISO 8601', () => {
    assert.equal(
      paymentTimeMs('2026-11-26T03:00:00.000Z'),
      Date.UTC(2026, 10, 26, 3),
    );
  });

  it('membaca settlement_time Midtrans sebagai WIB', () => {
    assert.equal(
      paymentTimeMs('2026-11-26 10:00:00'),
      Date.UTC(2026, 10, 26, 3),
    );
  });

  it('nilai kosong atau rusak menjadi NaN', () => {
    assert.ok(Number.isNaN(paymentTimeMs(null)));
    assert.ok(Number.isNaN(paymentTimeMs('bukan tanggal')));
  });
});

describe('buildFineFinance (SRS-4.14)', () => {
  it('hanya tagihan lunas pada periode yang menjadi pemasukan', () => {
    const summary = buildFineFinance(
      [
        fine('a', { status: 'paid', paidAt: '2026-11-10T03:00:00.000Z' }),
        fine('b', { status: 'paid', paidAt: '2026-11-25 09:00:00' }),
        fine('c', { status: 'paid', paidAt: '2026-10-30T03:00:00.000Z' }),
        fine('d', { status: 'unpaid', amount: 15000 }),
        fine('e', { status: 'waived', waivedAt: '2026-11-21T03:00:00.000Z' }),
        fine('f', { status: 'waived', waivedAt: '2026-10-01T03:00:00.000Z' }),
      ],
      NOVEMBER,
    );
    assert.equal(summary.receivedAmount, 20000);
    assert.equal(summary.paidCount, 2);
    assert.deepEqual(
      summary.paid.map((f) => f.id),
      ['b', 'a'],
    );
    assert.equal(summary.outstandingCount, 1);
    assert.equal(summary.outstandingAmount, 15000);
    assert.equal(summary.waivedCount, 1);
  });

  it('tagihan yang sama dari dua sumber dihitung sekali', () => {
    const paid = fine('a', {
      status: 'paid',
      paidAt: '2026-11-10T03:00:00.000Z',
    });
    const summary = buildFineFinance([paid, { ...paid }], NOVEMBER);
    assert.equal(summary.receivedAmount, 10000);
    assert.equal(summary.paidCount, 1);
  });

  it('pembayaran tepat di akhir periode masuk periode berikutnya', () => {
    const summary = buildFineFinance(
      [fine('a', { status: 'paid', paidAt: NOVEMBER.end.toISOString() })],
      NOVEMBER,
    );
    assert.equal(summary.paidCount, 0);
  });

  it('tagihan lunas tanpa waktu bayar tidak dihitung', () => {
    const summary = buildFineFinance(
      [fine('a', { status: 'paid', paidAt: null })],
      NOVEMBER,
    );
    assert.equal(summary.receivedAmount, 0);
  });
});
