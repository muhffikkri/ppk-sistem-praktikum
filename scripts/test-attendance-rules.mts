/**
 * Tes Firestore rules presensi (geofence) & inbox notifikasi di Firebase Emulator.
 *
 * Usage:
 *   npm run test:rules
 *
 * Menjalankan Firestore + Auth emulator dengan firestore.rules repo, lalu
 * mencoba presensi praktikan dari berbagai posisi dan memastikan asisten
 * melihat hasilnya lewat query yang sama seperti aplikasi.
 */
import { initializeApp as initAdmin } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminDb } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
  setLogLevel,
  updateDoc,
  where,
} from 'firebase/firestore';

import { evaluateGeofence } from '../src/domain/geofenceRules';
import type { DeviceFix, Lab } from '../src/domain/geoTypes';

if (
  !process.env.FIRESTORE_EMULATOR_HOST ||
  !process.env.FIREBASE_AUTH_EMULATOR_HOST
) {
  console.error(
    '❌ Jalankan lewat `npm run test:rules` (butuh Firestore & Auth emulator).',
  );
  process.exit(1);
}

setLogLevel('silent');
const projectId = 'demo-ppk';
const PASSWORD = 'rules-test-only';

initAdmin({ projectId });
const adminDb = getAdminDb();
const adminAuth = getAdminAuth();

const lab: Lab = {
  id: 'lab-rpl',
  name: 'Lab RPL',
  building: 'Gedung B',
  description: null,
  location: { latitude: -7.05068, longitude: 110.43828 },
  radiusMeters: 50,
  isActive: true,
  createdBy: 'asisten',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

await adminAuth.createUser({
  uid: 'asisten',
  email: 'asisten@rules.test',
  password: PASSWORD,
});
await adminAuth.createUser({
  uid: 'budi',
  email: 'budi@rules.test',
  password: PASSWORD,
});
await adminAuth.createUser({
  uid: 'invited',
  email: 'invited@rules.test',
  password: PASSWORD,
});
await adminAuth.createUser({
  uid: 'stranger',
  email: 'stranger@rules.test',
  password: PASSWORD,
});
await adminDb.doc('users/asisten').set({
  uid: 'asisten',
  role: 'assistant',
  displayName: 'Asisten',
  email: 'asisten@rules.test',
  createdAt: lab.createdAt,
});
await adminDb.doc('users/budi').set({
  uid: 'budi',
  role: 'student',
  displayName: 'Budi',
  email: 'budi@rules.test',
  createdAt: lab.createdAt,
});
await adminDb.doc('assistant_invites/invited@rules.test').set({
  createdAt: lab.createdAt,
});
const { id: labId, ...labDoc } = lab;
await adminDb.doc(`labs/${labId}`).set(labDoc);

const minuteMs = 60_000;
const nowMs = Date.now();
const sessionDoc = (startMs: number, endMs: number, status: string) => ({
  classId: 'c1',
  courseName: 'Praktikum',
  groupName: 'A',
  lab: lab.name,
  labId,
  participantIds: ['budi'],
  assistantIds: ['asisten'],
  startsAt: new Date(startMs).toISOString(),
  endsAt: new Date(endMs).toISOString(),
  startsAtMs: startMs,
  endsAtMs: endMs,
  status,
  openedAt: status === 'scheduled' ? null : new Date(startMs).toISOString(),
  closedAt:
    status === 'closed' ? new Date(startMs + minuteMs).toISOString() : null,
  createdBy: 'asisten',
});
await adminDb
  .doc('sessions/s1')
  .set(sessionDoc(nowMs - 10 * minuteMs, nowMs + 50 * minuteMs, 'open'));
await adminDb
  .doc('sessions/s2-early')
  .set(sessionDoc(nowMs + 60 * minuteMs, nowMs + 120 * minuteMs, 'open'));
await adminDb
  .doc('sessions/s3-late')
  .set(sessionDoc(nowMs - 180 * minuteMs, nowMs - 120 * minuteMs, 'open'));
await adminDb
  .doc('sessions/s4-future')
  .set(sessionDoc(nowMs + 60 * minuteMs, nowMs + 120 * minuteMs, 'scheduled'));
await adminDb
  .doc('sessions/s5-now')
  .set(sessionDoc(nowMs - 10 * minuteMs, nowMs + 50 * minuteMs, 'scheduled'));
await adminDb
  .doc('sessions/s6-closed')
  .set(sessionDoc(nowMs - 10 * minuteMs, nowMs + 50 * minuteMs, 'closed'));
await adminDb
  .doc('sessions/s7-leave-closed')
  .set(sessionDoc(nowMs - 10 * minuteMs, nowMs + 50 * minuteMs, 'closed'));

const app = initializeApp({ projectId, apiKey: 'emulator' });
const auth = getAuth(app);
connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, {
  disableWarnings: true,
});
const db = getFirestore(app);
const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
connectFirestoreEmulator(db, host, Number(port));

const north = (meters: number) => lab.location.latitude - meters / 111320;

type Case = {
  label: string;
  fix: DeviceFix;
  sessionId?: string;
  sentDistance?: number;
  studentNim?: string;
  expected: 'allowed' | 'denied';
};

const cases: Case[] = [
  {
    label: '15 m dari lab, akurasi 15 m',
    fix: {
      latitude: north(15),
      longitude: lab.location.longitude,
      accuracyMeters: 15,
    },
    expected: 'allowed',
  },
  {
    label: 'akurasi tidak tersedia',
    fix: {
      latitude: north(8),
      longitude: lab.location.longitude,
      accuracyMeters: null,
    },
    expected: 'allowed',
  },
  {
    label: 'tepi radius (50,4 m dibulatkan 50 m)',
    fix: {
      latitude: north(50.4),
      longitude: lab.location.longitude,
      accuracyMeters: 10,
    },
    expected: 'allowed',
  },
  {
    label: '200 m dari lab',
    fix: {
      latitude: north(200),
      longitude: lab.location.longitude,
      accuracyMeters: 10,
    },
    expected: 'denied',
  },
  {
    label: '200 m tapi jarak dipalsukan 10 m',
    fix: {
      latitude: north(200),
      longitude: lab.location.longitude,
      accuracyMeters: 10,
    },
    sentDistance: 10,
    expected: 'denied',
  },
  {
    label: 'akurasi GPS 150 m',
    fix: {
      latitude: north(8),
      longitude: lab.location.longitude,
      accuracyMeters: 150,
    },
    expected: 'denied',
  },
  {
    label: 'NIM praktikan valid',
    fix: {
      latitude: north(15),
      longitude: lab.location.longitude,
      accuracyMeters: 15,
    },
    studentNim: 'A123456',
    expected: 'allowed',
  },
  {
    label: 'UID dipakai sebagai NIM',
    fix: {
      latitude: north(15),
      longitude: lab.location.longitude,
      accuracyMeters: 15,
    },
    studentNim: '3fQx9aK2',
    expected: 'denied',
  },
  {
    label: 'jauh sebelum jadwal',
    sessionId: 's2-early',
    fix: {
      latitude: north(15),
      longitude: lab.location.longitude,
      accuracyMeters: 15,
    },
    expected: 'denied',
  },
  {
    label: 'setelah sesi selesai',
    sessionId: 's3-late',
    fix: {
      latitude: north(15),
      longitude: lab.location.longitude,
      accuracyMeters: 15,
    },
    expected: 'denied',
  },
];

let failures = 0;
for (const testCase of cases) {
  const sid = testCase.sessionId ?? 's1';
  const attendanceId = `${sid}_budi`;
  await adminDb.doc(`attendance/${attendanceId}`).delete();

  await signInWithEmailAndPassword(auth, 'budi@rules.test', PASSWORD);
  const geofence = evaluateGeofence(testCase.fix, lab);
  let result: 'allowed' | 'denied' = 'allowed';
  try {
    await setDoc(doc(db, 'attendance', attendanceId), {
      id: attendanceId,
      sessionId: sid,
      classId: 'c1',
      studentId: 'budi',
      studentName: 'Budi',
      ...(testCase.studentNim ? { studentNim: testCase.studentNim } : {}),
      checkedInAt: new Date().toISOString(),
      deviceLocation: {
        latitude: testCase.fix.latitude,
        longitude: testCase.fix.longitude,
        accuracyMeters: testCase.fix.accuracyMeters ?? null,
      },
      distanceMeters: testCase.sentDistance ?? geofence.distanceMeters,
    });
  } catch {
    result = 'denied';
  }
  await signOut(auth);

  await signInWithEmailAndPassword(auth, 'asisten@rules.test', PASSWORD);
  const roster = await getDocs(
    query(
      collection(db, 'attendance'),
      where('sessionId', '==', sid),
      orderBy('checkedInAt', 'asc'),
    ),
  );
  await signOut(auth);

  const expectedRoster = testCase.expected === 'allowed' ? 1 : 0;
  const pass = result === testCase.expected && roster.size === expectedRoster;
  if (!pass) failures += 1;
  console.log(
    `${pass ? '✅' : '❌'} ${testCase.label}: server ${result} (harap ${testCase.expected}), rekap asisten ${roster.size}`,
  );
}

// --- Inbox notifikasi: users/{uid}/notifications/{id} ---
const notice = {
  type: 'session_opened',
  title: 'Sesi praktikum dibuka',
  body: 'Praktikum · A sudah dibuka.',
  sessionId: 's1',
  createdAt: '2026-01-01T01:00:00.000Z',
  readAt: null,
};
await adminDb.doc('users/budi/notifications/n1').set(notice);
await adminDb.doc('users/asisten/notifications/n2').set(notice);

const attempt = async (action: () => Promise<unknown>) => {
  try {
    await action();
    return 'allowed' as const;
  } catch {
    return 'denied' as const;
  }
};

const check = (
  label: string,
  result: string,
  expected: 'allowed' | 'denied',
) => {
  const pass = result === expected;
  if (!pass) failures += 1;
  console.log(
    `${pass ? '✅' : '❌'} role: ${label}: server ${result} (harap ${expected})`,
  );
};

// --- Jendela buka sesi: rules memakai epoch ms, bukan status manual saja ---
await signInWithEmailAndPassword(auth, 'asisten@rules.test', PASSWORD);
const openCases: [string, string, 'allowed' | 'denied'][] = [
  ['buka sesi jauh dari jadwal', 's4-future', 'denied'],
  ['buka sesi dalam jendela', 's5-now', 'allowed'],
  ['buka ulang sesi yang baru ditutup', 's6-closed', 'allowed'],
];
for (const [label, sessionId, expected] of openCases) {
  check(
    label,
    await attempt(() =>
      updateDoc(doc(db, 'sessions', sessionId), {
        status: 'open',
        openedAt: new Date().toISOString(),
      }),
    ),
    expected,
  );
}
await signOut(auth);

// --- Izin: jendela sesi, ID deterministik, dan konflik dengan presensi ---
const leaveDoc = (sessionId: string, status: string) => ({
  sessionId,
  classId: 'c1',
  courseName: 'Praktikum',
  groupName: 'A',
  sessionStartsAt: new Date(nowMs - 10 * minuteMs).toISOString(),
  studentId: 'budi',
  studentName: 'Budi',
  studentNim: '12345678',
  reason: 'Sakit demam',
  aiPrediction: { category: 'sakit', confidence: 0.9 },
  status,
  decisionNote: null,
  reviewedBy: null,
  reviewedAt: null,
  createdAt: new Date().toISOString(),
});
const attendanceStub = {
  sessionId: 's1',
  studentId: 'budi',
  studentNim: '12345678',
  studentName: 'Budi',
  checkedInAt: new Date().toISOString(),
};
const resetLeaveFixtures = async () => {
  const leaves = await adminDb.collection('leave_requests').get();
  await Promise.all(leaves.docs.map((item) => item.ref.delete()));
  await adminDb.doc('attendance/s1_budi').delete();
};

await resetLeaveFixtures();
await signInWithEmailAndPassword(auth, 'budi@rules.test', PASSWORD);
check(
  'izin sesi masih berjalan',
  await attempt(() =>
    setDoc(doc(db, 'leave_requests', 's1_budi'), leaveDoc('s1', 'pending')),
  ),
  'allowed',
);
await signOut(auth);

await resetLeaveFixtures();
await signInWithEmailAndPassword(auth, 'budi@rules.test', PASSWORD);
check(
  'izin sesi yang sudah ditutup',
  await attempt(() =>
    setDoc(
      doc(db, 'leave_requests', 's7-leave-closed_budi'),
      leaveDoc('s7-leave-closed', 'pending'),
    ),
  ),
  'denied',
);
check(
  'izin sesi yang sudah lewat jadwal',
  await attempt(() =>
    setDoc(
      doc(db, 'leave_requests', 's3-late_budi'),
      leaveDoc('s3-late', 'pending'),
    ),
  ),
  'denied',
);
check(
  'izin dengan ID acak',
  await attempt(() =>
    setDoc(doc(db, 'leave_requests', 'acak-1'), leaveDoc('s1', 'pending')),
  ),
  'denied',
);
await signOut(auth);

await resetLeaveFixtures();
await adminDb.doc('attendance/s1_budi').set(attendanceStub);
await signInWithEmailAndPassword(auth, 'budi@rules.test', PASSWORD);
check(
  'izin setelah praktikan presensi',
  await attempt(() =>
    setDoc(doc(db, 'leave_requests', 's1_budi'), leaveDoc('s1', 'pending')),
  ),
  'denied',
);
await signOut(auth);

await resetLeaveFixtures();
await adminDb.doc('leave_requests/s1_budi').set(leaveDoc('s1', 'rejected'));
await signInWithEmailAndPassword(auth, 'budi@rules.test', PASSWORD);
check(
  'pengajuan ulang izin yang ditolak',
  await attempt(() =>
    updateDoc(doc(db, 'leave_requests', 's1_budi'), {
      reason: 'Izin baru',
      aiPrediction: { category: 'sakit', confidence: 0.9 },
      status: 'pending',
      decisionNote: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date().toISOString(),
      studentNim: '12345678',
    }),
  ),
  'allowed',
);
await signOut(auth);

await resetLeaveFixtures();
await adminDb.doc('leave_requests/s1_budi').set(leaveDoc('s1', 'pending'));
await adminDb.doc('attendance/s1_budi').set(attendanceStub);
await signInWithEmailAndPassword(auth, 'asisten@rules.test', PASSWORD);
check(
  'izin tidak disetujui bila presensi ada',
  await attempt(() =>
    updateDoc(doc(db, 'leave_requests', 's1_budi'), {
      status: 'approved',
      reviewedBy: 'asisten',
      reviewedAt: new Date().toISOString(),
      decisionNote: 'Hadir',
    }),
  ),
  'denied',
);
await signOut(auth);

await resetLeaveFixtures();
await adminDb.doc('leave_requests/s1_budi').set(leaveDoc('s1', 'pending'));
await signInWithEmailAndPassword(auth, 'asisten@rules.test', PASSWORD);
check(
  'izin disetujui tanpa presensi',
  await attempt(() =>
    updateDoc(doc(db, 'leave_requests', 's1_budi'), {
      status: 'approved',
      reviewedBy: 'asisten',
      reviewedAt: new Date().toISOString(),
      decisionNote: 'Disetujui',
    }),
  ),
  'allowed',
);
await signOut(auth);

await signInWithEmailAndPassword(auth, 'budi@rules.test', PASSWORD);
const inboxCases: [string, () => Promise<unknown>, 'allowed' | 'denied'][] = [
  [
    'baca inbox sendiri',
    () =>
      getDocs(
        query(
          collection(db, 'users', 'budi', 'notifications'),
          orderBy('createdAt', 'desc'),
        ),
      ),
    'allowed',
  ],
  [
    'baca inbox orang lain',
    () => getDoc(doc(db, 'users', 'asisten', 'notifications', 'n2')),
    'denied',
  ],
  [
    'tandai sudah dibaca',
    () =>
      updateDoc(doc(db, 'users', 'budi', 'notifications', 'n1'), {
        readAt: new Date().toISOString(),
      }),
    'allowed',
  ],
  [
    'ubah judul notifikasi',
    () =>
      updateDoc(doc(db, 'users', 'budi', 'notifications', 'n1'), {
        title: 'Palsu',
      }),
    'denied',
  ],
  [
    'buat notifikasi sendiri',
    () => setDoc(doc(db, 'users', 'budi', 'notifications', 'n3'), notice),
    'denied',
  ],
  [
    'hapus notifikasi',
    () => deleteDoc(doc(db, 'users', 'budi', 'notifications', 'n1')),
    'denied',
  ],
];
for (const [label, action, expected] of inboxCases) {
  const result = await attempt(action);
  const pass = result === expected;
  if (!pass) failures += 1;
  console.log(
    `${pass ? '✅' : '❌'} inbox: ${label}: server ${result} (harap ${expected})`,
  );
}
await signOut(auth);

// --- Role asisten hanya bisa diberikan lewat undangan admin ---
const profile = (uid: string, email: string, role: string) => ({
  uid,
  email,
  role,
  displayName: uid,
  createdAt: lab.createdAt,
});

await signInWithEmailAndPassword(auth, 'stranger@rules.test', PASSWORD);
check(
  'user tanpa undangan daftar sebagai praktikan',
  await attempt(() =>
    setDoc(
      doc(db, 'users', 'stranger'),
      profile('stranger', 'stranger@rules.test', 'student'),
    ),
  ),
  'allowed',
);
check(
  'user tanpa undangan mengangkat diri jadi asisten',
  await attempt(() =>
    updateDoc(doc(db, 'users', 'stranger'), { role: 'assistant' }),
  ),
  'denied',
);
check(
  'baca undangan orang lain',
  await attempt(() =>
    getDoc(doc(db, 'assistant_invites', 'invited@rules.test')),
  ),
  'denied',
);
check(
  'menulis undangan sendiri',
  await attempt(() =>
    setDoc(doc(db, 'assistant_invites', 'stranger@rules.test'), {
      createdAt: lab.createdAt,
    }),
  ),
  'denied',
);
await signOut(auth);

await signInWithEmailAndPassword(auth, 'invited@rules.test', PASSWORD);
check(
  'baca undangan sendiri',
  await attempt(() =>
    getDoc(doc(db, 'assistant_invites', 'invited@rules.test')),
  ),
  'allowed',
);
check(
  'user dengan undangan daftar sebagai asisten',
  await attempt(() =>
    setDoc(
      doc(db, 'users', 'invited'),
      profile('invited', 'invited@rules.test', 'assistant'),
    ),
  ),
  'allowed',
);
await signOut(auth);

console.log(
  failures ? `\n❌ ${failures} kasus gagal.` : '\n✅ Semua kasus lolos.',
);
process.exit(failures ? 1 : 0);
