/**
 * asprakScope.ts — Logika domain pembatasan roster dan kewenangan Asprak (SRS-4.07).
 *
 * Sesuai PRD Sprint 4:
 * - Asprak (`role === 'assistant'`) hanya melihat kelas, jadwal, dan sesi yang ditugaskan kepadanya (`assistantIds`).
 * - Konfigurasi master lab dan distribusi peserta merupakan wewenang eksklusif Aslab (`role === 'lab_assistant'`).
 */

import type { PracticalClass, Session, UserRole } from './types';

/**
 * Memeriksa apakah suatu sesi praktikum ditugaskan kepada Asprak tertentu.
 */
export function isSessionAssignedToAsprak(
  session: Pick<Session, 'assistantIds'> | null | undefined,
  asprakUid: string,
): boolean {
  if (!session || !asprakUid) return false;
  const ids = Array.isArray(session.assistantIds) ? session.assistantIds : [];
  return ids.includes(asprakUid);
}

/**
 * Memeriksa apakah suatu kelas praktikum ditugaskan kepada Asprak tertentu.
 */
export function isClassAssignedToAsprak(
  classObj: Pick<PracticalClass, 'assistantIds'> | null | undefined,
  asprakUid: string,
): boolean {
  if (!classObj || !asprakUid) return false;
  const ids = Array.isArray(classObj.assistantIds) ? classObj.assistantIds : [];
  return ids.includes(asprakUid);
}

/**
 * Menyaring daftar sesi agar hanya memuat sesi yang ditugaskan kepada Asprak tertentu.
 */
export function filterAssignedSessions(
  sessions: Session[],
  asprakUid: string,
): Session[] {
  if (!Array.isArray(sessions) || !asprakUid) return [];
  return sessions.filter((s) => isSessionAssignedToAsprak(s, asprakUid));
}

/**
 * Menyaring daftar kelas agar hanya memuat kelas yang ditugaskan kepada Asprak tertentu.
 */
export function filterAssignedClasses(
  classes: PracticalClass[],
  asprakUid: string,
): PracticalClass[] {
  if (!Array.isArray(classes) || !asprakUid) return [];
  return classes.filter((c) => isClassAssignedToAsprak(c, asprakUid));
}

/**
 * Memeriksa apakah role memiliki kewenangan mengelola master laboratorium.
 * Sesuai SRS-4.07: Hanya Aslab (`lab_assistant`) yang berwenang, Asprak (`assistant`) tidak berwenang.
 */
export function canManageLabMaster(
  role: UserRole | string | null | undefined,
): boolean {
  return role === 'lab_assistant';
}

/**
 * Memeriksa apakah role memiliki kewenangan mendistribusikan praktikan/asprak ke lab.
 * Sesuai SRS-4.07: Hanya Aslab (`lab_assistant`) yang berwenang, Asprak (`assistant`) tidak berwenang.
 */
export function canDistributeParticipants(
  role: UserRole | string | null | undefined,
): boolean {
  return role === 'lab_assistant';
}
