import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    query,
    setDoc,
    Timestamp,
    where
} from 'firebase/firestore';
// Sesuaikan path import firestore db Anda (misal dari '../../config/firebase' atau sejenisnya)
// import { db } from '../../config/firebase'; 

export interface Session {
  id: string;
  courseName: string;
  groupName: string;
  status: 'scheduled' | 'open' | 'closed';
  participantIds: string[];
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  checkedInAt: Timestamp | string;
}

// 1. Mendapatkan daftar sesi secara real-time yang hanya diikuti oleh studentId tertentu
export function subscribeStudentSessions(
  studentId: string, 
  onUpdate: (sessions: Session[]) => void,
  onError: (error: Error) => void
) {
  // Query ke koleksi classes/sessions di Firestore berdasarkan participantIds
  const q = query(
    collection(db, 'sessions'),
    where('participantIds', 'array-contains', studentId)
  );

  return onSnapshot(q, 
    (snapshot) => {
      const sessions: Session[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Session[];
      onUpdate(sessions);
    }, 
    (error) => {
      onError(error);
    }
  );
}

// 2. Mendapatkan riwayat kehadiran praktikan secara real-time
export function subscribeStudentAttendance(
  studentId: string,
  onUpdate: (records: AttendanceRecord[]) => void,
  onError: (error: Error) => void
) {
  const q = query(
    collection(db, 'attendance'),
    where('studentId', '==', studentId)
  );

  return onSnapshot(q,
    (snapshot) => {
      const records: AttendanceRecord[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceRecord[];
      onUpdate(records);
    },
    (error) => {
      onError(error);
    }
  );
}

// 3. Aksi Check-In Presensi Terintegrasi
export async function checkInStudent(sessionId: string, studentId: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return { ok: false, reason: 'session_not_found' };
    }

    const sessionData = sessionSnap.data() as Session;

    // Validasi status sesi harus 'open'
    if (sessionData.status !== 'open') {
      return { ok: false, reason: 'invalid_status' };
    }

    // Format ID dokumen presensi: {sessionId}_{studentId} untuk mencegah duplikasi
    const attendanceId = `${sessionId}_${studentId}`;
    const attendanceRef = doc(db, 'attendance', attendanceId);
    const attendanceSnap = await getDoc(attendanceRef);

    if (attendanceSnap.exists()) {
      return { ok: false, reason: 'already_checked_in' };
    }

    // Simpan data presensi ke Firestore
    await setDoc(attendanceRef, {
      id: attendanceId,
      sessionId,
      studentId,
      checkedInAt: Timestamp.now(),
    });

    return { ok: true };
  } catch (error: any) {
    return { ok: false, reason: error.message || 'network_error' };
  }
}