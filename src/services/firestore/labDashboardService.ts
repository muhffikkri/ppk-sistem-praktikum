/**
 * Listener baca dashboard Aslab (SRS-4.12, SRS-4.13).
 *
 * Semua query dibatasi `managedCourseIds` agar data mata kuliah lain tidak
 * pernah diminta. Daftar mata kuliah dipecah per 30 nilai (batas filter `in`)
 * dan hasil tiap potongan digabung sebelum dikirim ke pemanggil.
 */
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
  type Query,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';

import type { Lab } from '../../domain/geoTypes';
import type { PracticalClass, Session } from '../../domain/types';
import { db } from '../firebase';
import { chunkIds } from './batching';
import { normalizeLab } from './labService';

type Listener<T> = {
  onData: (items: T[]) => void;
  onError: (message: string) => void;
};

function errorMessage(e: unknown, fallback: string): string {
  const code =
    typeof e === 'object' && e !== null && 'code' in e
      ? String((e as { code?: unknown }).code)
      : '';
  if (code === 'permission-denied') {
    return 'Akses ditolak. Pastikan akun Aslab sudah ditugaskan ke mata kuliah.';
  }
  if (code === 'unavailable') return 'Koneksi bermasalah. Coba lagi.';
  return fallback;
}

/**
 * Satu listener per potongan mata kuliah. Data baru dikirim setelah semua
 * potongan menerima snapshot pertama, sehingga layar tidak menampilkan angka
 * parsial.
 */
function subscribeByCourse<T>(
  courseIds: readonly string[],
  buildQuery: (chunk: string[]) => Query<DocumentData>,
  toItem: (doc: QueryDocumentSnapshot<DocumentData>) => T,
  { onData, onError }: Listener<T>,
  fallbackError: string,
): Unsubscribe {
  const chunks = chunkIds(courseIds);
  if (chunks.length === 0) {
    onData([]);
    return () => {};
  }

  const results: (T[] | undefined)[] = chunks.map(() => undefined);
  const emit = () => {
    if (results.some((items) => items === undefined)) return;
    onData((results as T[][]).flat());
  };

  const unsubscribers = chunks.map((chunk, index) =>
    onSnapshot(
      buildQuery(chunk),
      (snap) => {
        results[index] = snap.docs.map(toItem);
        emit();
      },
      (e) => onError(errorMessage(e, fallbackError)),
    ),
  );
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

const toSession = (d: QueryDocumentSnapshot<DocumentData>) =>
  ({ id: d.id, ...d.data() }) as Session;

const toClass = (d: QueryDocumentSnapshot<DocumentData>) =>
  ({ id: d.id, ...d.data() }) as PracticalClass;

export function subscribeLabsForCourses(
  courseIds: readonly string[],
  listener: Listener<Lab>,
): Unsubscribe {
  return subscribeByCourse(
    courseIds,
    (chunk) => query(collection(db, 'labs'), where('courseId', 'in', chunk)),
    (d) => normalizeLab(d.id, d.data()),
    listener,
    'Gagal memuat laboratorium.',
  );
}

export function subscribeClassesForCourses(
  courseIds: readonly string[],
  listener: Listener<PracticalClass>,
): Unsubscribe {
  return subscribeByCourse(
    courseIds,
    (chunk) =>
      query(collection(db, 'classes'), where('courseCode', 'in', chunk)),
    toClass,
    listener,
    'Gagal memuat kelas.',
  );
}

/** Sesi mata kuliah terkelola yang dimulai dalam `[fromIso, toIso)`. */
export function subscribeSessionsForCourses(
  courseIds: readonly string[],
  fromIso: string,
  toIso: string,
  listener: Listener<Session>,
): Unsubscribe {
  return subscribeByCourse(
    courseIds,
    (chunk) =>
      query(
        collection(db, 'sessions'),
        where('courseCode', 'in', chunk),
        where('startsAt', '>=', fromIso),
        where('startsAt', '<', toIso),
        orderBy('startsAt', 'asc'),
      ),
    toSession,
    listener,
    'Gagal memuat sesi praktikum.',
  );
}
