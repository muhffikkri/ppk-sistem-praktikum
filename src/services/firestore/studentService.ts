import { 
  collection, 
  doc, 
  getDoc, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  Timestamp,
  QuerySnapshot 
} from 'firebase/firestore';
import { db } from '../../config/firebase'; 

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

export function subscribeStudentSessions(
  studentId: string, 
  onUpdate: (sessions: Session[]) => void,
  onError: (error: Error) => void
) {
  const q = query(
    collection(db, 'sessions'),
    where('participantIds', 'array-contains', studentId)
  );

  return onSnapshot(q, 
    (snapshot: QuerySnapshot) => {
      const sessions: Session[] = snapshot.docs.map((docItem: any) => ({
        id: docItem.id,
        ...docItem.data()
      })) as Session[];
      onUpdate(sessions);
    }, 
    (error: any) => {
      onError(error);
    }
  );
}

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
    (snapshot: QuerySnapshot) => {
      const records: AttendanceRecord[] = snapshot.docs.map((docItem: any) => ({
        id: docItem.id,
        ...docItem.data()
      })) as AttendanceRecord[];
      onUpdate(records);
    },
    (error: any) => {
      onError(error);
    }
  );
}

export async function checkInStudent(sessionId: string, studentId: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return { ok: false, reason: 'session_not_found' };
    }

    const sessionData = sessionSnap.data() as Session;

    if (sessionData.status !== 'open') {
      return { ok: false, reason: 'invalid_status' };
    }

    const attendanceId = `${sessionId}_${studentId}`;
    const attendanceRef = doc(db, 'attendance', attendanceId);
    const attendanceSnap = await getDoc(attendanceRef);

    if (attendanceSnap.exists()) {
      return { ok: false, reason: 'already_checked_in' };
    }

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