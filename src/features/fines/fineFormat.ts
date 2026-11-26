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

export function formatRupiah(amount: number): string {
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
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
