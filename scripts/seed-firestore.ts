/**
 * Firestore Seeder — PPK Mobile
 *
 * Mengisi Firestore dengan data demo (user, kelas, lab, sesi) memakai
 * Firebase Admin SDK, sehingga tidak terhalang Firestore rules.
 *
 * Usage:
 *   npm run seed                 # tulis ke Firestore
 *   npm run seed -- --dry-run    # cek data tanpa menulis
 *
 * Kebutuhan (.env atau environment):
 *   EXPO_PUBLIC_FIREBASE_PROJECT_ID   ID project Firebase
 *   GOOGLE_APPLICATION_CREDENTIALS    path file service account (JSON).
 *                                     Tidak perlu bila memakai emulator
 *                                     (FIRESTORE_EMULATOR_HOST).
 *   SEED_DEMO_PASSWORD                (opsional) password akun demo. Bila
 *                                     diisi, akun Firebase Auth dibuat/
 *                                     diperbarui agar bisa dipakai login.
 */

import { existsSync } from 'node:fs';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { PracticalClass, Session, UserProfile } from '../src/domain/types';
import { DEFAULT_CAMPUS_LABS, type Lab } from '../src/domain/geoTypes';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const dryRun = process.argv.includes('--dry-run');
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '';
const usingEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const demoPassword = process.env.SEED_DEMO_PASSWORD ?? '';

if (!projectId) {
  console.error(
    '❌ EXPO_PUBLIC_FIREBASE_PROJECT_ID belum diisi. Salin .env.example menjadi .env.',
  );
  process.exit(1);
}

if (!dryRun && !usingEmulator && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    '❌ GOOGLE_APPLICATION_CREDENTIALS belum diisi. Unduh service account dari Firebase Console → Project settings → Service accounts → Generate new private key, simpan di luar repo atau sebagai service-account.json (sudah di-gitignore), lalu isi path-nya di .env.',
  );
  process.exit(1);
}

if (demoPassword && demoPassword.length < 6) {
  console.error('❌ SEED_DEMO_PASSWORD minimal 6 karakter.');
  process.exit(1);
}

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
  {
    uid: 'user-aslab-01',
    displayName: 'Aslab Informatika',
    email: 'aslab@kampus.ac.id',
    role: 'lab_assistant',
    managedCourseIds: ['IF3121', 'IF3122'],
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
// Demo Labs (acuan geofence presensi & peta, Sprint 3)
// ============================================================

const seededAt = new Date().toISOString();

/** Mata kuliah pengampu tiap lab demo, dipakai cakupan Aslab. */
const LAB_COURSE: Record<string, string> = {
  'lab-rpl-32': 'IF3121',
  'lab-rpl-31': 'IF3121',
  'lab-database': 'IF3122',
  'lab-ai': 'IF3122',
  'lab-jaringan': 'IF3123',
  'lab-sensor': 'IF3123',
};

const demoLabs: Lab[] = DEFAULT_CAMPUS_LABS.map((lab) => ({
  id: lab.id,
  name: lab.name,
  building: lab.building,
  description: lab.description ?? null,
  courseId: LAB_COURSE[lab.id] ?? null,
  courseCode: LAB_COURSE[lab.id] ?? null,
  location: {
    latitude: lab.coordinates.latitude,
    longitude: lab.coordinates.longitude,
  },
  radiusMeters: lab.radiusMeters,
  isActive: lab.isActive ?? true,
  createdBy: 'user-asisten-02',
  createdAt: seededAt,
  updatedAt: seededAt,
}));

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
    labId: 'lab-rpl-32',
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
    labId: 'lab-database',
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
    labId: 'lab-jaringan',
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
    labId: 'lab-rpl-32',
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

async function seedAuthAccounts() {
  const auth = getAuth();
  for (const user of demoUsers) {
    try {
      const existing = await auth.getUserByEmail(user.email);
      if (existing.uid !== user.uid) {
        console.warn(
          `   ⚠️  ${user.email} sudah terdaftar dengan uid lain (${existing.uid}); akun Auth dilewati.`,
        );
        continue;
      }
      await auth.updateUser(user.uid, {
        password: demoPassword,
        displayName: user.displayName,
      });
    } catch (err) {
      if ((err as { code?: string }).code !== 'auth/user-not-found') throw err;
      await auth.createUser({
        uid: user.uid,
        email: user.email,
        password: demoPassword,
        displayName: user.displayName,
      });
    }
  }
}

async function seed() {
  console.log(
    `${dryRun ? '🔎 Dry run' : '🌱 Seeding'} ke project ${projectId}${usingEmulator ? ' (emulator)' : ''}`,
  );

  const labIds = new Set(demoLabs.map((lab) => lab.id));
  const unlinked = demoSessions.filter(
    (session) => !session.labId || !labIds.has(session.labId),
  );
  if (unlinked.length > 0) {
    throw new Error(
      `Sesi tanpa lab yang valid: ${unlinked.map((s) => s.id).join(', ')}`,
    );
  }

  if (!dryRun) {
    initializeApp({
      projectId,
      ...(usingEmulator ? {} : { credential: applicationDefault() }),
    });
    const db = getFirestore();
    const batch = db.batch();

    for (const user of demoUsers) {
      batch.set(db.collection('users').doc(user.uid), user);
    }
    for (const cls of demoClasses) {
      batch.set(db.collection('classes').doc(cls.id), cls);
    }
    for (const lab of demoLabs) {
      batch.set(db.collection('labs').doc(lab.id), lab);
    }
    const courseCodeByClass = new Map(
      demoClasses.map((cls) => [cls.id, cls.courseCode]),
    );
    for (const session of demoSessions) {
      batch.set(db.collection('sessions').doc(session.id), {
        ...session,
        courseCode: courseCodeByClass.get(session.classId ?? '') ?? '',
      });
    }

    await batch.commit();

    if (
      demoPassword &&
      usingEmulator &&
      !process.env.FIREBASE_AUTH_EMULATOR_HOST
    ) {
      console.warn(
        '⚠️  Auth emulator tidak aktif; akun demo tidak dibuat agar tidak menyentuh Firebase Auth asli.',
      );
    } else if (demoPassword) {
      await seedAuthAccounts();
    }
  }

  console.log(`✅ ${dryRun ? 'Data valid' : 'Seeder selesai'}:`);
  console.log(`   👥 ${demoUsers.length} user`);
  console.log(`   🏫 ${demoClasses.length} kelas`);
  console.log(`   📍 ${demoLabs.length} lab`);
  console.log(`   📅 ${demoSessions.length} sesi`);
  console.log('');
  if (demoPassword) {
    console.log('🔑 Akun demo (password = SEED_DEMO_PASSWORD):');
    for (const user of demoUsers) {
      console.log(
        `   ${user.role === 'assistant' ? 'Asisten' : 'Praktikan'}: ${user.email}`,
      );
    }
  } else {
    console.log(
      'ℹ️  Akun login tidak dibuat. Isi SEED_DEMO_PASSWORD untuk membuat akun demo di Firebase Auth.',
    );
  }
}

seed().catch((err) => {
  console.error('❌ Seeder gagal:', err);
  process.exit(1);
});
