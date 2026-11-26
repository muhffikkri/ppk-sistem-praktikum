const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const dateFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

/** "Baru saja", "5 mnt lalu", "3 jam lalu", lalu tanggal untuk yang lebih lama. */
export function formatNotificationTime(iso: string, now = new Date()): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return '';
  const diff = now.getTime() - time;
  if (diff < MINUTE) return 'Baru saja';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} mnt lalu`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} jam lalu`;
  return dateFormat.format(new Date(time));
}
