import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';

import type { Fine, FineStatus } from '../../domain/types';
import { db } from '../firebase';

type TimestampLike = { toDate: () => Date };

function asIso(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof (value as TimestampLike).toDate === 'function') {
    return (value as TimestampLike).toDate().toISOString();
  }
  return '';
}

function normalizeFine(id: string, data: Record<string, unknown>): Fine {
  const status = data.status;
  const fineStatus: FineStatus =
    status === 'paid' || status === 'waived' ? status : 'unpaid';
  return {
    id,
    studentId: String(data.studentId ?? ''),
    sessionId: String(data.sessionId ?? ''),
    attendanceId: String(data.attendanceId ?? ''),
    classId: typeof data.classId === 'string' ? data.classId : undefined,
    courseName:
      typeof data.courseName === 'string' ? data.courseName : undefined,
    groupName: typeof data.groupName === 'string' ? data.groupName : undefined,
    labId: typeof data.labId === 'string' ? data.labId : undefined,
    lab: typeof data.lab === 'string' ? data.lab : undefined,
    amount: typeof data.amount === 'number' ? data.amount : 0,
    issuedAt: asIso(data.issuedAt),
    status: fineStatus,
    paidAt: asIso(data.paidAt) || null,
    waivedAt: asIso(data.waivedAt) || null,
    waivedReason:
      typeof data.waivedReason === 'string' ? data.waivedReason : null,
  };
}

export function subscribeStudentFines(
  uid: string,
  onData: (fines: Fine[]) => void,
  onError: (message: string) => void,
) {
  const q = query(
    collection(db, 'fines'),
    where('studentId', '==', uid),
    orderBy('issuedAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => normalizeFine(d.id, d.data()))),
    () => onError('Gagal memuat tagihan. Periksa koneksi lalu coba lagi.'),
  );
}

export function subscribeFine(
  fineId: string,
  onData: (fine: Fine | null) => void,
  onError: (message: string) => void,
) {
  return onSnapshot(
    doc(db, 'fines', fineId),
    (snap) =>
      onData(snap.exists() ? normalizeFine(snap.id, snap.data()) : null),
    () => onError('Gagal memuat detail tagihan.'),
  );
}
