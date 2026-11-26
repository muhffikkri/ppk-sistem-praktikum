/**
 * Lab Activity Service — Sprint 3 (SRS-3.3)
 * Menghubungkan data lokasi laboratorium dengan sesi/jadwal aktif & mendatang dari Firestore secara real-time.
 */
import {
  collection,
  onSnapshot,
  query,
  where,
  type Firestore,
} from 'firebase/firestore';
import type {
  Lab,
  LabActivity,
  LabLocation,
  LabSessionInfo,
} from '../../domain/geoTypes';
import type { Session, UserRole } from '../../domain/types';

/**
 * Memeriksa apakah suatu sesi ditugaskan pada laboratorium tertentu.
 * Sesi baru memakai `labId`; sesi lama (tanpa `labId`) dicocokkan lewat nama persis.
 */
export function isSessionForLab(session: Session, lab: LabLocation): boolean {
  if (session.labId) return session.labId === lab.id;
  if (!session.lab) return false;
  return session.lab.trim().toLowerCase() === lab.name.trim().toLowerCase();
}

/**
 * Mengubah objek Session Firestore menjadi LabSessionInfo.
 */
function toLabSessionInfo(session: Session): LabSessionInfo {
  return {
    id: session.id,
    classId: session.classId,
    courseName: session.courseName,
    groupName: session.groupName,
    title: session.title,
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    status: session.status,
    lab: session.lab,
    labId: session.labId,
  };
}

/**
 * Menghitung aktivitas laboratorium (sesi aktif & sesi berikutnya)
 * berdasarkan daftar sesi dari Firestore.
 */
export function computeLabActivities(
  labs: LabLocation[],
  sessions: Session[],
  now: Date = new Date(),
): LabActivity[] {
  const nowTime = now.getTime();

  return labs.map((lab) => {
    // Ambil semua sesi yang dialokasikan untuk lab ini
    const labSessions = sessions.filter((s) => isSessionForLab(s, lab));

    // 1. Cari sesi yang sedang berlangsung
    // Prioritas: status === 'open', atau startsAt <= now <= endsAt & status !== 'closed'
    let currentSession: LabSessionInfo | null = null;
    const openSession = labSessions.find((s) => s.status === 'open');

    if (openSession) {
      currentSession = toLabSessionInfo(openSession);
    } else {
      const activeByTime = labSessions.find((s) => {
        if (s.status === 'closed') return false;
        const start = new Date(s.startsAt).getTime();
        const end = new Date(s.endsAt).getTime();
        return nowTime >= start && nowTime <= end;
      });
      if (activeByTime) {
        currentSession = toLabSessionInfo(activeByTime);
      }
    }

    // 2. Cari sesi berikutnya yang akan datang
    // Sesi dengan startsAt > now (atau status === 'scheduled' dan belum mulai)
    const upcomingSessions = labSessions
      .filter((s) => {
        if (currentSession && s.id === currentSession.id) return false;
        if (s.status === 'closed') return false;
        const start = new Date(s.startsAt).getTime();
        return start > nowTime || s.status === 'scheduled';
      })
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );

    const nextSession =
      upcomingSessions.length > 0
        ? toLabSessionInfo(upcomingSessions[0])
        : null;

    return {
      lab,
      currentSession,
      nextSession,
      isOccupied: currentSession !== null,
    };
  });
}

/** Mengubah dokumen lab (`labService`) menjadi bentuk yang dipakai peta. */
export function toLabLocation(lab: Lab): LabLocation {
  return {
    id: lab.id,
    name: lab.name,
    building: lab.building,
    description: lab.description ?? undefined,
    coordinates: lab.location,
    radiusMeters: lab.radiusMeters,
    isActive: lab.isActive,
    createdAt: lab.createdAt,
    updatedAt: lab.updatedAt,
  };
}

export type LabActivityScope = {
  uid: string;
  role: UserRole;
};

/**
 * Berlangganan (real-time) ke data lab dan sesi milik pengguna.
 * Query sesi difilter sesuai role agar lolos Firestore rules:
 * praktikan lewat `participantIds`, asisten lewat `assistantIds`.
 * Mengembalikan fungsi unsubscribe.
 */
export function subscribeLabActivities(
  scope: LabActivityScope,
  callback: (activities: LabActivity[]) => void,
  onError?: (message: string) => void,
): () => void {
  // Lazy require: modul ini juga dipakai tes Node tanpa Firebase.
  const { db } = require('../firebase') as { db: Firestore };
  const { subscribeLabs } =
    require('./labService') as typeof import('./labService');

  let currentLabs: LabLocation[] | null = null;
  let currentSessions: Session[] | null = null;

  const update = () => {
    if (!currentLabs || !currentSessions) return;
    callback(computeLabActivities(currentLabs, currentSessions));
  };

  const unsubLabs = subscribeLabs(
    (labs) => {
      currentLabs = labs.filter((lab) => lab.isActive).map(toLabLocation);
      update();
    },
    (message) => onError?.(message),
  );

  const membershipField =
    scope.role === 'assistant' || scope.role === 'lab_assistant'
      ? 'assistantIds'
      : 'participantIds';
  const unsubSessions = onSnapshot(
    query(
      collection(db, 'sessions'),
      where(membershipField, 'array-contains', scope.uid),
    ),
    (snap) => {
      currentSessions = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Session,
      );
      update();
    },
    (err) => onError?.(err.message),
  );

  return () => {
    unsubLabs();
    unsubSessions();
  };
}
