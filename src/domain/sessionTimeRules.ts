/**
 * sessionTimeRules.ts — Blok waktu sesi praktikum (#69).
 *
 * Sesi dimulai dan berakhir tepat di jam bulat, berada di antara 07.00 dan
 * 20.00 waktu perangkat, dan berdurasi 1–4 jam. Dipakai form sesi untuk
 * membatasi pilihan dan layanan sesi sebagai guard sebelum menyimpan.
 */

export const SESSION_FIRST_HOUR = 7;
export const SESSION_LAST_HOUR = 20;
export const SESSION_MIN_HOURS = 1;
export const SESSION_MAX_HOURS = 4;
export const SESSION_DEFAULT_HOURS = 2;

const HOUR_MS = 60 * 60 * 1000;

export type SessionTimeFailure =
  | 'invalid_time'
  | 'not_whole_hour'
  | 'different_day'
  | 'outside_hours'
  | 'too_short'
  | 'too_long';

export type SessionTimeResult =
  { ok: true } | { ok: false; reason: SessionTimeFailure; message: string };

const MESSAGES: Record<SessionTimeFailure, string> = {
  invalid_time: 'Waktu sesi tidak valid.',
  not_whole_hour:
    'Jam mulai dan selesai harus jam bulat, misalnya 08.00 atau 10.00.',
  different_day: 'Sesi harus dimulai dan selesai pada hari yang sama.',
  outside_hours: `Sesi hanya boleh berlangsung antara ${pad(SESSION_FIRST_HOUR)}.00 dan ${pad(SESSION_LAST_HOUR)}.00.`,
  too_short: `Durasi sesi minimal ${SESSION_MIN_HOURS} jam.`,
  too_long: `Durasi sesi maksimal ${SESSION_MAX_HOURS} jam.`,
};

function pad(hour: number): string {
  return hour.toString().padStart(2, '0');
}

function fail(reason: SessionTimeFailure): SessionTimeResult {
  return { ok: false, reason, message: MESSAGES[reason] };
}

function isWholeHour(date: Date): boolean {
  return (
    date.getMinutes() === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0
  );
}

/** Label pilihan jam, contoh `"08.00"`. */
export function formatHourLabel(hour: number): string {
  return `${pad(hour)}.00`;
}

/** Jam mulai yang masih menyisakan durasi minimal sebelum batas akhir. */
export function startHourOptions(): number[] {
  const hours: number[] = [];
  for (
    let hour = SESSION_FIRST_HOUR;
    hour <= SESSION_LAST_HOUR - SESSION_MIN_HOURS;
    hour += 1
  ) {
    hours.push(hour);
  }
  return hours;
}

/** Jam selesai yang sah untuk jam mulai tertentu. */
export function endHourOptions(startHour: number): number[] {
  const last = Math.min(startHour + SESSION_MAX_HOURS, SESSION_LAST_HOUR);
  const hours: number[] = [];
  for (let hour = startHour + SESSION_MIN_HOURS; hour <= last; hour += 1) {
    hours.push(hour);
  }
  return hours;
}

/** Jam selesai bawaan: durasi standar, dipotong ke batas akhir. */
export function defaultEndHour(startHour: number): number {
  return Math.min(startHour + SESSION_DEFAULT_HOURS, SESSION_LAST_HOUR);
}

/** Jam bulat dari waktu yang sudah tersimpan, atau `null` bila di luar blok. */
export function blockHourOf(
  date: Date,
  options: readonly number[],
): number | null {
  if (Number.isNaN(date.getTime()) || !isWholeHour(date)) return null;
  return options.includes(date.getHours()) ? date.getHours() : null;
}

export function validateSessionTimeBlock(
  startsAt: Date,
  endsAt: Date,
): SessionTimeResult {
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return fail('invalid_time');
  }
  if (!isWholeHour(startsAt) || !isWholeHour(endsAt)) {
    return fail('not_whole_hour');
  }

  const durationHours = (endsAt.getTime() - startsAt.getTime()) / HOUR_MS;
  if (durationHours < SESSION_MIN_HOURS) return fail('too_short');
  if (durationHours > SESSION_MAX_HOURS) return fail('too_long');

  if (startsAt.toDateString() !== endsAt.toDateString()) {
    return fail('different_day');
  }
  if (
    startsAt.getHours() < SESSION_FIRST_HOUR ||
    endsAt.getHours() > SESSION_LAST_HOUR
  ) {
    return fail('outside_hours');
  }
  return { ok: true };
}
