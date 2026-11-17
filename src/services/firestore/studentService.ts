import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { checkInRule } from '../../domain/attendanceRules';
import {
  AsyncActionResult,
  AttendanceRecord,
  PracticalClass,
  Session,
  UserProfile,
} from '../../domain/types';
import { db } from '../firebase';
import { normalizeAttendanceRecord } from './normalize';
export type {
  AsyncActionResult, AttendanceRecord, PracticalClass,
  Session,
  UserProfile
};

const classesCol = collection(db, 'classes');
const sessionsCol = collection(db, 'sessions');
const attendanceCol = collection(db, 'attendance');

export function subscribeStudentClasses(
  uid: string,
  onData: (classes: PracticalClass[]) => void,
  onError: (msg: string) => void,
) {
  const q = query(classesCol, where('participantIds', 'array-contains', uid));

  return onSnapshot(
    q,
    (snap) => {
      const classes = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as PracticalClass,
      );
      onData(classes);
    },
    (err) => {
      onError(err.message || 'Gagal memuat kelas.');
    },
  );
}

export function subscribeStudentSessions(
  uid: string,
  onData: (sessions: Session[]) => void,
  onError: (msg: string) => void,
) {
  const q = query(
    sessionsCol,
    where('participantIds', 'array-contains', uid),
    orderBy('startsAt', 'asc'),
  );

  return onSnapshot(
    q,
    (snap) => {
      const sessions = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Session,
      );
      onData(sessions);
    },
    (err) => {
      onError(err.message || 'Gagal memuat jadwal.');
    },
  );
}

export function subscribeStudentAttendance(
  uid: string,
  onData: (records: AttendanceRecord[]) => void,
  onError: (msg: string) => void,
) {
  const q = query(
    attendanceCol,
    where('studentId', '==', uid),
    orderBy('checkedInAt', 'desc'),
  );

  return onSnapshot(
    q,
    (snap) => {
      const records = snap.docs.map((d) =>
        normalizeAttendanceRecord(d.id, d.data()),
      );
      onData(records);
    },
    (err) => {
      onError(err.message || 'Gagal memuat riwayat presensi.');
    },
  );
}

function errorCode(e: unknown): string {
  return typeof e === 'object' && e !== null && 'code' in e
    ? String((e as { code?: unknown }).code)
    : '';
}

export async function checkInStudent(input: {
  session: Session;
  student: UserProfile;
  existing: AttendanceRecord[];
}): Promise<AsyncActionResult> {
  const { session, student, existing } = input;

  const validation = checkInRule(
    session,
    { id: student.uid, displayName: student.displayName },
    existing,
  );

  if (!validation.ok) {
    const message =
      validation.reason === 'invalid_status'
        ? 'Sesi belum dibuka atau sudah ditutup.'
        : validation.reason === 'already_checked_in'
          ? 'Kamu sudah presensi di sesi ini.'
          : 'Sesi tidak ditemukan.';
    return { ok: false, reason: validation.reason, message };
  }

  // ID deterministik = anti-duplikasi di sisi server: setDoc ke dokumen yang
  // sudah ada diperlakukan sebagai update, dan rules melarang update.
  const attendanceId = `${session.id}_${student.uid}`;
  const attendanceRef = doc(db, 'attendance', attendanceId);

  try {
    await setDoc(attendanceRef, {
      id: attendanceId,
      sessionId: session.id,
      classId: session.classId ?? '',
      studentId: student.uid,
      studentName: student.displayName,
      checkedInAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (e) {
    if (errorCode(e) === 'permission-denied') {
      try {
        const snap = await getDoc(attendanceRef);
        if (snap.exists()) {
          return {
            ok: false,
            reason: 'already_checked_in',
            message: 'Kamu sudah presensi di sesi ini.',
          };
        }
      } catch {
        // Abaikan kegagalan pengecekan, lanjut sebagai forbidden.
      }

      return {
        ok: false,
        reason: 'forbidden',
        message:
          'Presensi ditolak. Pastikan sesi terbuka dan kamu terdaftar di kelas ini.',
      };
    }

    if (errorCode(e) === 'unavailable') {
      return {
        ok: false,
        reason: 'network_error',
        message: 'Koneksi bermasalah. Coba lagi.',
      };
    }

    return {
      ok: false,
      reason: 'unknown_error',
      message: 'Presensi gagal. Coba lagi.',
    };
  }
}
