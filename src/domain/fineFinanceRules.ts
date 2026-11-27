/**
 * fineFinanceRules.ts — Riwayat keuangan denda untuk dashboard Aslab (SRS-4.14).
 *
 * Pemasukan hanya dihitung dari tagihan berstatus `paid`. Status itu ditulis
 * backend setelah webhook Midtrans terverifikasi, sehingga respons klien tidak
 * pernah menambah pemasukan. Setiap tagihan dihitung sekali (ID deterministik
 * per presensi) dan masuk periode menurut waktu pembayaran terverifikasi.
 */

import type { PeriodRange } from './labDashboardRules';
import type { Fine } from './types';

/** `settlement_time` Midtrans: "YYYY-MM-DD HH:mm:ss" dalam WIB tanpa zona. */
const MIDTRANS_LOCAL_TIME = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/;

/** Epoch ms dari ISO 8601 atau format waktu Midtrans; `NaN` bila tidak valid. */
export function paymentTimeMs(value: string | null | undefined): number {
  if (!value) return Number.NaN;
  const local = MIDTRANS_LOCAL_TIME.exec(value.trim());
  if (local) return Date.parse(`${local[1]}T${local[2]}+07:00`);
  return Date.parse(value);
}

export type PaidFine = Fine & { paidAtMs: number };

export type FineFinanceSummary = {
  /** Total rupiah dari tagihan lunas pada periode. */
  receivedAmount: number;
  paidCount: number;
  /** Tagihan lunas pada periode, terbaru lebih dulu. */
  paid: PaidFine[];
  /** Tagihan belum dibayar saat ini; bukan pemasukan. */
  outstandingAmount: number;
  outstandingCount: number;
  /** Tagihan dibebaskan karena izin pada periode; bukan pemasukan. */
  waivedCount: number;
};

export function buildFineFinance(
  fines: readonly Fine[],
  range: PeriodRange,
): FineFinanceSummary {
  const start = range.start.getTime();
  const end = range.end.getTime();
  const inRange = (ms: number) => ms >= start && ms < end;

  const unique = new Map<string, Fine>();
  for (const fine of fines) unique.set(fine.id, fine);

  const paid: PaidFine[] = [];
  let receivedAmount = 0;
  let outstandingAmount = 0;
  let outstandingCount = 0;
  let waivedCount = 0;

  for (const fine of unique.values()) {
    if (fine.status === 'paid') {
      const paidAtMs = paymentTimeMs(fine.paidAt);
      if (!inRange(paidAtMs)) continue;
      paid.push({ ...fine, paidAtMs });
      receivedAmount += Math.round(fine.amount);
    } else if (fine.status === 'unpaid') {
      outstandingCount += 1;
      outstandingAmount += Math.round(fine.amount);
    } else if (inRange(paymentTimeMs(fine.waivedAt))) {
      waivedCount += 1;
    }
  }

  paid.sort((a, b) => b.paidAtMs - a.paidAtMs);

  return {
    receivedAmount,
    paidCount: paid.length,
    paid,
    outstandingAmount,
    outstandingCount,
    waivedCount,
  };
}
