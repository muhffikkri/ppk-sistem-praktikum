import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  updateDoc,
  deleteField,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../firebase';
import { groupBySession } from './batching';
import { callableFailureReason } from './callableFailure';
import { normalizeAttendanceRecord } from './normalize';
import { validateSessionTimeBlock } from '../../domain/sessionTimeRules';
import {
  releasableAfterClose,
  slotIdsFor,
  type SlotWindow,
} from '../../domain/labSlotRules';
import {
  findSlotConflict,
  labConflictFailure,
  queueSlotChanges,
} from './labSlotService';
import { cancelSessionRule, closeSessionRule } from '../../domain/sessionRules';
import { DEFAULT_TOLERANCE_MINUTES } from '../../domain/lateToleranceRules';
import {
  PracticalClass,
  Session,
  AttendanceRecord,
  ClassInput,
  SessionInput,
  AsyncActionResult,
} from '../../domain/types';

// ============================================================
// FIRESTORE COLLECTION REFERENCES
// ============================================================

const classesCol = collection(db, 'classes');
const sessionsCol = collection(db, 'sessions');
const attendanceCol = collection(db, 'attendance');

type LabSessionRoster = {
  participantIds: string[];
  assistantIds: string[];
  toleranceMinutes: number;
  courseCode: string;
};

async function loadLabSessionRoster(labId: string, classId: string) {
  const getRoster = httpsCallable<
    { labId: string; classId: string },
    LabSessionRoster
  >(functions, 'getLabSessionRoster');
  return (await getRoster({ labId, classId })).data;
}

type AsyncFailure = { ok: false; reason: string; message: string };

function toFailure(e: unknown): AsyncFailure {
  const code =
    typeof e === 'object' && e !== null && 'code' in e
      ? String((e as { code?: unknown }).code)
      : '';

  if (code === 'permission-denied') {
    return {
      ok: false,
      reason: 'forbidden',
      message: 'Akses ditolak oleh aturan keamanan.',
    };
  }
  if (code === 'unavailable') {
    return {
      ok: false,
      reason: 'network_error',
      message: 'Koneksi bermasalah. Coba lagi.',
    };
  }
  return {
    ok: false,
    reason: 'unknown_error',
    message: e instanceof Error ? e.message : 'Terjadi kesalahan. Coba lagi.',
  };
}

// ============================================================
// CRUD: Classes
// ============================================================

export async function createClass(
  actorUid: string,
  input: ClassInput,
): Promise<AsyncActionResult<string>> {
  const courseName = input.courseName.trim();
  const groupName = input.groupName.trim();

  if (!courseName || !groupName) {
    return {
      ok: false,
      reason: 'validation_error',
      message: 'Nama mata kuliah dan kelompok wajib diisi.',
    };
  }

  try {
    const docRef = await addDoc(classesCol, {
      courseCode: input.courseCode,
      courseName,
      groupName,
      assistantIds: [actorUid],
      participantIds: [],
      createdBy: actorUid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { ok: true, data: docRef.id };
  } catch (e) {
    return toFailure(e);
  }
}

export async function updateClass(
  classId: string,
  input: ClassInput,
): Promise<AsyncActionResult> {
  try {
    const classDoc = doc(db, 'classes', classId);
    await updateDoc(classDoc, {
      courseCode: input.courseCode,
      courseName: input.courseName,
      groupName: input.groupName,
      updatedAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (e) {
    return toFailure(e);
  }
}

export async function deleteClass(classId: string): Promise<AsyncActionResult> {
  const actorUid = auth.currentUser?.uid;
  if (!actorUid) {
    return {
      ok: false,
      reason: 'unauthenticated',
      message: 'Silakan login ulang.',
    };
  }

  try {
    // Filter ownership agar query lolos rule list `sessions`.
    const sessionsSnap = await getDocs(
      query(sessionsCol, where('assistantIds', 'array-contains', actorUid)),
    );
    const batch = writeBatch(db);
    sessionsSnap.docs
      .filter((d: any) => d.data().classId === classId)
      .forEach((d: any) => batch.delete(d.ref));
    batch.delete(doc(db, 'classes', classId));
    await batch.commit();
    return { ok: true };
  } catch (e) {
    return toFailure(e);
  }
}

// ============================================================
// CRUD: Peserta Kelas
// ============================================================

export async function addParticipantByEmail(
  classId: string,
  email: string,
): Promise<AsyncActionResult> {
  const actorUid = auth.currentUser?.uid;
  if (!actorUid) {
    return {
      ok: false,
      reason: 'unauthenticated',
      message: 'Silakan login ulang.',
    };
  }

  try {
    const classDoc = doc(db, 'classes', classId);
    const classSnap = await getDoc(classDoc);
    if (!classSnap.exists()) {
      return {
        ok: false,
        reason: 'class_not_found',
        message: 'Kelas tidak ditemukan',
      };
    }

    const classData = classSnap.data() as PracticalClass;

    // Resolusi email dilakukan server: klien asisten tidak boleh query users.
    let studentUid: string | undefined;
    try {
      const resolve = httpsCallable(functions, 'resolveStudentByEmail');
      const response = await resolve({ email: email.trim() });
      studentUid = (response.data as { uid?: string } | null)?.uid;
    } catch {
      studentUid = undefined;
    }
    if (!studentUid) {
      return {
        ok: false,
        reason: 'user_not_found',
        message: 'User dengan email tersebut tidak terdaftar',
      };
    }

    // Tambahkan participantIds ke kelas
    const updatedParticipantIds = [
      ...(classData.participantIds || []),
      studentUid,
    ].filter((id, idx, self) => Boolean(id) && self.indexOf(id) === idx);

    const updatedAt = new Date().toISOString();

    // Sync participantIds ke kelas & semua sesinya secara atomik.
    const sessionsSnap = await getDocs(
      query(sessionsCol, where('assistantIds', 'array-contains', actorUid)),
    );
    const batch = writeBatch(db);
    batch.update(classDoc, {
      participantIds: updatedParticipantIds,
      updatedAt,
    });
    sessionsSnap.docs
      .filter((s: any) => s.data().classId === classId)
      .forEach((s: any) =>
        batch.update(s.ref, {
          participantIds: updatedParticipantIds,
        }),
      );
    await batch.commit();

    return { ok: true };
  } catch (e) {
    return toFailure(e);
  }
}

export async function removeParticipant(
  classId: string,
  studentUid: string,
): Promise<AsyncActionResult> {
  const actorUid = auth.currentUser?.uid;
  if (!actorUid) {
    return {
      ok: false,
      reason: 'unauthenticated',
      message: 'Silakan login ulang.',
    };
  }

  try {
    const classDoc = doc(db, 'classes', classId);
    const classSnap = await getDoc(classDoc);
    if (!classSnap.exists()) {
      return {
        ok: false,
        reason: 'class_not_found',
        message: 'Kelas tidak ditemukan',
      };
    }
    const updatedParticipantIds = (
      (classSnap.data() as PracticalClass).participantIds || []
    ).filter((id: string) => id !== studentUid);
    // Sync participantIds ke kelas & semua sesinya secara atomik.
    const sessionsSnap = await getDocs(
      query(sessionsCol, where('assistantIds', 'array-contains', actorUid)),
    );
    const batch = writeBatch(db);
    batch.update(classDoc, {
      participantIds: updatedParticipantIds,
      updatedAt: new Date().toISOString(),
    });
    sessionsSnap.docs
      .filter((s: any) => s.data().classId === classId)
      .forEach((s: any) =>
        batch.update(s.ref, {
          participantIds: ((s.data().participantIds as string[]) || []).filter(
            (id: string) => id !== studentUid,
          ),
        }),
      );
    await batch.commit();

    return { ok: true };
  } catch (e) {
    return toFailure(e);
  }
}

// ============================================================
// CRUD: Jadwal & Sesi
// ============================================================

/** Rentang lab sesi tersimpan; sesi lama mungkin belum punya `startsAtMs`. */
function slotWindowOf(data: Record<string, unknown> | undefined): SlotWindow {
  const startsAtMs =
    typeof data?.startsAtMs === 'number'
      ? data.startsAtMs
      : Date.parse(String(data?.startsAt ?? ''));
  const endsAtMs =
    typeof data?.endsAtMs === 'number'
      ? data.endsAtMs
      : Date.parse(String(data?.endsAt ?? ''));
  return {
    labId: typeof data?.labId === 'string' ? data.labId : null,
    startsAtMs,
    endsAtMs,
    status: typeof data?.status === 'string' ? data.status : undefined,
  };
}

/**
 * Commit batch sesi + slot. Bila rules menolak karena slot sudah terisi
 * sesi lain (balapan setelah pengecekan awal), kembalikan pesan bentrok.
 */
async function commitWithSlots(
  batch: ReturnType<typeof writeBatch>,
  slotIds: readonly string[],
  sessionId: string,
): Promise<AsyncActionResult | null> {
  try {
    await batch.commit();
    return null;
  } catch (e) {
    const conflict = await findSlotConflict(slotIds, sessionId).catch(
      () => null,
    );
    if (conflict) return labConflictFailure(conflict);
    throw e;
  }
}

export async function createSession(
  actorUid: string,
  input: SessionInput,
): Promise<AsyncActionResult<string>> {
  try {
    // Guard blok waktu sebelum menulis (#69).
    const starts = new Date(input.startsAt);
    const ends = new Date(input.endsAt);
    const timeBlock = validateSessionTimeBlock(starts, ends);
    if (!timeBlock.ok) {
      return {
        ok: false,
        reason: 'validation_error',
        message: timeBlock.message,
      };
    }

    const classDoc = doc(db, 'classes', input.classId);
    const classSnap = await getDoc(classDoc);
    if (!classSnap.exists()) {
      return {
        ok: false,
        reason: 'class_not_found',
        message: 'Kelas tujuan tidak ditemukan',
      };
    }

    const classData = classSnap.data() as Partial<PracticalClass>;
    const classAssistantIds = classData.assistantIds ?? [];
    const roster = input.labId
      ? await loadLabSessionRoster(input.labId, input.classId)
      : null;
    const payload: Record<string, unknown> = {
      classId: input.classId,
      courseCode: classData.courseCode ?? '',
      courseName: classData.courseName ?? '',
      groupName: classData.groupName ?? '',
      participantIds: roster?.participantIds ?? classData.participantIds ?? [],
      assistantIds:
        roster?.assistantIds ??
        (classAssistantIds.length > 0 ? classAssistantIds : [actorUid]),
      toleranceMinutes: roster?.toleranceMinutes ?? DEFAULT_TOLERANCE_MINUTES,
      startsAt: starts.toISOString(),
      endsAt: ends.toISOString(),
      startsAtMs: starts.getTime(),
      endsAtMs: ends.getTime(),
      status: 'scheduled',
      openedAt: null,
      closedAt: null,
      createdBy: actorUid,
      createdAt: new Date().toISOString(),
    };

    if (input.title) payload.title = input.title;
    if (input.lab) payload.lab = input.lab;
    if (input.labId) payload.labId = input.labId;

    const sessionRef = doc(sessionsCol);
    const slotIds = slotIdsFor({
      labId: input.labId,
      startsAtMs: starts.getTime(),
      endsAtMs: ends.getTime(),
    });
    // Cek awal untuk pesan yang jelas; rules tetap menjadi penjaga atomik.
    const conflict = await findSlotConflict(slotIds, sessionRef.id);
    if (conflict) return labConflictFailure(conflict);

    const batch = writeBatch(db);
    batch.set(sessionRef, payload);
    queueSlotChanges(batch, [], slotIds, {
      sessionId: sessionRef.id,
      courseName: String(payload.courseName),
      groupName: String(payload.groupName),
      createdBy: actorUid,
    });
    const slotFailure = await commitWithSlots(batch, slotIds, sessionRef.id);
    if (slotFailure) return slotFailure as AsyncActionResult<string>;

    // Update kelas dengan sessionId baru (opsional: bisa ditambahkan ke classes.sessions list)
    await updateDoc(classDoc, {
      updatedAt: new Date().toISOString(),
    });

    return { ok: true, data: sessionRef.id };
  } catch (e) {
    return toFailure(e);
  }
}

export async function updateSession(
  sessionId: string,
  input: SessionInput,
): Promise<AsyncActionResult> {
  try {
    const sessionDoc = doc(db, 'sessions', sessionId);
    const snap = await getDoc(sessionDoc);
    if (!snap.exists()) {
      return {
        ok: false,
        reason: 'session_not_found',
        message: 'Sesi tidak ditemukan',
      };
    }

    const starts = new Date(input.startsAt);
    const ends = new Date(input.endsAt);
    const timeBlock = validateSessionTimeBlock(starts, ends);
    if (!timeBlock.ok) {
      return {
        ok: false,
        reason: 'validation_error',
        message: timeBlock.message,
      };
    }

    // Kelas bisa diganti saat edit: samakan nama, peserta, dan asisten.
    const classDoc = doc(db, 'classes', input.classId);
    const classSnap = await getDoc(classDoc);
    if (!classSnap.exists()) {
      return {
        ok: false,
        reason: 'class_not_found',
        message: 'Kelas tujuan tidak ditemukan',
      };
    }
    const classData = classSnap.data() as Partial<PracticalClass>;
    const sameClass = snap.data()?.classId === input.classId;
    const sameLab = (snap.data()?.labId ?? '') === (input.labId ?? '');
    const roster =
      (!sameClass || !sameLab) && input.labId
        ? await loadLabSessionRoster(input.labId, input.classId)
        : null;

    const payload: Record<string, unknown> = {
      classId: input.classId,
      startsAt: starts.toISOString(),
      endsAt: ends.toISOString(),
      startsAtMs: starts.getTime(),
      endsAtMs: ends.getTime(),
      updatedAt: new Date().toISOString(),
      title: input.title || deleteField(),
      lab: input.lab || deleteField(),
      labId: input.labId || deleteField(),
    };
    if (!sameClass) {
      payload.courseCode = classData.courseCode ?? '';
      payload.courseName = classData.courseName ?? '';
      payload.groupName = classData.groupName ?? '';
    }
    if (!sameClass || !sameLab) {
      payload.participantIds =
        roster?.participantIds ?? classData.participantIds ?? [];
      payload.assistantIds =
        roster?.assistantIds ?? classData.assistantIds ?? [];
    }
    if (!sameLab) {
      payload.toleranceMinutes =
        roster?.toleranceMinutes ?? DEFAULT_TOLERANCE_MINUTES;
    }

    const previousSlots = slotIdsFor(slotWindowOf(snap.data()));
    const nextSlots = slotIdsFor({
      labId: input.labId,
      startsAtMs: starts.getTime(),
      endsAtMs: ends.getTime(),
    });
    const newSlots = nextSlots.filter((id) => !previousSlots.includes(id));
    const conflict = await findSlotConflict(newSlots, sessionId);
    if (conflict) return labConflictFailure(conflict);

    const batch = writeBatch(db);
    batch.update(sessionDoc, payload);
    queueSlotChanges(batch, previousSlots, nextSlots, {
      sessionId,
      courseName: String(payload.courseName ?? snap.data()?.courseName ?? ''),
      groupName: String(payload.groupName ?? snap.data()?.groupName ?? ''),
      createdBy: auth.currentUser?.uid ?? '',
    });
    return (await commitWithSlots(batch, newSlots, sessionId)) ?? { ok: true };
  } catch (e) {
    return toFailure(e);
  }
}

export async function cancelSession(
  sessionId: string,
): Promise<AsyncActionResult> {
  try {
    const sessionDoc = doc(db, 'sessions', sessionId);
    const snap = await getDoc(sessionDoc);
    const session = snap.exists()
      ? ({ id: snap.id, ...(snap.data() ?? {}) } as Session)
      : undefined;
    const result = cancelSessionRule(session);
    if (!result.ok) {
      return {
        ok: false,
        reason: result.reason,
        message:
          result.reason === 'invalid_status'
            ? 'Hanya sesi terjadwal yang bisa dibatalkan.'
            : 'Sesi tidak ditemukan.',
      };
    }
    // Batal melepas seluruh slot agar lab bisa dipakai sesi lain.
    const batch = writeBatch(db);
    batch.update(sessionDoc, {
      status: result.updatedSession.status,
      cancelledAt: result.updatedSession.cancelledAt,
    });
    queueSlotChanges(batch, slotIdsFor(slotWindowOf(snap.data())), [], {
      sessionId,
      courseName: '',
      groupName: '',
      createdBy: '',
    });
    await batch.commit();
    return { ok: true };
  } catch (e) {
    return toFailure(e);
  }
}

// Session control: open/close

export async function openSession(
  sessionId: string,
): Promise<AsyncActionResult> {
  try {
    // Rules tidak bisa memeriksa sesi open lain, jadi pembukaan sesi
    // divalidasi atomik oleh callable openSession di server.
    await httpsCallable(functions, 'openSession')({ sessionId });
    return { ok: true };
  } catch (e) {
    const reason = callableFailureReason(e);
    if (reason) {
      return {
        ok: false,
        reason,
        message:
          e instanceof Error && e.message
            ? e.message
            : 'Sesi tidak dapat dibuka.',
      };
    }
    return toFailure(e);
  }
}

export async function closeSession(
  sessionId: string,
): Promise<AsyncActionResult> {
  try {
    const sessionDoc = doc(db, 'sessions', sessionId);
    const snap = await getDoc(sessionDoc);
    if (!snap.exists()) {
      return {
        ok: false,
        reason: 'session_not_found',
        message: 'Sesi tidak ditemukan',
      };
    }

    const session = { id: snap.id, ...(snap.data() ?? {}) } as Session;
    const result = closeSessionRule(session);

    if (!result.ok) {
      return {
        ok: false,
        reason: result.reason,
        message:
          result.reason === 'invalid_status'
            ? 'Hanya sesi terbuka yang bisa ditutup.'
            : 'Sesi tidak ditemukan.',
      };
    }

    await updateDoc(sessionDoc, {
      status: result.updatedSession.status,
      closedAt: result.updatedSession.closedAt,
    });
    await releaseSlotsAfterClose(sessionId, snap.data());
    return { ok: true };
  } catch (e) {
    return toFailure(e);
  }
}

// ============================================================
// Real-time listeners (onSnapshot)
// ============================================================

export function subscribeClasses(
  uid: string,
  onClasses: (classes: PracticalClass[]) => void,
  onError: (msg: string) => void,
) {
  const q = query(
    classesCol,
    where('assistantIds', 'array-contains', uid),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap: any) => {
      const classes = snap.docs.map(
        (d: any) => ({ id: d.id, ...d.data() }) as PracticalClass,
      );
      onClasses(classes);
    },
    (err: any) => {
      onError(err.message || 'Gagal memuat kelas');
    },
  );
}

export function subscribeSessions(
  uid: string,
  onSessions: (sessions: Session[]) => void,
  onError: (msg: string) => void,
) {
  const q = query(
    sessionsCol,
    where('assistantIds', 'array-contains', uid),
    orderBy('startsAt', 'asc'),
  );
  return onSnapshot(
    q,
    (snap: any) => {
      const sessions = snap.docs.map(
        (d: any) => ({ id: d.id, ...d.data() }) as Session,
      );
      onSessions(sessions);
    },
    (err: any) => {
      onError(err.message || 'Gagal memuat sesi');
    },
  );
}

export function subscribeAttendanceForSession(
  sessionId: string,
  onData: (records: AttendanceRecord[]) => void,
  onError: (msg: string) => void,
) {
  // Query single-field (sessionId) lalu urutkan di klien agar tidak gagal saat
  // composite index (sessionId, checkedInAt) belum di-deploy di Firestore.
  const q = query(attendanceCol, where('sessionId', '==', sessionId));
  return onSnapshot(
    q,
    (snap: any) => {
      const records = snap.docs
        .map((d: any) => normalizeAttendanceRecord(d.id, d.data()))
        .sort((a: AttendanceRecord, b: AttendanceRecord) =>
          (a.checkedInAt ?? '').localeCompare(b.checkedInAt ?? ''),
        );
      onData(records);
    },
    (err: any) => {
      onError(err.message || 'Gagal memuat kehadiran');
    },
  );
}
/**
 * Attendance for up to 30 sessions through one listener (`in` filter cap).
 * Records are sorted by check-in time on the client, so the query needs no
 * extra composite index. Every requested session gets an entry.
 */
export function subscribeAttendanceForSessionChunk(
  sessionIds: string[],
  onData: (bySession: Record<string, AttendanceRecord[]>) => void,
  onError: (msg: string) => void,
) {
  const q = query(attendanceCol, where('sessionId', 'in', sessionIds));
  return onSnapshot(
    q,
    (snap) => {
      const records = snap.docs
        .map((d) => normalizeAttendanceRecord(d.id, d.data()))
        .sort((a, b) =>
          (a.checkedInAt ?? '').localeCompare(b.checkedInAt ?? ''),
        );
      onData(groupBySession(sessionIds, records));
    },
    (err) => {
      onError(err.message || 'Gagal memuat kehadiran');
    },
  );
}

/**
 * Tutup lebih awal melepas jam berikutnya. Dijalankan terpisah dan tidak
 * menggagalkan penutupan sesi bila gagal: kunci jam lama tidak berbahaya.
 */
async function releaseSlotsAfterClose(
  sessionId: string,
  data: Record<string, unknown> | undefined,
): Promise<void> {
  const slots = releasableAfterClose(slotWindowOf(data), Date.now());
  if (slots.length === 0) return;
  const batch = writeBatch(db);
  queueSlotChanges(batch, slots, [], {
    sessionId,
    courseName: '',
    groupName: '',
    createdBy: '',
  });
  await batch.commit().catch(() => undefined);
}
