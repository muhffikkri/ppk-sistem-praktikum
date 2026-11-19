/**
 * Lab Activity Service — Sprint 3 (SRS-3.3)
 * Menghubungkan data lokasi laboratorium dengan sesi/jadwal aktif & mendatang dari Firestore secara real-time.
 */
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
  type Firestore,
} from 'firebase/firestore';
import {
  DEFAULT_CAMPUS_LABS,
  type LabActivity,
  type LabLocation,
  type LabSessionInfo,
} from '../../domain/geoTypes';
import type { Session } from '../../domain/types';

function getFirestoreDb(): Firestore {
  const { db } = require('../firebase');
  return db;
}

/**
 * Memeriksa apakah suatu sesi ditugaskan pada laboratorium tertentu.
 */
function isSessionForLab(session: Session, lab: LabLocation): boolean {
  if (!session.lab) return false;
  const sLab = session.lab.trim().toLowerCase();
  const lName = lab.name.trim().toLowerCase();
  const lCode = lab.code ? lab.code.trim().toLowerCase() : '';

  if (sLab === lName) return true;
  if (lCode && sLab.includes(lCode)) return true;
  if (sLab.includes(lName) || lName.includes(sLab)) return true;

  // Cek kecocokan kata kunci lab (misal: "RPL", "Database", "Jaringan", "AI", "Sensor")
  const keywords = ['rpl', 'database', 'jaringan', 'ai', 'sensor', 'iot'];
  for (const kw of keywords) {
    if (sLab.includes(kw) && lName.includes(kw)) {
      return true;
    }
  }

  return false;
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

/**
 * Berlangganan (real-time listener) ke data laboratorium dan sesi di Firestore.
 * Mengembalikan fungsi unsubscribe.
 */
export function subscribeLabActivities(
  callback: (activities: LabActivity[]) => void,
  onError?: (error: Error) => void,
): () => void {
  let currentLabs: LabLocation[] = [...DEFAULT_CAMPUS_LABS];
  let currentSessions: Session[] = [];

  const update = () => {
    try {
      const activities = computeLabActivities(currentLabs, currentSessions);
      callback(activities);
    } catch (err) {
      if (onError && err instanceof Error) onError(err);
    }
  };

  const firestore = getFirestoreDb();
  const labsCol = collection(firestore, 'labs');
  const sessionsCol = collection(firestore, 'sessions');

  // 1. Listener untuk Labs
  const unsubLabs = onSnapshot(
    labsCol,
    (snap) => {
      if (!snap.empty) {
        const fetchedLabs: LabLocation[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name ?? 'Laboratorium',
            code: data.code,
            building: data.building ?? 'Gedung Lab',
            floor: data.floor,
            description: data.description,
            coordinates: {
              latitude: Number(data.coordinates?.latitude ?? data.latitude ?? DEFAULT_CAMPUS_LABS[0].coordinates.latitude),
              longitude: Number(data.coordinates?.longitude ?? data.longitude ?? DEFAULT_CAMPUS_LABS[0].coordinates.longitude),
            },
            radiusMeters: Number(data.radiusMeters ?? data.radius ?? 50),
            capacity: data.capacity,
            isActive: data.isActive !== false,
          };
        });
        currentLabs = fetchedLabs;
      } else {
        currentLabs = [...DEFAULT_CAMPUS_LABS];
      }
      update();
    },
    (err) => {
      // Jika permissions belum di-deploy atau offline, gunakan default labs
      currentLabs = [...DEFAULT_CAMPUS_LABS];
      update();
      if (onError) onError(err);
    },
  );

  // 2. Listener untuk Sessions
  const unsubSessions = onSnapshot(
    sessionsCol,
    (snap) => {
      currentSessions = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          classId: data.classId,
          courseName: data.courseName ?? '',
          groupName: data.groupName ?? '',
          title: data.title,
          lab: data.lab,
          participantIds: data.participantIds ?? [],
          assistantIds: data.assistantIds ?? [],
          startsAt: data.startsAt ?? new Date().toISOString(),
          endsAt: data.endsAt ?? new Date().toISOString(),
          status: data.status ?? 'scheduled',
          openedAt: data.openedAt ?? null,
          closedAt: data.closedAt ?? null,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
        };
      });
      update();
    },
    (err) => {
      if (onError) onError(err);
    },
  );

  // Initial trigger
  update();

  return () => {
    unsubLabs();
    unsubSessions();
  };
}

/**
 * Seed data awal laboratorium ke Firestore jika koleksi labs masih kosong.
 */
export async function seedDefaultLabsIfEmpty(): Promise<void> {
  try {
    const firestore = getFirestoreDb();
    const labsCol = collection(firestore, 'labs');
    const snap = await getDocs(labsCol);
    if (snap.empty) {
      for (const lab of DEFAULT_CAMPUS_LABS) {
        await setDoc(doc(firestore, 'labs', lab.id), lab);
      }
    }
  } catch {
    // Fail silently jika izin Firestore belum dibuka untuk create lab
  }
}
