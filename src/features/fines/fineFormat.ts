import type { FineStatus, PaymentTransactionStatus } from '../../domain/types';
import type { BadgeTone } from '../../shared/ui';

const FINE_LABEL: Record<FineStatus, string> = {
  paid: 'Lunas',
  waived: 'Dibebaskan',
  unpaid: 'Belum bayar',
};

const FINE_TONE: Record<FineStatus, BadgeTone> = {
  paid: 'success',
  waived: 'lavender',
  unpaid: 'danger',
};

const PAYMENT_LABEL: Record<PaymentTransactionStatus, string> = {
  success: 'Berhasil',
  failed: 'Gagal',
  pending: 'Pending',
};

const PAYMENT_TONE: Record<PaymentTransactionStatus, BadgeTone> = {
  success: 'success',
  failed: 'danger',
  pending: 'pink',
};

// Satu formatter untuk semua baris; `toLocaleString` membuat formatter baru
// pada setiap panggilan dan lambat di Hermes.
let rupiahFormatter: Intl.NumberFormat | null | undefined;

function groupThousands(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatRupiah(amount: number): string {
  const value = Math.round(amount);
  if (rupiahFormatter === undefined) {
    try {
      rupiahFormatter = new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 0,
      });
    } catch {
      rupiahFormatter = null;
    }
  }
  return `Rp ${rupiahFormatter ? rupiahFormatter.format(value) : groupThousands(value)}`;
}

export function fineStatusLabel(status: FineStatus): string {
  return FINE_LABEL[status];
}

export function fineStatusTone(status: FineStatus): BadgeTone {
  return FINE_TONE[status];
}

export function paymentStatusLabel(status: PaymentTransactionStatus): string {
  return PAYMENT_LABEL[status];
}

export function paymentStatusTone(status: PaymentTransactionStatus): BadgeTone {
  return PAYMENT_TONE[status];
}
