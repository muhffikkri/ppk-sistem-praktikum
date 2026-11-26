import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from 'firebase/firestore';

import {
  DEFAULT_FINE_AMOUNT,
  evaluateFineCreationRule,
  generateFineId,
  waiveFineOnApprovedLeaveRule,
} from '../../domain/fineRules';
import type {
  AttendanceRecord,
  Fine,
  LeaveRequest,
  Session,
} from '../../domain/types';

/**
 * Menerbitkan tagihan denda keterlambatan jika presensi praktikan terlambat (SRS-4.11).
 * Bersifat idempoten (tidak menggandakan tagihan). Modul ini sengaja tidak
 * mengimpor singleton Firebase agar tetap bisa dipakai dari domain test.
 */
export async function issueFineIfLate(
  firestore: Firestore,
  params: {
    session: Session;
    attendance: AttendanceRecord;
    studentLeave?: LeaveRequest;
    fineAmount?: number;
  },
): Promise<{ ok: boolean; fine?: Fine; reason?: string }> {
  const {
    session,
    attendance,
    studentLeave,
    fineAmount = DEFAULT_FINE_AMOUNT,
  } = params;

  const fineId = generateFineId(session.id, attendance.studentId);
  const fineRef = doc(firestore, 'fines', fineId);

  let existingFine: Fine | undefined;
  try {
    const snap = await getDoc(fineRef);
    if (snap.exists()) {
      existingFine = snap.data() as Fine;
    }
  } catch {
    // Jika gagal baca, biarkan undefined
  }

  const result = evaluateFineCreationRule({
    session,
    attendance,
    studentLeave,
    existingFine,
    fineAmount,
  });

  if (!result.eligible) {
    return { ok: false, reason: result.reason };
  }

  // `issuedAt` tetap ditulis agar query layar lama berfungsi.
  const fine: Fine = { ...result.fine, issuedAt: result.fine.createdAt };
  try {
    await setDoc(fineRef, fine, { merge: true });
    return { ok: true, fine };
  } catch (error: any) {
    return { ok: false, reason: error?.message ?? 'unknown_error' };
  }
}

/**
 * Membebaskan denda keterlambatan saat permohonan izin praktikan disetujui (SRS-4.11).
 */
export async function waiveFineIfPresent(
  firestore: Firestore,
  sessionId: string,
  studentId: string,
  approvedLeave: LeaveRequest,
): Promise<{ ok: boolean; reason?: string }> {
  const fineId = generateFineId(sessionId, studentId);
  const fineRef = doc(firestore, 'fines', fineId);

  try {
    const snap = await getDoc(fineRef);
    if (!snap.exists()) {
      return { ok: false, reason: 'fine_not_found' };
    }

    const fine = snap.data() as Fine;
    const waiverResult = waiveFineOnApprovedLeaveRule(fine, approvedLeave);

    if (!waiverResult.ok) {
      return { ok: false, reason: waiverResult.reason };
    }

    await updateDoc(fineRef, {
      status: waiverResult.updatedFine.status,
      waivedAt: waiverResult.updatedFine.waivedAt,
      waiveReason: waiverResult.updatedFine.waiveReason,
      waivedReason: waiverResult.updatedFine.waiveReason,
    });

    return { ok: true };
  } catch (error: any) {
    return { ok: false, reason: error?.message ?? 'unknown_error' };
  }
}

/** Berlangganan data tagihan milik praktikan dengan instance Firestore eksplisit. */
export function subscribeFinesForStudent(
  firestore: Firestore,
  studentId: string,
  onData: (fines: Fine[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const q = query(
    collection(firestore, 'fines'),
    where('studentId', '==', studentId),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((docSnap) => docSnap.data() as Fine));
    },
    (err) => {
      onError?.(err);
    },
  );
}
