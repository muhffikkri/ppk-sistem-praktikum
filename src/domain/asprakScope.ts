/**
 * asprakScope.ts — Logika domain kewenangan Asprak/Aslab (SRS-4.07).
 *
 * Konfigurasi master lab dan distribusi peserta merupakan wewenang Aslab
 * (`role === 'lab_assistant'`). Hak akses layar asisten dimiliki oleh Asprak
 * maupun Aslab.
 */

import type { UserRole } from './types';

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
 * Predikat tunggal untuk hak akses asisten: Asprak atau Aslab.
 */
export function isAssistantRole(
  role: UserRole | string | null | undefined,
): boolean {
  return role === 'assistant' || role === 'lab_assistant';
}
