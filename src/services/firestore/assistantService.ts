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
import { cancelSessionRule, closeSessionRule } from '../../domain/sessionRules';
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

export async function createSession(
  actorUid: string,
  input: SessionInput,
): Promise<AsyncActionResult<string>> {
  try {
    // Validasi sisi server: endsAt > startsAt
    const starts = new Date(input.startsAt);
    const ends = new Date(input.endsAt);
    if (isNaN(starts.getTime()) || isNaN(ends.getTime())) {
      return {
        ok: false,
        reason: 'validation_error',
        message: 'Waktu sesi tidak valid',
      };
    }
    if (ends <= starts) {
      return {
        ok: false,
        reason: 'validation_error',
        message: 'endsAt harus setelah startsAt',
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
    const payload: Record<string, unknown> = {
      classId: input.classId,
      courseName: classData.courseName ?? '',
      groupName: classData.groupName ?? '',
      participantIds: classData.participantIds ?? [],
      assistantIds:
        classAssistantIds.length > 0 ? classAssistantIds : [actorUid],
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

    const docRef = await addDoc(sessionsCol, payload);

    // Update kelas dengan sessionId baru (opsional: bisa ditambahkan ke classes.sessions list)
    await updateDoc(classDoc, {
      updatedAt: new Date().toISOString(),
    });

    return { ok: true, data: docRef.id };
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
    if (isNaN(starts.getTime()) || isNaN(ends.getTime())) {
      return {
        ok: false,
        reason: 'validation_error',
        message: 'Waktu sesi tidak valid',
      };
    }
    if (ends <= starts) {
      return {
        ok: false,
        reason: 'validation_error',
        message: 'endsAt harus setelah startsAt',
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
      payload.courseName = classData.courseName ?? '';
      payload.groupName = classData.groupName ?? '';
      payload.participantIds = classData.participantIds ?? [];
      payload.assistantIds = classData.assistantIds ?? [];
    }

    await updateDoc(sessionDoc, payload);
    return { ok: true };
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
    await updateDoc(sessionDoc, {
      status: result.updatedSession.status,
      cancelledAt: result.updatedSession.cancelledAt,
    });
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
