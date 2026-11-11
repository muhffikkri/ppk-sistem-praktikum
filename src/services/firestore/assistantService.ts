import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import type {
  AsyncActionResult,
  AttendanceRecord,
  ClassInput,
  PracticalClass,
  Session,
  SessionInput,
  UserProfile,
} from '../../domain/types';
import { auth, db } from '../firebase';

const classesCol = collection(db, 'classes');
const sessionsCol = collection(db, 'sessions');
const attendanceCol = collection(db, 'attendance');
const usersCol = collection(db, 'users');

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export async function fetchClasses(): Promise<PracticalClass[]> {
  try {
    const qs = query(classesCol, orderBy('createdAt', 'desc'));
    const snap = await getDocs(qs);
    return snap.docs.map((d) => ({
      ...(d.data() as Omit<PracticalClass, 'id'>),
      id: d.id,
    }));
  } catch {
    return [];
  }
}

export async function createClass(
  input: ClassInput,
): Promise<AsyncActionResult<string>> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return {
      ok: false,
      reason: 'unauthenticated',
      message: 'Silakan masuk terlebih dahulu.',
    };
  }

  const courseCode = input.courseCode.trim();
  const courseName = input.courseName.trim();
  const groupName = input.groupName.trim();

  if (!courseCode || !courseName || !groupName) {
    return {
      ok: false,
      reason: 'validation_error',
      message:
        'Kode mata kuliah, nama mata kuliah, dan nama kelas wajib diisi.',
    };
  }

  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(classesCol, {
      courseCode,
      courseName,
      groupName,
      assistantIds: [uid],
      participantIds: [],
      createdBy: uid,
      createdAt: now,
      updatedAt: now,
    });
    return { ok: true, data: docRef.id };
  } catch (err) {
    return {
      ok: false,
      reason: 'unknown_error',
      message: getErrorMessage(err, 'Gagal membuat kelas.'),
    };
  }
}

export async function updateClass(
  classId: string,
  input: ClassInput,
): Promise<AsyncActionResult> {
  const courseCode = input.courseCode.trim();
  const courseName = input.courseName.trim();
  const groupName = input.groupName.trim();

  if (!courseCode || !courseName || !groupName) {
    return {
      ok: false,
      reason: 'validation_error',
      message:
        'Kode mata kuliah, nama mata kuliah, dan nama kelas wajib diisi.',
    };
  }

  try {
    const classDoc = doc(db, 'classes', classId);
    await updateDoc(classDoc, {
      courseCode,
      courseName,
      groupName,
      updatedAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: 'unknown_error',
      message: getErrorMessage(err, 'Gagal memperbarui kelas.'),
    };
  }
}

export async function deleteClass(classId: string): Promise<AsyncActionResult> {
  try {
    const sessionsSnap = await getDocs(
      query(sessionsCol, where('classId', '==', classId)),
    );
    const batch = writeBatch(db);
    sessionsSnap.docs.forEach((s) => batch.delete(s.ref));
    batch.delete(doc(db, 'classes', classId));
    await batch.commit();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: 'forbidden',
      message: getErrorMessage(err, 'Gagal menghapus kelas.'),
    };
  }
}

export async function addParticipantByEmail(
  classId: string,
  email: string,
): Promise<AsyncActionResult> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return {
      ok: false,
      reason: 'validation_error',
      message: 'Email praktikan wajib diisi.',
    };
  }

  try {
    const classDoc = doc(db, 'classes', classId);
    const classSnap = await getDoc(classDoc);
    if (!classSnap.exists()) {
      return {
        ok: false,
        reason: 'class_not_found',
        message: 'Kelas tidak ditemukan.',
      };
    }

    const classData = classSnap.data() as Omit<PracticalClass, 'id'>;

    const usersSnap = await getDocs(
      query(usersCol, where('email', '==', normalizedEmail)),
    );
    if (usersSnap.empty) {
      return {
        ok: false,
        reason: 'user_not_found',
        message: 'Pengguna dengan email tersebut tidak terdaftar.',
      };
    }

    const userSnap = usersSnap.docs[0];
    const userData = userSnap.data() as Partial<UserProfile>;
    const studentUid = userData.uid ?? userSnap.id;

    if (userData.role !== 'student') {
      return {
        ok: false,
        reason: 'validation_error',
        message: 'Email tersebut bukan akun praktikan.',
      };
    }

    const updatedParticipantIds = Array.from(
      new Set([...(classData.participantIds ?? []), studentUid]),
    );

    const sessionsSnap = await getDocs(
      query(sessionsCol, where('classId', '==', classId)),
    );
    const batch = writeBatch(db);
    batch.update(classDoc, {
      participantIds: updatedParticipantIds,
      updatedAt: new Date().toISOString(),
    });
    sessionsSnap.docs.forEach((s) => {
      batch.update(s.ref, { participantIds: updatedParticipantIds });
    });
    await batch.commit();

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: 'forbidden',
      message: getErrorMessage(err, 'Gagal menambahkan peserta.'),
    };
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
      return {
        ok: false,
        reason: 'class_not_found',
        message: 'Kelas tidak ditemukan.',
      };
    }

    const currentIds =
      (classSnap.data() as Partial<PracticalClass>).participantIds ?? [];
    const updatedParticipantIds = currentIds.filter((id) => id !== studentUid);

    const sessionsSnap = await getDocs(
      query(sessionsCol, where('classId', '==', classId)),
    );
    const batch = writeBatch(db);
    batch.update(classDoc, {
      participantIds: updatedParticipantIds,
      updatedAt: new Date().toISOString(),
    });
    sessionsSnap.docs.forEach((s) => {
      const sessionIds =
        (s.data() as Partial<Session>).participantIds ?? updatedParticipantIds;
      batch.update(s.ref, {
        participantIds: sessionIds.filter((id) => id !== studentUid),
      });
    });
    await batch.commit();

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: 'forbidden',
      message: getErrorMessage(err, 'Gagal menghapus peserta.'),
    };
  }
}

export async function createSession(
  input: SessionInput,
): Promise<AsyncActionResult<string>> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return {
      ok: false,
      reason: 'unauthenticated',
      message: 'Silakan masuk terlebih dahulu.',
    };
  }

  const starts = new Date(input.startsAt);
  const ends = new Date(input.endsAt);
  if (
    Number.isNaN(starts.getTime()) ||
    Number.isNaN(ends.getTime()) ||
    ends <= starts
  ) {
    return {
      ok: false,
      reason: 'validation_error',
      message: 'Waktu selesai harus setelah waktu mulai.',
    };
  }

  try {
    const classDoc = doc(db, 'classes', input.classId);
    const classSnap = await getDoc(classDoc);
    if (!classSnap.exists()) {
      return {
        ok: false,
        reason: 'class_not_found',
        message: 'Kelas tujuan tidak ditemukan.',
      };
    }

    const classData = classSnap.data() as Partial<PracticalClass>;
    const now = new Date().toISOString();
    const docRef = await addDoc(sessionsCol, {
      classId: input.classId,
      courseName: classData.courseName ?? '',
      groupName: classData.groupName ?? '',
      title: input.title?.trim() ?? '',
      lab: input.lab?.trim() ?? '',
      participantIds: classData.participantIds ?? [],
      assistantIds: classData.assistantIds?.length
        ? classData.assistantIds
        : [uid],
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      status: 'scheduled',
      openedAt: null,
      closedAt: null,
      createdBy: uid,
      createdAt: now,
    });

    await updateDoc(classDoc, { updatedAt: now });
    return { ok: true, data: docRef.id };
  } catch (err) {
    return {
      ok: false,
      reason: 'validation_error',
      message: getErrorMessage(err, 'Gagal membuat sesi.'),
    };
  }
}

export async function updateSession(
  sessionId: string,
  input: SessionInput,
): Promise<AsyncActionResult> {
  const starts = new Date(input.startsAt);
  const ends = new Date(input.endsAt);
  if (
    Number.isNaN(starts.getTime()) ||
    Number.isNaN(ends.getTime()) ||
    ends <= starts
  ) {
    return {
      ok: false,
      reason: 'validation_error',
      message: 'Waktu selesai harus setelah waktu mulai.',
    };
  }

  try {
    const sessionDoc = doc(db, 'sessions', sessionId);
    await updateDoc(sessionDoc, {
      title: input.title?.trim() ?? '',
      lab: input.lab?.trim() ?? '',
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      updatedAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: 'validation_error',
      message: getErrorMessage(err, 'Gagal memperbarui sesi.'),
    };
  }
}

export async function deleteSession(
  sessionId: string,
): Promise<AsyncActionResult> {
  try {
    await deleteDoc(doc(db, 'sessions', sessionId));
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: 'forbidden',
      message: getErrorMessage(err, 'Gagal menghapus sesi.'),
    };
  }
}

export async function openSession(
  sessionId: string,
): Promise<AsyncActionResult> {
  try {
    const sessionDoc = doc(db, 'sessions', sessionId);
    await updateDoc(sessionDoc, {
      status: 'open',
      openedAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: 'invalid_status',
      message: getErrorMessage(err, 'Gagal membuka sesi.'),
    };
  }
}

export async function closeSession(
  sessionId: string,
): Promise<AsyncActionResult> {
  try {
    const sessionDoc = doc(db, 'sessions', sessionId);
    await updateDoc(sessionDoc, {
      status: 'closed',
      closedAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: 'invalid_status',
      message: getErrorMessage(err, 'Gagal menutup sesi.'),
    };
  }
}

export function subscribeClasses(
  onClasses: (classes: PracticalClass[]) => void,
  onError: (msg: string) => void,
) {
  const q = query(classesCol, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const classes = snap.docs.map((d) => ({
        ...(d.data() as Omit<PracticalClass, 'id'>),
        id: d.id,
      }));
      onClasses(classes);
    },
    (err) => {
      onError(err.message || 'Gagal memuat kelas');
    },
  );
}

export function subscribeSessions(
  onSessions: (sessions: Session[]) => void,
  onError: (msg: string) => void,
) {
  const q = query(sessionsCol, orderBy('startsAt', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const sessions = snap.docs.map((d) => ({
        ...(d.data() as Omit<Session, 'id'>),
        id: d.id,
      }));
      onSessions(sessions);
    },
    (err) => {
      onError(err.message || 'Gagal memuat sesi');
    },
  );
}

export function subscribeAttendanceForSession(
  sessionId: string,
  onData: (records: AttendanceRecord[]) => void,
  onError: (msg: string) => void,
) {
  const q = query(
    attendanceCol,
    where('sessionId', '==', sessionId),
    orderBy('checkedInAt', 'asc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const records = snap.docs.map((d) => ({
        ...(d.data() as Omit<AttendanceRecord, 'id'>),
        id: d.id,
      }));
      onData(records);
    },
    (err) => {
      onError(err.message || 'Gagal memuat kehadiran');
    },
  );
}

export async function initializeAssistantState(): Promise<{
  classes: PracticalClass[];
  sessions: Session[];
  studentsDirectory: UserProfile[];
}> {
  const [classesSnap, sessionsSnap, studentsSnap] = await Promise.all([
    getDocs(query(classesCol, orderBy('createdAt', 'desc'))),
    getDocs(query(sessionsCol, orderBy('startsAt', 'asc'))),
    getDocs(query(usersCol, where('role', '==', 'student'))),
  ]);

  const classes = classesSnap.docs.map((d) => ({
    ...(d.data() as Omit<PracticalClass, 'id'>),
    id: d.id,
  }));
  const sessions = sessionsSnap.docs.map((d) => ({
    ...(d.data() as Omit<Session, 'id'>),
    id: d.id,
  }));
  const studentsDirectory = studentsSnap.docs.map((d) => {
    const data = d.data() as Partial<UserProfile>;
    return {
      uid: data.uid ?? d.id,
      displayName: data.displayName ?? 'Praktikan',
      email: data.email ?? '',
      role: 'student' as const,
      createdAt: data.createdAt ?? new Date().toISOString(),
    };
  });

  return { classes, sessions, studentsDirectory };
}
