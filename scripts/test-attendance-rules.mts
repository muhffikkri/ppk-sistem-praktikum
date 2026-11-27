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
import assert from 'node:assert/strict';
import { initializeApp as initAdmin } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import {
  FieldValue,
  getFirestore as getAdminDb,
} from 'firebase-admin/firestore';
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
import { createLabAdministration } from '../functions/labAdministration.cjs';

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
  uid: 'asistenB',
  email: 'asistenB@rules.test',
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
await adminDb.doc('users/asistenB').set({
  uid: 'asistenB',
  role: 'assistant',
  displayName: 'Asisten B',
  email: 'asistenB@rules.test',
  createdAt: lab.createdAt,
});
await adminDb.doc('assistant_invites/invited@rules.test').set({
  createdAt: lab.createdAt,
});
const { id: labId, ...labDoc } = lab;
await adminDb.doc(`labs/${labId}`).set(labDoc);
const classDoc = () => ({
  courseName: 'Praktikum',
  groupName: 'A',
  participantIds: ['budi'],
  assistantIds: ['asisten'],
  createdBy: 'asisten',
  createdAt: lab.createdAt,
  updatedAt: lab.updatedAt,
});
await adminDb.doc('classes/c1').set(classDoc());
await adminDb.doc('classes/c2').set(classDoc());
await adminDb
  .doc('classes/cB')
  .set({ ...classDoc(), assistantIds: ['asistenB'] });

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
await adminDb
  .doc('sessions/s8-edit')
  .set(sessionDoc(nowMs - 10 * minuteMs, nowMs + 50 * minuteMs, 'scheduled'));
await adminDb
  .doc('sessions/s9-cancel')
  .set(sessionDoc(nowMs + 60 * minuteMs, nowMs + 120 * minuteMs, 'scheduled'));
await adminDb.doc('sessions/sB').set({
  ...sessionDoc(nowMs - 10 * minuteMs, nowMs + 50 * minuteMs, 'scheduled'),
  assistantIds: ['asistenB'],
  classId: 'cB',
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

  const geofence = evaluateGeofence(testCase.fix, lab);
  const payload = {
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
  };

  // Presensi kini hanya lewat callable; tulisan langsung klien selalu ditolak.
  await signInWithEmailAndPassword(auth, 'budi@rules.test', PASSWORD);
  let clientWrite: 'allowed' | 'denied' = 'allowed';
  try {
    await setDoc(doc(db, 'attendance', attendanceId), payload);
  } catch {
    clientWrite = 'denied';
  }
  await signOut(auth);

  // Admin SDK mensimulasikan hasil callable yang valid.
  if (testCase.expected === 'allowed') {
    await adminDb.doc(`attendance/${attendanceId}`).set(payload);
  }

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
  const pass = clientWrite === 'denied' && roster.size === expectedRoster;
  if (!pass) failures += 1;
  console.log(
    `${pass ? '✅' : '❌'} ${testCase.label}: tulis klien ${clientWrite} (harap denied), rekap asisten ${roster.size}`,
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

// --- Buka sesi hanya lewat callable; klien tidak boleh menulis status open ---
await signInWithEmailAndPassword(auth, 'asisten@rules.test', PASSWORD);
const openCases: [string, string, 'allowed' | 'denied'][] = [
  ['buka sesi jauh dari jadwal', 's4-future', 'denied'],
  ['buka sesi dalam jendela dari klien', 's5-now', 'denied'],
  ['buka ulang sesi tertutup dari klien', 's6-closed', 'denied'],
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
check(
  'buka sesi lewat server (Admin SDK)',
  await attempt(() =>
    adminDb.doc('sessions/s5-now').update({
      status: 'open',
      openedAt: new Date().toISOString(),
    }),
  ),
  'allowed',
);
await signOut(auth);

// --- Edit & batal sesi: hanya scheduled, patch sesuai status ---
await signInWithEmailAndPassword(auth, 'asisten@rules.test', PASSWORD);
const startedMs = nowMs - 10 * minuteMs;
const endedMs = nowMs + 50 * minuteMs;
check(
  'edit sesi scheduled',
  await attempt(() =>
    updateDoc(doc(db, 'sessions', 's8-edit'), {
      title: 'Pertemuan 1',
      startsAt: new Date(startedMs).toISOString(),
      endsAt: new Date(endedMs).toISOString(),
      startsAtMs: startedMs,
      endsAtMs: endedMs,
      updatedAt: new Date().toISOString(),
    }),
  ),
  'allowed',
);
check(
  'pindah kelas saat edit menyalin data kelas',
  await attempt(() =>
    updateDoc(doc(db, 'sessions', 's8-edit'), {
      classId: 'c2',
      courseName: 'Praktikum',
      groupName: 'A',
      participantIds: ['budi'],
      assistantIds: ['asisten'],
      updatedAt: new Date().toISOString(),
    }),
  ),
  'allowed',
);
check(
  'lab tidak bisa diubah saat sesi open',
  await attempt(() =>
    updateDoc(doc(db, 'sessions', 's1'), {
      labId,
      lab: lab.name,
    }),
  ),
  'denied',
);
check(
  'batalkan sesi scheduled',
  await attempt(() =>
    updateDoc(doc(db, 'sessions', 's9-cancel'), {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
    }),
  ),
  'allowed',
);
check(
  'sesi batal tidak bisa dibuka lagi',
  await attempt(() =>
    updateDoc(doc(db, 'sessions', 's9-cancel'), {
      status: 'open',
      openedAt: new Date().toISOString(),
    }),
  ),
  'denied',
);
check(
  'sesi open tidak bisa dibatalkan',
  await attempt(() =>
    updateDoc(doc(db, 'sessions', 's1'), {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
    }),
  ),
  'denied',
);
check(
  'sesi tidak bisa dihapus',
  await attempt(() => deleteDoc(doc(db, 'sessions', 's1'))),
  'denied',
);
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

// --- Scope asisten: hanya sesi yang dikelola yang boleh dibaca ---
await resetLeaveFixtures();
await adminDb.doc('attendance/s1_budi').set(attendanceStub);
await adminDb.doc('leave_requests/s1_budi').set(leaveDoc('s1', 'pending'));

await signInWithEmailAndPassword(auth, 'asisten@rules.test', PASSWORD);
check(
  'asisten A baca presensi sesinya',
  await attempt(() => getDoc(doc(db, 'attendance', 's1_budi'))),
  'allowed',
);
check(
  'asisten A list presensi sesinya',
  await attempt(() =>
    getDocs(
      query(collection(db, 'attendance'), where('sessionId', '==', 's1')),
    ),
  ),
  'allowed',
);
check(
  'asisten A baca izin sesinya',
  await attempt(() => getDoc(doc(db, 'leave_requests', 's1_budi'))),
  'allowed',
);
check(
  'asisten A list izin sesinya',
  await attempt(() =>
    getDocs(
      query(collection(db, 'leave_requests'), where('sessionId', '==', 's1')),
    ),
  ),
  'allowed',
);
check(
  'asisten tidak boleh query seluruh users',
  await attempt(() =>
    getDocs(query(collection(db, 'users'), where('role', '==', 'student'))),
  ),
  'denied',
);
await signOut(auth);

await signInWithEmailAndPassword(auth, 'asistenB@rules.test', PASSWORD);
check(
  'asisten B tidak baca presensi sesi A',
  await attempt(() => getDoc(doc(db, 'attendance', 's1_budi'))),
  'denied',
);
check(
  'asisten B tidak list presensi sesi A',
  await attempt(() =>
    getDocs(
      query(collection(db, 'attendance'), where('sessionId', '==', 's1')),
    ),
  ),
  'denied',
);
check(
  'asisten B tidak baca izin sesi A',
  await attempt(() => getDoc(doc(db, 'leave_requests', 's1_budi'))),
  'denied',
);
check(
  'asisten B tidak list izin sesi A',
  await attempt(() =>
    getDocs(
      query(collection(db, 'leave_requests'), where('sessionId', '==', 's1')),
    ),
  ),
  'denied',
);
check(
  'asisten B tetap bisa baca profil praktikan',
  await attempt(() => getDoc(doc(db, 'users', 'budi'))),
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

// --- SRS-4.01: Cakupan Aslab per courseId & larangan self-assign lab_assistant ---
await adminAuth.createUser({
  uid: 'aslabA',
  email: 'aslabA@rules.test',
  password: PASSWORD,
});
await adminDb.doc('users/aslabA').set({
  uid: 'aslabA',
  role: 'lab_assistant',
  displayName: 'Aslab A',
  email: 'aslabA@rules.test',
  managedCourseIds: ['MK-A'],
  createdAt: lab.createdAt,
});

const labPayload = (courseId: string, name: string) => ({
  name,
  building: 'Gedung B',
  description: null,
  courseId,
  courseCode: courseId,
  location: { latitude: -7.05068, longitude: 110.43828 },
  radiusMeters: 50,
  isActive: true,
  createdBy: 'aslabA',
  createdAt: lab.createdAt,
  updatedAt: lab.updatedAt,
});

await adminDb.doc('labs/lab-mk-a').set(labPayload('MK-A', 'Lab MK A'));
await adminDb.doc('labs/lab-mk-b').set({
  ...labPayload('MK-B', 'Lab MK B'),
  createdBy: 'admin-seed',
});

await signInWithEmailAndPassword(auth, 'aslabA@rules.test', PASSWORD);
check(
  'aslab tidak bisa menambahkan mata kuliah ke profilnya sendiri',
  await attempt(() =>
    updateDoc(doc(db, 'users', 'aslabA'), {
      managedCourseIds: ['MK-A', 'MK-B'],
    }),
  ),
  'denied',
);
check(
  'aslab A buat lab pada mata kuliah terkelola (MK-A)',
  await attempt(() =>
    setDoc(doc(db, 'labs', 'lab-mk-a-new'), labPayload('MK-A', 'Lab MK A 2')),
  ),
  'allowed',
);
check(
  'aslab A ubah lab pada mata kuliah terkelola (MK-A)',
  await attempt(() =>
    updateDoc(doc(db, 'labs', 'lab-mk-a'), { name: 'Lab MK A Updated' }),
  ),
  'allowed',
);
check(
  'aslab A buat lab pada mata kuliah lain (MK-B) ditolak',
  await attempt(() =>
    setDoc(doc(db, 'labs', 'lab-mk-b-new'), labPayload('MK-B', 'Lab MK B 2')),
  ),
  'denied',
);
check(
  'aslab A ubah lab pada mata kuliah lain (MK-B) ditolak',
  await attempt(() =>
    updateDoc(doc(db, 'labs', 'lab-mk-b'), { name: 'Lab MK B Hacked' }),
  ),
  'denied',
);
check(
  'aslab A hapus lab pada mata kuliah lain (MK-B) ditolak',
  await attempt(() => deleteDoc(doc(db, 'labs', 'lab-mk-b'))),
  'denied',
);
check(
  'aslab tidak bisa memindahkan lab ke mata kuliah di luar penugasan',
  await attempt(() =>
    updateDoc(doc(db, 'labs', 'lab-mk-a'), { courseId: 'MK-B' }),
  ),
  'denied',
);
await signOut(auth);

await signInWithEmailAndPassword(auth, 'asisten@rules.test', PASSWORD);
check(
  'asprak (assistant) ditolak membuat lab',
  await attempt(() =>
    setDoc(doc(db, 'labs', 'lab-asprak-try'), labPayload('MK-A', 'Lab Asprak')),
  ),
  'denied',
);
check(
  'asprak (assistant) ditolak mengubah lab',
  await attempt(() =>
    updateDoc(doc(db, 'labs', 'lab-mk-a'), { name: 'Lab Asprak Edit' }),
  ),
  'denied',
);
await signOut(auth);

await signInWithEmailAndPassword(auth, 'stranger@rules.test', PASSWORD);
check(
  'registrasi profil baru dengan role lab_assistant ditolak',
  await attempt(() =>
    setDoc(doc(db, 'users', 'stranger'), {
      ...profile('stranger', 'stranger@rules.test', 'lab_assistant'),
      managedCourseIds: ['MK-A'],
    }),
  ),
  'denied',
);
await signOut(auth);

// Backend lab handlers against the same isolated Firestore emulator.
class LabTestError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

const labAdmin = createLabAdministration({
  db: adminDb,
  auth: adminAuth,
  FieldValue,
  HttpsError: LabTestError,
});
const asAslab = (data: object) => ({ auth: { uid: 'aslabA' }, data });
const testLabInput = {
  name: 'Template Lab',
  building: 'E',
  latitude: -7.05,
  longitude: 110.43,
  radiusMeters: 55,
  isActive: true,
};
await assert.rejects(
  labAdmin.importLab(asAslab({ courseId: 'MK-B', input: testLabInput })),
  { code: 'permission-denied' },
);
const csvTarget = await labAdmin.importLab(
  asAslab({ courseId: 'MK-A', input: testLabInput }),
);
assert.deepEqual(
  await labAdmin.importLab(asAslab({ courseId: 'MK-A', input: testLabInput })),
  csvTarget,
);
await adminDb.doc('labs/lab-mk-a').update({ lateToleranceMinutes: 0 });
await adminDb.doc('users/budi').update({ nim: '24060124120001' });
const scheduled = {
  classId: 'lab-group-a',
  courseCode: 'MK-A',
  participantIds: [],
  assistantIds: ['asisten'],
  startsAt: '2026-01-01T08:00:00.000Z',
  status: 'scheduled',
};
await adminDb.doc('classes/lab-group-a').set({
  labId: 'lab-mk-a',
  courseCode: 'MK-A',
  participantIds: [],
  assistantIds: ['asisten'],
});
await Promise.all([
  adminDb
    .doc('sessions/lab-source-scheduled')
    .set({ ...scheduled, labId: 'lab-mk-a' }),
  adminDb
    .doc('sessions/lab-target-scheduled')
    .set({ ...scheduled, labId: csvTarget.labId }),
  adminDb.doc('sessions/lab-source-history').set({
    ...scheduled,
    status: 'closed',
    labId: 'lab-mk-a',
    participantIds: ['budi'],
  }),
]);
await assert.rejects(
  labAdmin.changeLabAssignment({
    auth: { uid: 'asisten' },
    data: {
      action: 'participant',
      identifier: 'budi@rules.test',
      labId: 'lab-mk-a',
    },
  }),
  { code: 'permission-denied' },
);
await assert.rejects(
  labAdmin.changeLabAssignment(
    asAslab({
      action: 'assistant',
      identifier: 'budi@rules.test',
      labId: 'lab-mk-a',
    }),
  ),
  { code: 'not-found' },
);
await assert.rejects(
  labAdmin.changeLabAssignment(
    asAslab({
      action: 'participant',
      identifier: 'budi@rules.test',
      labId: 'lab-mk-b',
    }),
  ),
  { code: 'permission-denied' },
);
await labAdmin.changeLabAssignment(
  asAslab({
    action: 'participant',
    identifier: '24060124120001',
    labId: 'lab-mk-a',
  }),
);
await labAdmin.changeLabAssignment(
  asAslab({
    action: 'participant',
    identifier: 'budi@rules.test',
    labId: 'lab-mk-a',
  }),
);
assert.deepEqual(
  (await adminDb.doc('sessions/lab-source-scheduled').get()).get(
    'participantIds',
  ),
  ['budi'],
);
const originalRoster = await labAdmin.getLabSessionRoster({
  auth: { uid: 'asisten' },
  data: { labId: 'lab-mk-a', classId: 'lab-group-a' },
});
assert.equal(originalRoster.toleranceMinutes, 0);
await labAdmin.changeLabAssignment(
  asAslab({
    action: 'assistant',
    identifier: 'asistenB@rules.test',
    labId: csvTarget.labId,
  }),
);
await labAdmin.changeLabAssignment(
  asAslab({
    action: 'move',
    identifier: 'budi@rules.test',
    fromLabId: 'lab-mk-a',
    labId: csvTarget.labId,
  }),
);
const sourceSession = await adminDb.doc('sessions/lab-source-scheduled').get();
const targetSession = await adminDb.doc('sessions/lab-target-scheduled').get();
assert.deepEqual(sourceSession.get('participantIds'), []);
assert.deepEqual(targetSession.get('participantIds'), ['budi']);
assert.deepEqual(targetSession.get('assistantIds'), ['asisten', 'asistenB']);
assert.equal(sourceSession.get('labId'), 'lab-mk-a');
assert.equal(targetSession.get('startsAt'), scheduled.startsAt);
const refreshedSource = await adminDb.runTransaction((tx) =>
  labAdmin.refreshScheduledRoster(
    tx,
    {
      ...scheduled,
      labId: 'lab-mk-a',
      participantIds: ['budi'],
    },
    { courseId: 'MK-A' },
  ),
);
assert.deepEqual(refreshedSource.participantIds, []);
const untouchedHistory = await adminDb.runTransaction((tx) =>
  labAdmin.refreshScheduledRoster(
    tx,
    {
      ...scheduled,
      labId: 'lab-mk-a',
      status: 'closed',
      participantIds: ['budi'],
    },
    { courseId: 'MK-A' },
  ),
);
assert.deepEqual(untouchedHistory, {});
assert.deepEqual(
  (await adminDb.doc('sessions/lab-source-history').get()).get(
    'participantIds',
  ),
  ['budi'],
);
assert.equal(
  (
    await adminDb
      .collection('labAssignments')
      .where('userId', '==', 'budi')
      .get()
  ).size,
  1,
);
await assert.rejects(labAdmin.deleteLabSafely(asAslab({ labId: 'lab-mk-a' })), {
  code: 'failed-precondition',
  details: { reason: 'lab_in_use' },
});
const unusedLab = await labAdmin.importLab(
  asAslab({
    courseId: 'MK-A',
    input: { ...testLabInput, name: 'Lab tidak dipakai' },
  }),
);
await labAdmin.deleteLabSafely(asAslab({ labId: unusedLab.labId }));
assert.equal(
  (await adminDb.doc(`labs/${unusedLab.labId}`).get()).exists,
  false,
);

await signInWithEmailAndPassword(auth, 'asisten@rules.test', PASSWORD);
const newSessionRef = doc(db, 'sessions', 'tolerance-snapshot-session');
const newSession = {
  ...scheduled,
  labId: 'lab-mk-a',
  endsAt: '2026-01-01T09:00:00.000Z',
  startsAtMs: Date.parse(scheduled.startsAt),
  endsAtMs: Date.parse('2026-01-01T09:00:00.000Z'),
  openedAt: null,
  closedAt: null,
  createdBy: 'asisten',
};
check(
  'tolak snapshot toleransi yang berbeda dari lab saat membuat sesi',
  await attempt(() =>
    setDoc(newSessionRef, { ...newSession, toleranceMinutes: 15 }),
  ),
  'denied',
);
check(
  'membuat sesi dengan toleransi nol dari lab',
  await attempt(() =>
    setDoc(newSessionRef, { ...newSession, toleranceMinutes: 0 }),
  ),
  'allowed',
);
check(
  'tolak edit toleransi sesi untuk lab yang sama',
  await attempt(() => updateDoc(newSessionRef, { toleranceMinutes: 15 })),
  'denied',
);
await signOut(auth);

await signInWithEmailAndPassword(auth, 'aslabA@rules.test', PASSWORD);
check(
  'tolak hapus lab langsung dari klien',
  await attempt(() => deleteDoc(doc(db, 'labs', 'lab-mk-a'))),
  'denied',
);
check(
  'tolak penempatan langsung dari klien',
  await attempt(() =>
    setDoc(doc(db, 'labAssignments', 'forged'), {
      labId: 'lab-mk-a',
      userId: 'budi',
    }),
  ),
  'denied',
);
await signOut(auth);
console.log(
  '✅ Backend lab: impor idempoten, akses, penempatan, pemindahan, toleransi, dan hapus aman.',
);

// --- SRS-4.12/4.13: Dashboard Aslab hanya membaca mata kuliah yang dikelola ---
const dashboardClass = (courseCode: string) => ({
  ...classDoc(),
  courseCode,
  assistantIds: ['asistenB'],
});
const dashboardSession = (courseCode: string, classId: string) => ({
  classId,
  courseCode,
  courseName: 'Praktikum',
  groupName: 'A',
  labId: courseCode === 'MK-A' ? 'lab-mk-a' : 'lab-mk-b',
  participantIds: ['budi'],
  assistantIds: ['asistenB'],
  startsAt: '2026-11-26T02:00:00.000Z',
  endsAt: '2026-11-26T04:00:00.000Z',
  status: 'scheduled',
  openedAt: null,
  closedAt: null,
  createdBy: 'asistenB',
});
await adminDb.doc('classes/dash-a').set(dashboardClass('MK-A'));
await adminDb.doc('classes/dash-b').set(dashboardClass('MK-B'));
await adminDb.doc('sessions/dash-a').set(dashboardSession('MK-A', 'dash-a'));
await adminDb.doc('sessions/dash-b').set(dashboardSession('MK-B', 'dash-b'));

const courseSessions = (courseIds: string[]) =>
  getDocs(
    query(
      collection(db, 'sessions'),
      where('courseCode', 'in', courseIds),
      where('startsAt', '>=', '2026-11-23T00:00:00.000Z'),
      where('startsAt', '<', '2026-11-30T00:00:00.000Z'),
      orderBy('startsAt', 'asc'),
    ),
  );

await signInWithEmailAndPassword(auth, 'aslabA@rules.test', PASSWORD);
check(
  'aslab membaca sesi periode mata kuliah yang dikelola',
  await attempt(() => courseSessions(['MK-A'])),
  'allowed',
);
check(
  'aslab ditolak membaca sesi mata kuliah lain',
  await attempt(() => courseSessions(['MK-A', 'MK-B'])),
  'denied',
);
check(
  'aslab membaca kelas mata kuliah yang dikelola',
  await attempt(() =>
    getDocs(
      query(collection(db, 'classes'), where('courseCode', 'in', ['MK-A'])),
    ),
  ),
  'allowed',
);
check(
  'aslab ditolak membuka sesi mata kuliah lain langsung',
  await attempt(() => getDoc(doc(db, 'sessions', 'dash-b'))),
  'denied',
);
await signOut(auth);

// --- SRS-4.14: Riwayat keuangan Aslab hanya untuk lab yang dikelola ---
const dashboardFine = (labIdValue: string, sessionId: string) => ({
  studentId: 'budi',
  studentName: 'Budi',
  sessionId,
  attendanceId: `${sessionId}_budi`,
  labId: labIdValue,
  amount: 10000,
  status: 'paid',
  createdAt: '2026-11-26T02:20:00.000Z',
  paidAt: '2026-11-26T05:00:00.000Z',
});
await adminDb
  .doc('fines/fine_dash-a_budi')
  .set(dashboardFine('lab-mk-a', 'dash-a'));
await adminDb
  .doc('fines/fine_dash-b_budi')
  .set(dashboardFine('lab-mk-b', 'dash-b'));
const labFines = (labIds: string[]) =>
  getDocs(query(collection(db, 'fines'), where('labId', 'in', labIds)));

await signInWithEmailAndPassword(auth, 'aslabA@rules.test', PASSWORD);
check(
  'aslab membaca tagihan lab yang dikelola',
  await attempt(() => labFines(['lab-mk-a'])),
  'allowed',
);
check(
  'aslab ditolak membaca tagihan lab mata kuliah lain',
  await attempt(() => labFines(['lab-mk-a', 'lab-mk-b'])),
  'denied',
);
check(
  'aslab ditolak membuka tagihan lab mata kuliah lain langsung',
  await attempt(() => getDoc(doc(db, 'fines', 'fine_dash-b_budi'))),
  'denied',
);
await signOut(auth);

await signInWithEmailAndPassword(auth, 'asistenB@rules.test', PASSWORD);
check(
  'asprak tetap bisa membaca tagihan untuk pembebasan izin',
  await attempt(() => getDoc(doc(db, 'fines', 'fine_dash-b_budi'))),
  'allowed',
);
await signOut(auth);

await signInWithEmailAndPassword(auth, 'asisten@rules.test', PASSWORD);
check(
  'asprak tetap tidak bisa membaca sesi mata kuliah tanpa penugasan',
  await attempt(() => courseSessions(['MK-A'])),
  'denied',
);
await signOut(auth);

console.log(
  failures ? `\n❌ ${failures} kasus gagal.` : '\n✅ Semua kasus lolos.',
);
process.exit(failures ? 1 : 0);
