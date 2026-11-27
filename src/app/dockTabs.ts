/**
 * Halaman dock (Beranda, Jadwal, Presensi, Akun) hanya dirender oleh
 * `DockTabs`. Tidak ada route stack terpisah untuk halaman ini, sehingga
 * setiap jalur (tombol, notifikasi, deep link) berakhir di layar yang sama.
 */
export const DOCK_TABS = ['Home', 'Schedule', 'Attendance', 'Profile'] as const;

export type DockTabKey = (typeof DOCK_TABS)[number];

export function isDockTab(value: unknown): value is DockTabKey {
  return (DOCK_TABS as readonly unknown[]).includes(value);
}
