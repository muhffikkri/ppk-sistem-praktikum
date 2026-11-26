import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../firebase';
import { getLabById } from './labService';
import {
  validateLabAssignmentInput,
  validateMoveParticipantInput,
} from '../../domain/labDistributionRules';
import type { AsyncActionResult, UserRole } from '../../domain/types';

const LAB_ASSIGNMENTS = 'labAssignments';
const labsCol = collection(db, 'labs');
const classesCol = collection(db, 'classes');
const sessionsCol = collection(db, 'sessions');

type ResolvedUser = {
  uid: string;
  email: string;
  role?: UserRole | string;
  displayName?: string;
};

async function resolveUserByEmail(email: string): Promise<ResolvedUser | null> {
  const normalized = email.trim().toLowerCase();
  try {
    const callable = httpsCallable(functions, 'resolveUserByEmail');
    const res = await callable({ email: normalized });
    const data = res.data as Partial<ResolvedUser> | null;
    if (data?.uid) {
      return {
        uid: data.uid,
        email: data.email ?? normalized,
        role: data.role,
        displayName: data.displayName,
      };
    }
  } catch {
    // Fallback ke callable resolver yang sudah ada bila tersedia
  }

  try {
    const fallback = httpsCallable(functions, 'resolveStudentByEmail');
    const res = await fallback({ email: normalized });
    const data = res.data as Partial<ResolvedUser> | null;
    if (data?.uid) {
      return {
        uid: data.uid,
        email: data.email ?? normalized,
        role: data.role ?? 'student',
        displayName: data.displayName,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export async function assignParticipantToLabByEmail(params: {
  email: string;
  labId: string;
  actorRole?: UserRole | string | null;
}): Promise<AsyncActionResult<{ uid: string; labId: string }>> {
  const actorUid = auth.currentUser?.uid;
  const check = validateLabAssignmentInput({
    actorUid,
    actorRole: params.actorRole ?? 'lab_assistant',
    email: params.email,
    targetLabId: params.labId,
  });
  if (!check.ok) return check;

  const labRes = await getLabById(params.labId);
  if (!labRes.ok) {
    return {
      ok: false,
      reason: 'lab_not_found',
      message: 'Laboratorium tujuan tidak ditemukan.',
    };
  }

  const resolved = await resolveUserByEmail(params.email);
  if (!resolved?.uid) {
    return {
      ok: false,
      reason: 'user_not_found',
      message: 'Pengguna dengan email tersebut tidak ditemukan.',
    };
  }

  if (resolved.role && resolved.role !== 'student') {
    return {
      ok: false,
      reason: 'invalid_role',
      message: 'Email tersebut bukan akun praktikan (student).',
    };
  }

  try {
    const now = new Date().toISOString();
    const assignmentDocId = `${labRes.data.id}__${resolved.uid}`;
    await setDoc(
      doc(db, LAB_ASSIGNMENTS, assignmentDocId),
      {
        labId: labRes.data.id,
        labName: labRes.data.name,
        userId: resolved.uid,
        email: resolved.email,
        assignmentType: 'participant',
        updatedAt: now,
        updatedBy: actorUid,
      },
      { merge: true },
    );

    await setDoc(
      doc(labsCol, labRes.data.id),
      {
        participantIds: arrayUnion(resolved.uid),
        updatedAt: now,
      },
      { merge: true },
    );

    return { ok: true, data: { uid: resolved.uid, labId: labRes.data.id } };
  } catch (e) {
    return {
      ok: false,
      reason: 'unknown_error',
      message:
        e instanceof Error
          ? e.message
          : 'Gagal menempatkan praktikan ke lab.',
    };
  }
}

export async function assignAssistantToLabByEmail(params: {
  email: string;
  labId: string;
  actorRole?: UserRole | string | null;
}): Promise<AsyncActionResult<{ uid: string; labId: string }>> {
  const actorUid = auth.currentUser?.uid;
  const check = validateLabAssignmentInput({
    actorUid,
    actorRole: params.actorRole ?? 'lab_assistant',
    email: params.email,
    targetLabId: params.labId,
  });
  if (!check.ok) return check;

  const labRes = await getLabById(params.labId);
  if (!labRes.ok) {
    return {
      ok: false,
      reason: 'lab_not_found',
      message: 'Laboratorium tujuan tidak ditemukan.',
    };
  }

  const resolved = await resolveUserByEmail(params.email);
  if (!resolved?.uid) {
    return {
      ok: false,
      reason: 'user_not_found',
      message: 'Asisten dengan email tersebut tidak ditemukan.',
    };
  }

  if (
    resolved.role &&
    resolved.role !== 'assistant' &&
    resolved.role !== 'lab_assistant'
  ) {
    return {
      ok: false,
      reason: 'invalid_role',
      message: 'Email tersebut bukan akun asisten praktikum.',
    };
  }

  try {
    const now = new Date().toISOString();
    const assignmentDocId = `${labRes.data.id}__${resolved.uid}`;
    const batch = writeBatch(db);

    batch.set(
      doc(db, LAB_ASSIGNMENTS, assignmentDocId),
      {
        labId: labRes.data.id,
        labName: labRes.data.name,
        userId: resolved.uid,
        email: resolved.email,
        assignmentType: 'assistant',
        updatedAt: now,
        updatedBy: actorUid,
      },
      { merge: true },
    );

    batch.set(
      doc(labsCol, labRes.data.id),
      {
        assistantIds: arrayUnion(resolved.uid),
        updatedAt: now,
      },
      { merge: true },
    );

    const sessionsSnap = await getDocs(
      query(sessionsCol, where('labId', '==', labRes.data.id)),
    );
    sessionsSnap.docs.forEach((s) => {
      batch.set(
        s.ref,
        { assistantIds: arrayUnion(resolved.uid) },
        { merge: true },
      );
    });

    await batch.commit();
    return { ok: true, data: { uid: resolved.uid, labId: labRes.data.id } };
  } catch (e) {
    return {
      ok: false,
      reason: 'unknown_error',
      message:
        e instanceof Error ? e.message : 'Gagal menugaskan asisten ke lab.',
    };
  }
}

export async function moveParticipantBetweenLabs(params: {
  participantUid: string;
  fromLabId: string;
  toLabId: string;
  actorRole?: UserRole | string | null;
}): Promise<AsyncActionResult<{ uid: string; fromLabId: string; toLabId: string }>> {
  const actorUid = auth.currentUser?.uid;
  const check = validateMoveParticipantInput({
    actorUid,
    actorRole: params.actorRole ?? 'lab_assistant',
    participantUid: params.participantUid,
    fromLabId: params.fromLabId,
    toLabId: params.toLabId,
  });
  if (!check.ok) return check;

  const [fromLab, toLab] = await Promise.all([
    getLabById(params.fromLabId),
    getLabById(params.toLabId),
  ]);
  if (!fromLab.ok || !toLab.ok) {
    return {
      ok: false,
      reason: 'lab_not_found',
      message: 'Lab asal atau lab tujuan tidak ditemukan.',
    };
  }

  const uid = params.participantUid.trim();
  const sourceId = fromLab.data.id;
  const targetId = toLab.data.id;

  try {
    const now = new Date().toISOString();
    const fromDoc = await getDoc(
      doc(db, LAB_ASSIGNMENTS, `${sourceId}__${uid}`),
    );
    const email = fromDoc.exists() ? String(fromDoc.data()?.email ?? '') : '';

    const batch = writeBatch(db);
    batch.set(
      doc(db, LAB_ASSIGNMENTS, `${targetId}__${uid}`),
      {
        labId: targetId,
        labName: toLab.data.name,
        userId: uid,
        ...(email ? { email } : {}),
        assignmentType: 'participant',
        movedFromLabId: sourceId,
        updatedAt: now,
        updatedBy: actorUid,
      },
      { merge: true },
    );

    batch.set(
      doc(labsCol, targetId),
      { participantIds: arrayUnion(uid), updatedAt: now },
      { merge: true },
    );
    batch.set(
      doc(labsCol, sourceId),
      { participantIds: arrayRemove(uid), updatedAt: now },
      { merge: true },
    );

    const targetClassesSnap = await getDocs(
      query(classesCol, where('labId', '==', targetId)),
    );
    targetClassesSnap.docs.forEach((c) => {
      batch.set(
        c.ref,
        { participantIds: arrayUnion(uid) },
        { merge: true },
      );
    });

    await batch.commit();
    return {
      ok: true,
      data: { uid, fromLabId: sourceId, toLabId: targetId },
    };
  } catch (e) {
    return {
      ok: false,
      reason: 'unknown_error',
      message:
        e instanceof Error
          ? e.message
          : 'Gagal memindahkan praktikan antar lab.',
    };
  }
}