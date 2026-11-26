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
import { asIso, asNullableString, asOptionalString } from './normalize';

function normalizeFine(id: string, data: Record<string, unknown>): Fine {
  const status = data.status;
  const fineStatus: FineStatus =
    status === 'paid' || status === 'waived' ? status : 'unpaid';
  const optional = {
    classId: asOptionalString(data.classId),
    courseName: asOptionalString(data.courseName),
    groupName: asOptionalString(data.groupName),
    labId: asOptionalString(data.labId),
    lab: asOptionalString(data.lab),
  };
  const nullable = {
    waivedReason: asNullableString(data.waivedReason),
  };
  return {
    id,
    studentId: String(data.studentId ?? ''),
    sessionId: String(data.sessionId ?? ''),
    attendanceId: String(data.attendanceId ?? ''),
    ...optional,
    amount: typeof data.amount === 'number' ? data.amount : 0,
    issuedAt: asIso(data.issuedAt),
    status: fineStatus,
    paidAt: asIso(data.paidAt) || null,
    waivedAt: asIso(data.waivedAt) || null,
    ...nullable,
  } as Fine;
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
