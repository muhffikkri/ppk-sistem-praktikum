import type { FineStatus, PaymentTransactionStatus } from '../../domain/types';

export function formatRupiah(amount: number): string {
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

export function fineStatusLabel(status: FineStatus): string {
  if (status === 'paid') return 'Lunas';
  if (status === 'waived') return 'Dibebaskan';
  return 'Belum bayar';
}

export function fineStatusTone(status: FineStatus) {
  if (status === 'paid') return 'success' as const;
  if (status === 'waived') return 'lavender' as const;
  return 'danger' as const;
}

export function paymentStatusLabel(status: PaymentTransactionStatus): string {
  if (status === 'success') return 'Berhasil';
  if (status === 'failed') return 'Gagal';
  return 'Pending';
}

export function paymentStatusTone(status: PaymentTransactionStatus) {
  if (status === 'success') return 'success' as const;
  if (status === 'failed') return 'danger' as const;
  return 'pink' as const;
}
