/**
 * Firestore Seeder — PPK Mobile
 *
 * Populates Firestore with demo classes, sessions, and student profiles
 * so the app has content when opened for the first time.
 *
 * Usage:
 *   npx tsx scripts/seed-firestore.ts
 *
 * Requires Firebase config in .env (EXPO_PUBLIC_FIREBASE_*).
 */

import { doc, setDoc, collection, writeBatch } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { PracticalClass, Session, UserProfile } from '../src/domain/types';

// Firebase config from environment
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

const isConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId,
);

if (!isConfigured) {
  console.error(
    '❌ Firebase belum dikonfigurasi. Salin .env.example menjadi .env dan isi EXPO_PUBLIC_FIREBASE_*.',
  );
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================================
// Demo Users
// ============================================================

const demoUsers: UserProfile[] = [
  {
    uid: 'user-praktikan-01',
    displayName: 'Budi Santoso',
    email: 'budi@kampus.ac.id',
    role: 'student',
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'user-praktikan-02',
    displayName: 'Siti Rahma',
    email: 'siti@kampus.ac.id',
    role: 'student',
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'user-praktikan-03',
    displayName: 'Dimas Prasetyo',
    email: 'dimas@kampus.ac.id',
    role: 'student',
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'user-asisten-01',
    displayName: 'Asisten Lab RPL',
    email: 'asisten.rpl@kampus.ac.id',
    role: 'assistant',
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'user-asisten-02',
    displayName: 'Asisten Koordinator',
    email: 'asisten.koordinator@kampus.ac.id',
    role: 'assistant',
    createdAt: new Date().toISOString(),
  },
];

// ============================================================
// Demo Classes
// ============================================================

const demoClasses: PracticalClass[] = [
  {
    id: 'class-praktikum-rpl-01',
    courseCode: 'IF3121',
    courseName: 'Praktikum Sistem Terdistribusi',
    groupName: 'Kelas 3SE1 - Kelompok A',
    assistantIds: ['user-asisten-01', 'user-asisten-02'],
    participantIds: [
      'user-praktikan-01',
      'user-praktikan-02',
      'user-praktikan-03',
    ],
    createdBy: 'user-asisten-02',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'class-praktikum-db-01',
    courseCode: 'IF3122',
    courseName: 'Praktikum Basis Data Lanjut',
    groupName: 'Kelas 3SE2 - Kelompok B',
    assistantIds: ['user-asisten-01', 'user-asisten-02'],
    participantIds: ['user-praktikan-01', 'user-praktikan-02'],
    createdBy: 'user-asisten-02',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'class-praktikum-jaringan-01',
    courseCode: 'IF3123',
    courseName: 'Praktikum Jaringan Komputer',
    groupName: 'Kelas 3SE3 - Kelompok C',
    assistantIds: ['user-asisten-01', 'user-asisten-02'],
    participantIds: ['user-praktikan-03'],
    createdBy: 'user-asisten-02',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================================
// Demo Sessions
// ============================================================

const now = new Date();
const oneDay = 24 * 60 * 60 * 1000;

const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * oneDay).toISOString();

const demoSessions: Session[] = [
  {
    id: 'session-01',
    classId: 'class-praktikum-rpl-01',
    courseName: 'Praktikum Sistem Terdistribusi',
    groupName: 'Kelas 3SE1 - Kelompok A',
    title: 'Sesi 1: Pengenalan Sistem Terdistribusi',
    lab: 'Lab 3.2 RPL · Ged B',
    startsAt: addDays(now, -2),
    endsAt: addDays(now, -2),
    status: 'closed',
    openedAt: addDays(now, -2),
    closedAt: addDays(now, -2),
    participantIds: [
      'user-praktikan-01',
      'user-praktikan-02',
      'user-praktikan-03',
    ],
    assistantIds: ['user-asisten-01', 'user-asisten-02'],
    createdBy: 'user-asisten-01',
    createdAt: addDays(now, -5),
  },
  {
    id: 'session-02',
    classId: 'class-praktikum-db-01',
    courseName: 'Praktikum Basis Data Lanjut',
    groupName: 'Kelas 3SE2 - Kelompok B',
    title: 'Sesi 1: Normalisasi Database',
    lab: 'Lab Database · Ged C',
    startsAt: addDays(now, -1),
    endsAt: addDays(now, -1),
    status: 'open',
    openedAt: addDays(now, -1),
    closedAt: null,
    participantIds: ['user-praktikan-01', 'user-praktikan-02'],
    assistantIds: ['user-asisten-01', 'user-asisten-02'],
    createdBy: 'user-asisten-01',
    createdAt: addDays(now, -4),
  },
  {
    id: 'session-03',
    classId: 'class-praktikum-jaringan-01',
    courseName: 'Praktikum Jaringan Komputer',
    groupName: 'Kelas 3SE3 - Kelompok C',
    title: 'Sesi 1: Konfigurasi Router',
    lab: 'Lab Jaringan · Ged B302',
    startsAt: addDays(now, 1),
    endsAt: addDays(now, 1),
    status: 'scheduled',
    openedAt: null,
    closedAt: null,
    participantIds: ['user-praktikan-03'],
    assistantIds: ['user-asisten-01', 'user-asisten-02'],
    createdBy: 'user-asisten-01',
    createdAt: addDays(now, -3),
  },
  {
    id: 'session-04',
    classId: 'class-praktikum-rpl-01',
    courseName: 'Praktikum Sistem Terdistribusi',
    groupName: 'Kelas 3SE1 - Kelompok A',
    title: 'Sesi 2: Client-Server Architecture',
    lab: 'Lab 3.2 RPL · Ged B',
    startsAt: addDays(now, 3),
    endsAt: addDays(now, 3),
    status: 'scheduled',
    openedAt: null,
    closedAt: null,
    participantIds: [
      'user-praktikan-01',
      'user-praktikan-02',
      'user-praktikan-03',
    ],
    assistantIds: ['user-asisten-01', 'user-asisten-02'],
    createdBy: 'user-asisten-01',
    createdAt: addDays(now, -4),
  },
];

// ============================================================
// Seed Function
// ============================================================

async function seed() {
  const batch = writeBatch(db);

  // Seed users
  for (const user of demoUsers) {
    const ref = doc(db, 'users', user.uid);
    batch.set(ref, user);
  }

  // Seed classes
  for (const cls of demoClasses) {
    const ref = doc(db, 'classes', cls.id);
    batch.set(ref, cls);
  }

  // Seed sessions
  for (const session of demoSessions) {
    const ref = doc(db, 'sessions', session.id);
    batch.set(ref, session);
  }

  await batch.commit();

  console.log('✅ Seeder selesai:');
  console.log(`   👥 ${demoUsers.length} user`);
  console.log(`   🏫 ${demoClasses.length} kelas`);
  console.log(`   📅 ${demoSessions.length} sesi`);
  console.log('');
  console.log('🔑 Akun demo:');
  console.log('   Praktikan: budi@kampus.ac.id');
  console.log('   Asisten: asisten.rpl@kampus.ac.id');
  console.log('   Asisten Koordinator: asisten.koordinator@kampus.ac.id');
}

seed().catch((err) => {
  console.error('❌ Seeder gagal:', err);
  process.exit(1);
});
