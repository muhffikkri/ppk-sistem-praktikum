/**
 * Helper presentasi waktu untuk alur asisten.
 * Data disimpan sebagai ISO 8601 UTC (lihat docs/shared-contract.md),
 * lalu ditampilkan dalam zona waktu lokal perangkat.
 */

const LOCALE = 'id-ID';

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/** Contoh: "Rabu, 21 Okt 2026" */
export function formatSessionDate(iso: string): string {
  const date = new Date(iso);
  try {
    return date.toLocaleDateString(LOCALE, {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  }
}

/** Contoh: "15.30" */
export function formatClock(iso: string): string {
  const date = new Date(iso);
  return `${pad(date.getHours())}.${pad(date.getMinutes())}`;
}

/** Contoh: "15.30 – 17.30" */
export function formatTimeRange(startsAt: string, endsAt: string): string {
  return `${formatClock(startsAt)} – ${formatClock(endsAt)}`;
}
