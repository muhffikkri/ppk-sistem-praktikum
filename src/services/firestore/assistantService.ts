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
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  PracticalClass,
  Session,
  UserProfile,
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
const leaveRequestsCol = collection(db, 'leave_requests');
const usersCol = collection(db, 'users');

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

export async function fetchClasses(): Promise<PracticalClass[]> {
  try {
    const qs = query(classesCol, orderBy('createdAt', 'desc'));
    const snap = await getDocs(qs);
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as PracticalClass));
  } catch (e: any) {
    console.error('fetchClasses error:', e);
    return [];
  }
}

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

// ponytail: deleteClass shadows imported `doc`; rename shadow
export async function deleteClass(classId: string): Promise<AsyncActionResult> {
  try {
    // Also delete associated sessions (batch delete)
    const sessionsSnap = await getDocs(query(sessionsCol, where('classId', '==', classId)));
    const batch = writeBatch(db);
    sessionsSnap.docs.forEach((d: any) => batch.delete(d.ref));
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
  try {
    const classDoc = doc(db, 'classes', classId);
    const classSnap = await getDoc(classDoc);
    if (!classSnap.exists()) {
      return { ok: false, reason: 'class_not_found', message: 'Kelas tidak ditemukan' };
    }

    const classData = classSnap.data() as PracticalClass;

    // Cari user berdasarkan email di collection users
    const usersSnap = await getDocs(query(usersCol, where('email', '==', email)));
    if (usersSnap.empty) {
      return { ok: false, reason: 'user_not_found', message: 'User dengan email tersebut tidak terdaftar' };
    }

    const userDoc = usersSnap.docs[0];
    const userData = userDoc.data() as UserProfile;

    if (userData.role !== 'student') {
      return { ok: false, reason: 'validation_error', message: 'Email tersebut bukan akun praktikan' };
    }

    // Tambahkan participantIds ke kelas
    const updatedParticipantIds = [...(classData.participantIds || []), userData.uid].filter(
      (id, idx, self) => self.indexOf(id) === idx,
    );

    await updateDoc(classDoc, {
      participantIds: updatedParticipantIds,
      updatedAt: new Date().toISOString(),
    });

    // Sync participantIds ke semua sesi milik classId ini
    const sessionsSnap = await getDocs(query(sessionsCol, where('classId', '==', classId)));
    await Promise.all(
      sessionsSnap.docs.map((s: any) =>
        updateDoc(s.ref, {
          participantIds: updatedParticipantIds,
        }),
      ),
    );

    return { ok: true };
  } catch (e) {
    return toFailure(e);
  }
}

export async function removeParticipant(
  classId: string,
  studentUid: string,
): Promise<AsyncActionResult> {
  try {
    const classDoc = doc(db, 'classes', classId);
    const classSnap = await getDoc(classDoc);
    if (!classSnap.exists()) {
      return { ok: false, reason: 'class_not_found', message: 'Kelas tidak ditemukan' };
    }
    const updatedParticipantIds = ((classSnap.data() as PracticalClass).participantIds || []).filter(
      (id: string) => id !== studentUid,
    );
    await updateDoc(classDoc, {
      participantIds: updatedParticipantIds,
      updatedAt: new Date().toISOString(),
    });

    // Sync ke semua sesi milik classId ini
    const sessionsSnap = await getDocs(query(sessionsCol, where('classId', '==', classId)));
    await Promise.all(
      sessionsSnap.docs.map((s: any) =>
        updateDoc(s.ref, {
          participantIds: ((s.data().participantIds as string[]) || []).filter(
            (id: string) => id !== studentUid,
          ),
        }),
      ),
    );

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
      return { ok: false, reason: 'validation_error', message: 'Waktu sesi tidak valid' };
    }
    if (ends <= starts) {
      return { ok: false, reason: 'validation_error', message: 'endsAt harus setelah startsAt' };
    }

    const classDoc = doc(db, 'classes', input.classId);
    const classSnap = await getDoc(classDoc);
    if (!classSnap.exists()) {
      return { ok: false, reason: 'class_not_found', message: 'Kelas tujuan tidak ditemukan' };
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
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      status: 'scheduled',
      openedAt: null,
      closedAt: null,
      createdBy: actorUid,
      createdAt: new Date().toISOString(),
    };

    if (input.title) payload.title = input.title;
    if (input.lab) payload.lab = input.lab;

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
      return { ok: false, reason: 'session_not_found', message: 'Sesi tidak ditemukan' };
    }

    const starts = new Date(input.startsAt);
    const ends = new Date(input.endsAt);
    if (isNaN(starts.getTime()) || isNaN(ends.getTime())) {
      return { ok: false, reason: 'validation_error', message: 'Waktu sesi tidak valid' };
    }
    if (ends <= starts) {
      return { ok: false, reason: 'validation_error', message: 'endsAt harus setelah startsAt' };
    }

    const payload: Record<string, unknown> = {
      classId: input.classId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      updatedAt: new Date().toISOString(),
    };
    if (input.title) payload.title = input.title;
    if (input.lab) payload.lab = input.lab;

    await updateDoc(sessionDoc, payload);
    return { ok: true };
  } catch (e) {
    return toFailure(e);
  }
}

export async function deleteSession(sessionId: string): Promise<AsyncActionResult> {
  try {
    await deleteDoc(doc(db, 'sessions', sessionId));
    return { ok: true };
  } catch (e) {
    return toFailure(e);
  }
}

// Session control: open/close

export async function openSession(sessionId: string): Promise<AsyncActionResult> {
  try {
    const sessionDoc = doc(db, 'sessions', sessionId);
    const snap = await getDoc(sessionDoc);
    if (!snap.exists()) {
      return { ok: false, reason: 'session_not_found', message: 'Sesi tidak ditemukan' };
    }
    if (snap.data()?.status === 'closed') {
      return { ok: false, reason: 'invalid_status', message: 'Sesi sudah ditutup' };
    }
    await updateDoc(sessionDoc, {
      status: 'open',
      openedAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (e) {
    return toFailure(e);
  }
}

export async function closeSession(sessionId: string): Promise<AsyncActionResult> {
  try {
    const sessionDoc = doc(db, 'sessions', sessionId);
    const snap = await getDoc(sessionDoc);
    if (!snap.exists()) {
      return { ok: false, reason: 'session_not_found', message: 'Sesi tidak ditemukan' };
    }
    if (snap.data()?.status !== 'open') {
      return {
        ok: false,
        reason: 'invalid_status',
        message: 'Hanya sesi terbuka yang bisa ditutup',
      };
    }
    await updateDoc(sessionDoc, {
      status: 'closed',
      closedAt: new Date().toISOString(),
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
  onClasses: (classes: PracticalClass[]) => void,
  onError: (msg: string) => void,
) {
  const q = query(classesCol, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap: any) => {
    const classes = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as PracticalClass));
    onClasses(classes);
  }, (err: any) => {
    onError(err.message || 'Gagal memuat kelas');
  });
}

export function subscribeSessions(
  onSessions: (sessions: Session[]) => void,
  onError: (msg: string) => void,
) {
  const q = query(sessionsCol, orderBy('startsAt', 'asc'));
  return onSnapshot(q, (snap: any) => {
    const sessions = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Session));
    onSessions(sessions);
  }, (err: any) => {
    onError(err.message || 'Gagal memuat sesi');
  });
}

export function subscribeAttendanceForSession(
  sessionId: string,
  onData: (records: AttendanceRecord[]) => void,
  onError: (msg: string) => void,
) {
  const q = query(attendanceCol, where('sessionId', '==', sessionId), orderBy('checkedInAt', 'asc'));
  return onSnapshot(q, (snap: any) => {
    const records = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as AttendanceRecord));
    onData(records);
  }, (err: any) => {
    onError(err.message || 'Gagal memuat kehadiran');
  });
}

export function subscribeLeaveRequestsForStudent(
  uid: string,
  onData: (requests: any[]) => void,
  onError: (msg: string) => void,
) {
  const q = query(leaveRequestsCol, where('studentId', '==', uid), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap: any) => {
    const requests = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    onData(requests);
  }, (err: any) => {
    onError(err.message || 'Gagal memuat pengajuan izin');
  });
}

// ============================================================
// Initial state fetch (use on component mount)
// ============================================================

export async function initializeAssistantState(): Promise<{
  classes: PracticalClass[];
  sessions: Session[];
  studentsDirectory: UserProfile[];
}> {
  try {
    // Fetch classes and sessions in parallel
    const [classesSnap, sessionsSnap] = await Promise.all([
      getDocs(query(classesCol, orderBy('createdAt', 'desc'))),
      getDocs(query(sessionsCol, orderBy('startsAt', 'asc'))),
    ]);

    const classes = classesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as PracticalClass));
    const sessions = sessionsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Session));

    // Build students directory dari participantIds kelas + sesi
    const ids = new Set<string>();
    classes.forEach((c: any) => (c.participantIds || []).forEach((id: string) => ids.add(id)));
    sessions.forEach((s: any) => (s.participantIds || []).forEach((id: string) => ids.add(id)));

    // ponytail: lewati uid kosong (placeholder createdBy); tambahkan filtering per-role/auth nanti
    const uids = [...ids].filter((u: string) => u.trim() !== '');

    const userDocs = await Promise.all(uids.map((uid) => getDoc(doc(db, 'users', uid))));
    const studentsDirectory = userDocs
      .filter((d: any) => d.exists())
      .map((d: any) => ({ ...d.data() } as UserProfile))
      .filter((u: any) => u.role === 'student');

    return { classes, sessions, studentsDirectory };
  } catch (e: any) {
    throw e;
  }
}
