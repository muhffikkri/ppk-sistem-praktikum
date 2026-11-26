# Audit User Flow & Halaman

Audit ini memetakan flow tiap role, aksi yang bisa dipangkas/disederhanakan, dan checklist audit per halaman.

## Scope

- Aplikasi: Expo React Native (`ppk-mobile`)
- Sumber utama: `src/app/AppNavigator.tsx`, `src/app/navigation.ts`, `src/domain/types.ts`, `src/state/AuthContext.tsx`, `src/features/**`
- Role domain: `student` (Praktikan), `assistant` (Asprak), `lab_assistant` (Aslab) — `src/domain/types.ts`
- Role UI/runtime: Asprak dan Aslab diperlakukan sebagai aktor `asisten` (`isAssistantRole`), dengan hak tambahan Aslab untuk master lab (`canManageLabMaster`) — `src/domain/asprakScope.ts`, `src/state/AuthContext.tsx`

## Cara Pakai

1. Baca audit skenario role:
   - [Praktikan](./scenarios/praktikan.md)
   - [Asprak](./scenarios/asprak.md)
   - [Aslab](./scenarios/aslab.md)
2. Gunakan [Page Audit](./page-audit.md) saat review per layar/route.
3. Tandai temuan dengan status: `keep`, `cut`, `refine`, `merge`, `blocker`.
4. Saat implementasi, update dokumen ini agar audit tetap jadi sumber kebenaran.

## Peta Navigasi Ringkas

| Area | Praktikan | Asisten/Aslab |
|---|---|---|
| Auth | Landing -> Login/Register -> RoleSelection (khusus kebutuhan role) -> Dock | Sama |
| Dock tab | Home, Jadwal (`StudentSchedule`), Presensi (`StudentAttendanceHistory`), Akun (`Profile`) | Home, Jadwal (`AssistantSchedule`), Presensi (`AssistantAllAttendance`), Akun (`Profile`) |
| FAB dock | Scan presensi -> `BarcodeScan` | Tidak ada FAB |
| Aksi utama | Scan QR -> Check-in geofence -> Riwayat; Ajukan izin; Lihat denda/pembayaran | Kelola kelas/sesi; Buka/tutup sesi; Tampilkan QR; Rekap presensi; Review izin; Aslab: kelola lab |

## Pembaruan

- **2026-11-26 (refresh)**: Dicek ulang terhadap kode saat ini. Update mencakup: guard izin/presensi di `StudentSessionDetail`, redesign `ErrorState`, `useTransientFeedback`, penghapusan icon settings hero Asisten, dan restrukturisasi CTA Home Praktikan. Temuan yang belum berubah tetap ditandai `Open`.

## Temuan Prioritas (Ringkas)

| Prioritas | Temuan | Status | Dampak | Bukti |
|---|---|---|---|---|
| P1 | Aksi izin di detail sesi praktikan sebelumnya selalu tampil | **Partial** | Tombol izin kini disabled dengan label kontekstual saat sudah hadir/sudah izin, tapi masih menempati area aksi; evaluasi apakah perlu disembunyikan penuh | `src/features/student/StudentSessionDetailScreen.tsx` |
| P1 | Route legacy/duplikat masih terdaftar di stack meski tab utama sudah di DockTabs | **Open** | Permukaan navigasi besar, sulit audit, potensi flow mati/inkonsisten | `src/app/AppNavigator.tsx` |
| P1 | RoleSelection menampilkan "Daftar dengan email" saat user sudah authenticated tapi belum punya role | **Open** | Flow membingungkan; bisa membuat akun/role state tidak jelas | `src/features/auth/RoleSelectionScreen.tsx`, `src/state/AuthContext.tsx` |
| P1 | Guard role untuk layar/form master lab masih perlu diaudit end-to-end | **Open** | Non-aslab berpotensi mencapai jalur yang seharusnya dibatasi; SessionForm masih punya navigasi ke LabForm | `src/features/assistant/AssistantSessionFormScreen.tsx`, `src/app/AppNavigator.tsx` |
| P2 | Pintasan Home/Profil menumpuk dengan tab dan route lain | **Open** | Banyak jalan ke tujuan sama; user harus memilih tanpa perbedaan jelas | `src/features/student/StudentHome.tsx`, `src/features/assistant/AssistantHome.tsx`, `src/app/ProfileScreen.tsx` |
| P2 | Check-in punya dua layar berurutan (scan QR lalu layar presensi lokasi) dengan info sesi berulang | **Open** | Friksi presensi tinggi; pengguna memindai lalu mengonfirmasi lagi | `src/features/checkin/BarcodeScanScreen.tsx`, `src/features/checkin/StudentCheckInScreen.tsx` |
| P2 | RoleSelection hanya menawarkan student/assistant; lab_assistant tidak bisa dipilih mandiri | **Open (product decision)** | Aslab bergantung provisioning manual; perlu jelas di produk/ops | `src/features/auth/RoleSelectionScreen.tsx`, `src/domain/types.ts` |
| P2 | Error/empty state dan feedback banner | **Improved** | `ErrorState` kini full-page informatif; `useTransientFeedback`/`DockTabActiveProvider` membersihkan feedback saat blur/tab change/timeout, tapi perlu verifikasi semua banner transient memakai pola ini | `src/shared/ui/ErrorState.tsx`, `src/shared/navigation/useTransientFeedback.tsx`, `src/app/AppNavigator.tsx` |
| P2 | Hitbox/shadow/radius | **Improved** | Card sudah pakai `androidClip` untuk menghindari shadow iOS terpotong; hero Asisten sudah tidak pakai icon settings kecil, tapi container hero belum tentu jadi affordance buka detail | `src/shared/ui/Card.tsx`, `src/features/assistant/AssistantHome.tsx` |

## Kriteria "Aksi Tidak Perlu"

- Tidak mengubah status/data penting.
- Tidak membantu user mengambil keputusan berikutnya.
- Duplikat dengan jalur navigasi yang lebih jelas.
- Muncul pada state yang tidak valid (mis. sudah hadir, sesi ditutup, role tidak berhak).
- Memaksa user melewati layar/konfirmasi tanpa nilai tambah.

## Catatan Audit

- Audit ini berbasis inspeksi kode statis, bukan usability test/device run.
- Temuan "cut/refine" harus divalidasi dengan kebutuhan produk dan SRS sebelum implementasi.
- Beberapa route mungkin masih dipakai oleh deep link/notifikasi; cek `notificationRoute` dan panggilan `navigate` sebelum menghapus route.