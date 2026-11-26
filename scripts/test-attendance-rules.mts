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
await adminDb.doc('sessions/s1').set({
  classId: 'c1',
  courseName: 'Praktikum',
  groupName: 'A',
  lab: lab.name,
  labId,
  participantIds: ['budi'],
  assistantIds: ['asisten'],
  startsAt: '2026-01-01T01:00:00.000Z',
  endsAt: '2026-01-01T03:00:00.000Z',
  status: 'open',
  openedAt: '2026-01-01T01:00:00.000Z',
  closedAt: null,
  createdBy: 'asisten',
});

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
  sentDistance?: number;
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
];

let failures = 0;
for (const testCase of cases) {
  await adminDb.doc('attendance/s1_budi').delete();

  await signInWithEmailAndPassword(auth, 'budi@rules.test', PASSWORD);
  const geofence = evaluateGeofence(testCase.fix, lab);
  let result: 'allowed' | 'denied' = 'allowed';
  try {
    await setDoc(doc(db, 'attendance', 's1_budi'), {
      id: 's1_budi',
      sessionId: 's1',
      classId: 'c1',
      studentId: 'budi',
      studentName: 'Budi',
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
      where('sessionId', '==', 's1'),
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
