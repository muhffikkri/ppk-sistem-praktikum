/** NIM dipakai sebagai identitas praktikan di roster asisten. */
export const NIM_INVALID = 'NIM harus 6–20 karakter huruf atau angka.';

export function normalizeNim(raw: string): string | null {
  const nim = raw.trim().toUpperCase();
  return /^[A-Z0-9]{6,20}$/.test(nim) ? nim : null;
}
