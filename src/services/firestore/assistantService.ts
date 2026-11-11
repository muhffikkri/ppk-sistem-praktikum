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
import { db } from './firebase';
import {
  PracticalClass,
  Session,
  UserProfile,
  AttendanceRecord,
  SessionStatus,
  LeaveStatus,
  AiClassificationResult,
  UserRole,
} from '../../domain/types';

// ============================================================
// KELAS CRUD
// ============================================================

export type ClassInput = {
  courseCode: string;
  courseName: string;
  groupName: string;
};

export interface AssistantSessionsContextValue {
  classes: PracticalClass[];
  sessions: Session[];
  studentsDirectory: UserProfile[];
  loading: boolean;
  error: string | null;
  getClassById: (classId: string) => PracticalClass | undefined;
  getSessionById: (sessionId: string) => Session | undefined;
  subscribeAttendanceForSession: (
    sessionId: string,
    onData: (records: AttendanceRecord[]) => void,
    onError: (msg: string) => void,
  ) => () => void;
  createClass: (input: ClassInput) => Promise<AsyncActionResult<string>>;
  updateClass: (classId: string, input: ClassInput) => Promise<AsyncActionResult>;
  deleteClass: (classId: string) => Promise<AsyncActionResult>;
  addParticipantByEmail: (classId: string, email: string) => Promise<AsyncActionResult>;
  removeParticipant: (classId: string, studentUid: string) => Promise<AsyncActionResult>;
  createSession: (input: {
    classId: string;
    title?: string;
    lab?: string;
    startsAt: string;
    endsAt: string;
  }) => Promise<AsyncActionResult<string>>;
  updateSession: (sessionId: string, input: {
    classId: string;
    title?: string;
    lab?: string;
    startsAt: string;
    endsAt: string;
  }) => Promise<AsyncActionResult>;
  deleteSession: (sessionId: string) => Promise<AsyncActionResult>;
  openSession: (sessionId: string) => Promise<AsyncActionResult>;
  closeSession: (sessionId: string) => Promise<AsyncActionResult>;
  retry: () => void;
}

// ============================================================
// FIRESTORE COLLECTION REFERENCES
// ============================================================

const classesCol = collection(db, 'classes');
const sessionsCol = collection(db, 'sessions');
const attendanceCol = collection(db, 'attendance');
const leaveRequestsCol = collection(db, 'leave_requests');
const usersCol = collection(db, 'users');

// ============================================================
// Helper: Async Action Result
// ============================================================

type AsyncActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; reason: string; message: string };

// ============================================================
// State Management (simple local state + Firestore sync)
// ============================================================

let localState: {
  classes: PracticalClass[];
  sessions: Session[];
  studentsDirectory: UserProfile[];
  loading: boolean;
  error: string | null;
} = {
  classes: [],
  sessions: [],
  studentsDirectory: [],
  loading: true,
  error: null,
};

// ============================================================
// CRUD: Classes
// ============================================================

export async function fetchClasses(): Promise<PracticalClass[]> {
  try {
    const qs = query(classesCol, orderBy('createdAt', 'desc'));
    const snap = await getDocs(qs);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PracticalClass));
  } catch (e: any) {
    console.error('fetchClasses error:', e);
    return [];
  }
}

export async function createClass(input: ClassInput): Promise<AsyncActionResult<string>> {
  try {
    const docRef = await addDoc(classesCol, {
      courseCode: input.courseCode,
      courseName: input.courseName,
      groupName: input.groupName,
      assistantIds: [],
      participantIds: [],
      createdBy: '', // akan diisi saat login asisten
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { ok: true, data: docRef.id };
  } catch (e: any) {
    return { ok: false, reason: 'validation_error', message: e.message };
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
  } catch (e: any) {
    return { ok: false, reason: 'validation_error', message: e.message };
  }
}

export async function deleteClass(classId: string): Promise<AsyncActionResult> {
  try {
    // Also delete associated sessions (batch delete)
    const sessionsSnap = await getDocs(query(sessionsCol, where('classId', '==', classId)));
    const batch = writeBatch(db);
    sessionsSnap.docs.forEach((doc) => batch.delete(doc.ref));
    batch.delete(doc(db, 'classes', classId));
    await batch.commit();
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: 'forbidden', message: e.message };
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
      sessionsSnap.docs.map((s) =>
        updateDoc(s.ref, {
          participantIds: updatedParticipantIds,
        }),
      ),
    );

    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: 'forbidden', message: e.message };
  }
}

export async function removeParticipant(
  classId: string,
  studentUid: string,
): Promise<AsyncActionResult> {
  try {
    const classDoc = doc(db, 'classes', classId);
    await updateDoc(classDoc, {
      participantIds: (classDoc.participantIds || []).filter((id: string) => id !== studentUid),
      updatedAt: new Date().toISOString(),
    });

    // Sync ke semua sesi milik classId ini
    const sessionsSnap = await getDocs(query(sessionsCol, where('classId', '==', classId)));
    await Promise.all(
      sessionsSnap.docs.map((s) =>
        updateDoc(s.ref, {
          participantIds: (s.participantIds || []).filter((id: string) => id !== studentUid),
        }),
      ),
    );

    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: 'forbidden', message: e.message };
  }
}

// ============================================================
// CRUD: Jadwal & Sesi
// ============================================================

export type SessionInput = {
  classId: string;
  title?: string;
  lab?: string;
  startsAt: string;
  endsAt: string;
};

export async function createSession(
  input: SessionInput,
): Promise<AsyncActionResult<string>> {
  try {
    // Validasi sisi server: endsAt > startsAt
    const starts = new Date(input.startsAt);
    const ends = new Date(input.endsAt);
    if (ends <= starts) {
      return { ok: false, reason: 'validation_error', message: 'endsAt harus setelah startsAt' };
    }

    const classDoc = doc(db, 'classes', input.classId);
    const classSnap = await getDoc(classDoc);
    if (!classSnap.exists()) {
      return { ok: false, reason: 'class_not_found', message: 'Kelas tujuan tidak ditemukan' };
    }

    const docRef = await addDoc(sessionsCol, {
      classId: input.classId,
      courseName: classSnap.data()?.courseName || '',
      groupName: classSnap.data()?.groupName || '',
      title: input.title,
      lab: input.lab,
      participantIds: classSnap.data()?.participantIds || [],
      assistantIds: classSnap.data()?.assistantIds || [],
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      status: 'scheduled',
      openedAt: null,
      closedAt: null,
      createdBy: '', // akan diisi saat login asisten
      createdAt: new Date().toISOString(),
    });

    // Update kelas dengan sessionId baru (opsional: bisa ditambahkan ke classes.sessions list)
    await updateDoc(classDoc, {
      updatedAt: new Date().toISOString(),
    });

    return { ok: true, data: docRef.id };
  } catch (e: any) {
    return { ok: false, reason: 'validation_error', message: e.message };
  }
}

export async function updateSession(
  sessionId: string,
  input: SessionInput,
): Promise<AsyncActionResult> {
  try {
    const sessionDoc = doc(db, 'sessions', sessionId);
    await updateDoc(sessionDoc, {
      title: input.title,
      lab: input.lab,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      updatedAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: 'validation_error', message: e.message };
  }
}

export async function deleteSession(sessionId: string): Promise<AsyncActionResult> {
  try {
    await deleteDoc(doc(db, 'sessions', sessionId));
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: 'forbidden', message: e.message };
  }
}

// Session control: open/close

export async function openSession(sessionId: string): Promise<AsyncActionResult> {
  try {
    const sessionDoc = doc(db, 'sessions', sessionId);
    await updateDoc(sessionDoc, {
      status: 'open',
      openedAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: 'invalid_status', message: e.message };
  }
}

export async function closeSession(sessionId: string): Promise<AsyncActionResult> {
  try {
    const sessionDoc = doc(db, 'sessions', sessionId);
    await updateDoc(sessionDoc, {
      status: 'closed',
      closedAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: 'invalid_status', message: e.message };
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
  return onSnapshot(q, (snap) => {
    const classes = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PracticalClass));
    onClasses(classes);
  }, (err) => {
    onError(err.message || 'Gagal memuat kelas');
  });
}

export function subscribeSessions(
  onSessions: (sessions: Session[]) => void,
  onError: (msg: string) => void,
) {
  const q = query(sessionsCol, orderBy('startsAt', 'asc'));
  return onSnapshot(q, (snap) => {
    const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Session));
    onSessions(sessions);
  }, (err) => {
    onError(err.message || 'Gagal memuat sesi');
  });
}

export function subscribeAttendanceForSession(
  sessionId: string,
  onData: (records: AttendanceRecord[]) => void,
  onError: (msg: string) => void,
) {
  const q = query(attendanceCol, where('sessionId', '==', sessionId), orderBy('checkedInAt', 'asc'));
  return onSnapshot(q, (snap) => {
    const records = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord));
    onData(records);
  }, (err) => {
    onError(err.message || 'Gagal memuat kehadiran');
  });
}

export function subscribeLeaveRequestsForStudent(
  uid: string,
  onData: (requests: any[]) => void,
  onError: (msg: string) => void,
) {
  const q = query(leaveRequestsCol, where('studentId', '==', uid), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    onData(requests);
  }, (err) => {
    onError(err.message || 'Gagal memuat pengajuan izin');
  });
}

// ============================================================
// Initial state fetch (use on component mount)
// ============================================================

export async function initializeAssistantState(): Promise<AssistantSessionsContextValue> {
  try {
    // Fetch classes and sessions in parallel
    const [classesSnap, sessionsSnap] = await Promise.all([
      getDocs(query(classesCol, orderBy('createdAt', 'desc'))),
      getDocs(query(sessionsCol, orderBy('startsAt', 'asc'))),
    ]);

    const classes = classesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as PracticalClass));
    const sessions = sessionsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Session));

    // Build students directory from classes participantIds + assistantIds
    const participantIds = new Set<string>();
    const assistantIds = new Set<string>();

    classes.forEach((c) => {
      (c.participantIds || []).forEach((id: string) => participantIds.add(id));
      (c.assistantIds || []).forEach((id: string) => assistantIds.add(id));
    });

    sessions.forEach((s) => {
      (s.participantIds || []).forEach((id: string) => participantIds.add(id));
      (s.assistantIds || []).forEach((id: string) => assistantIds.add(id));
    });

    // Fetch user profiles for all unique IDs
    const userPromises = Array.from(participantIds | assistantIds).map((uid) =>
      getDoc(doc(db, 'users', uid)),
    );
    const userDocs = await Promise.all(userPromises);
    const studentsDirectory = userDocs
      .filter((d) => d.exists())
      .map((d) => ({ id: d.id, ...d.data() } as UserProfile))
      .filter((u) => u.role === 'student');

    localState = {
      classes,
      sessions,
      studentsDirectory,
      loading: false,
      error: null,
    };

    return {
      classes,
      sessions,
      studentsDirectory,
      loading: false,
      error: null,
      getClassById: (classId: string) => classes.find((c) => c.id === classId),
      getSessionById: (sessionId: string) => sessions.find((s) => s.id === sessionId),
      subscribeAttendanceForSession,
      createClass: async (input: ClassInput) => await createClass(input),
      updateClass: async (classId: string, input: ClassInput) => await updateClass(classId, input),
      deleteClass: async (classId: string) => await deleteClass(classId),
      addParticipantByEmail: async (classId: string, email: string) => await addParticipantByEmail(classId, email),
      removeParticipant: async (classId: string, studentUid: string) => await removeParticipant(classId, studentUid),
      createSession: async (input: SessionInput) => await createSession(input),
      updateSession: async (sessionId: string, input: SessionInput) => await updateSession(sessionId, input),
      deleteSession: async (sessionId: string) => await deleteSession(sessionId),
      openSession: async (sessionId: string) => await openSession(sessionId),
      closeSession: async (sessionId: string) => await closeSession(sessionId),
      retry: () => {},
    };
  } catch (e: any) {
    localState = {
      classes: [],
      sessions: [],
      studentsDirectory: [],
      loading: true,
      error: e.message || 'Gagal inisialisasi state asisten',
    };
    return {
      classes: [],
      sessions: [],
      studentsDirectory: [],
      loading: true,
      error: localState.error || 'Gagal inisialisasi state',
      getClassById: () => undefined,
      getSessionById: () => undefined,
      subscribeAttendanceForSession: (_s, _o, _e) => () => {},
      createClass: async () => ({ ok: false, reason: 'unknown_error', message: e.message }),
      updateClass: async () => ({ ok: false, reason: 'unknown_error', message: e.message }),
      deleteClass: async () => ({ ok: false, reason: 'unknown_error', message: e.message }),
      addParticipantByEmail: async () => ({ ok: false, reason: 'unknown_error', message: e.message }),
      removeParticipant: async () => ({ ok: false, reason: 'unknown_error', message: e.message }),
      createSession: async () => ({ ok: false, reason: 'unknown_error', message: e.message }),
      updateSession: async () => ({ ok: false, reason: 'unknown_error', message: e.message }),
      deleteSession: async () => ({ ok: false, reason: 'unknown_error', message: e.message }),
      openSession: async () => ({ ok: false, reason: 'unknown_error', message: e.message }),
      closeSession: async () => ({ ok: false, reason: 'unknown_error', message: e.message }),
      retry: () => {},
    };
  }
}