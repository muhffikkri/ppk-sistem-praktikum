import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import type {
  AsyncActionResult,
  PaymentTransaction,
  PaymentTransactionStatus,
} from '../../domain/types';
import { db, functions } from '../firebase';

type TimestampLike = { toDate: () => Date };

function asIso(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof (value as TimestampLike).toDate === 'function') {
    return (value as TimestampLike).toDate().toISOString();
  }
  return '';
}

function normalizePayment(
  id: string,
  data: Record<string, unknown>,
): PaymentTransaction {
  const status = data.status;
  const txStatus: PaymentTransactionStatus =
    status === 'success' || status === 'failed' ? status : 'pending';
  return {
    id,
    fineId: String(data.fineId ?? ''),
    studentId: String(data.studentId ?? ''),
    sessionId: typeof data.sessionId === 'string' ? data.sessionId : undefined,
    amount: typeof data.amount === 'number' ? data.amount : 0,
    status: txStatus,
    createdAt: asIso(data.createdAt),
    updatedAt: asIso(data.updatedAt),
    paidAt: asIso(data.paidAt) || null,
    snapRedirectUrl:
      typeof data.snapRedirectUrl === 'string' ? data.snapRedirectUrl : null,
    midtransTransactionId:
      typeof data.midtransTransactionId === 'string'
        ? data.midtransTransactionId
        : null,
    paymentType:
      typeof data.paymentType === 'string' ? data.paymentType : null,
    failureReason:
      typeof data.failureReason === 'string' ? data.failureReason : null,
  };
}

export function subscribeStudentPayments(
  uid: string,
  onData: (payments: PaymentTransaction[]) => void,
  onError: (message: string) => void,
) {
  const q = query(
    collection(db, 'payment_transactions'),
    where('studentId', '==', uid),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => normalizePayment(d.id, d.data()))),
    () => onError('Gagal memuat riwayat pembayaran.'),
  );
}

export async function createFineCheckout(
  fineId: string,
): Promise<AsyncActionResult<{ orderId: string; redirectUrl: string }>> {
  try {
    const call = httpsCallable<
      { fineId: string },
      { ok: boolean; orderId: string; redirectUrl: string }
    >(functions, 'createFineCheckout');
    const res = await call({ fineId });
    if (res.data?.ok && res.data.redirectUrl) {
      return {
        ok: true,
        data: { orderId: res.data.orderId, redirectUrl: res.data.redirectUrl },
      };
    }
    return {
      ok: false,
      reason: 'unknown_error',
      message: 'Respons checkout tidak valid.',
    };
  } catch (e: any) {
    const message =
      typeof e?.message === 'string' && e.message
        ? e.message
        : 'Gagal membuat checkout.';
    return { ok: false, reason: e?.code ?? 'unknown_error', message };
  }
}
