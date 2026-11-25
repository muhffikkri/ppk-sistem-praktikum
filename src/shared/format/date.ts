/**
 * Shared date/time presentation helpers. Data is stored as ISO 8601 UTC and
 * shown in the device's local time zone.
 *
 * Each pattern uses one module-level Intl.DateTimeFormat. Creating a
 * formatter (which `toLocaleDateString` and friends do on every call) is
 * slow on Hermes, and these run once per list row.
 */

const LOCALE = 'id-ID';

type Format = (date: Date) => string;

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function numericDate(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** Lazily build one formatter; fall back when Intl or the locale fails. */
function cachedFormat(
  options: Intl.DateTimeFormatOptions,
  fallback: Format,
): Format {
  let formatter: Intl.DateTimeFormat | null | undefined;
  return (date) => {
    if (formatter === undefined) {
      try {
        formatter = new Intl.DateTimeFormat(LOCALE, options);
      } catch {
        formatter = null;
      }
    }
    if (!formatter) return fallback(date);
    try {
      return formatter.format(date);
    } catch {
      return fallback(date);
    }
  };
}

const sessionDate = cachedFormat(
  { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' },
  numericDate,
);

const weekdayDayMonth = cachedFormat(
  { weekday: 'long', day: 'numeric', month: 'long' },
  numericDate,
);

const hourMinute = cachedFormat(
  { hour: '2-digit', minute: '2-digit', hour12: false },
  (date) => `${pad(date.getHours())}.${pad(date.getMinutes())}`,
);

// Same fields as `Date#toLocaleString()` with no options.
const dateTime = cachedFormat(
  {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  },
  (date) =>
    `${numericDate(date)}, ${pad(date.getHours())}.${pad(date.getMinutes())}.${pad(date.getSeconds())}`,
);

/** Contoh: "Rabu, 21 Okt 2026" */
export function formatSessionDate(iso: string): string {
  return sessionDate(new Date(iso));
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

/** Contoh: "Rabu, 25 November" */
export function formatWeekdayDayMonth(date: Date): string {
  return weekdayDayMonth(date);
}

/** Contoh: "15.05" (Intl, 24 jam) */
export function formatHourMinute(date: Date): string {
  return hourMinute(date);
}

/** Contoh: "25/11/2026, 15.05.09" — sama dengan `toLocaleString('id-ID')`. */
export function formatDateTime(date: Date): string {
  return dateTime(date);
}
