/**
 * Isi kode QR presensi yang ditampilkan asisten dan dipindai praktikan.
 *
 * QR hanya membawa ID sesi. Keabsahan presensi tetap dijaga di server:
 * sesi harus `open`, praktikan harus peserta, dan posisi harus di dalam
 * radius lab (lihat firestore.rules).
 */

const PREFIX = 'ppk-presensi:';
const SESSION_ID = /^[A-Za-z0-9_-]{1,128}$/;

export function encodeSessionQr(sessionId: string): string {
  return `${PREFIX}${sessionId}`;
}

/** Mengembalikan ID sesi bila `data` adalah QR presensi yang valid. */
export function parseSessionQr(data: string): string | null {
  const value = data.trim();
  if (!value.startsWith(PREFIX)) return null;
  const sessionId = value.slice(PREFIX.length);
  return SESSION_ID.test(sessionId) ? sessionId : null;
}
