/**
 * Isi kode QR presensi yang ditampilkan asisten dan dipindai praktikan.
 *
 * QR membawa token berputar dari Cloud Function `{sessionId}.{slot}.{hmac}`.
 * Token diverifikasi server saat presensi; QR statis tidak lagi cukup.
 */

const PREFIX = 'ppk-presensi:v1:';
const SESSION_ID = /^[A-Za-z0-9_-]{1,128}$/;
const SLOT = /^\d{12,15}$/;
const SIGNATURE = /^[a-f0-9]{64}$/;

export type ParsedSessionQr = {
  sessionId: string;
  token: string;
};

export function encodeSessionQr(token: string): string {
  return `${PREFIX}${token}`;
}

/** Mengembalikan sessionId dan token bila `data` adalah QR presensi yang valid. */
export function parseSessionQr(data: string): ParsedSessionQr | null {
  const value = data.trim();
  if (!value.startsWith(PREFIX)) return null;
  const parts = value.slice(PREFIX.length).split('.');
  if (parts.length !== 3) return null;

  const [sessionId, slot, signature] = parts;
  if (
    !SESSION_ID.test(sessionId) ||
    !SLOT.test(slot) ||
    !SIGNATURE.test(signature)
  ) {
    return null;
  }
  return { sessionId, token: parts.join('.') };
}
