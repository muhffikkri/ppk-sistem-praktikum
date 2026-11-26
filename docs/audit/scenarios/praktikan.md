# Audit Skenario — Praktikan (`student`)

## Ringkasan Role

- Tujuan utama: lihat jadwal, presensi saat sesi dibuka, ajukan izin, pantau riwayat/denda.
- Entry utama: `DockTabs` -> `Home` / `StudentSchedule` / `StudentAttendanceHistory` / `Profile`.
- FAB dock: scan presensi (`BarcodeScan`). Bukti: `src/app/AppNavigator.tsx`.

## Skenario 1 — Onboarding & Akses

| Step | Aksi user | Sistem | Temuan | Rekomendasi | Bukti |
|---|---|---|---|---|---|
| 1 | Buka app | Tampil `Landing` | CTA ganda Login/Register jelas | Keep | `src/features/auth/LandingScreen.tsx` |
| 2 | Login email/password | Validasi lokal + Firebase auth | Error field vs banner sudah dipisah | Keep, pastikan pesan konsisten | `src/features/auth/LoginScreen.tsx` |
| 3 | Login Google | `loginWithGoogle`, jika profil belum ada -> `needsRoleSelection` | User bisa masuk auth tapi belum punya profil role | Keep, tapi perjelas state "akun belum lengkap" | `src/state/AuthContext.tsx` |
| 4 | Pilih role | `RoleSelection` hanya student/assistant | Opsi terbatas sesuai produk saat ini; "Daftar dengan email" di layar ini membingungkan untuk user Google yang baru login | Cut/ubah "Daftar dengan email" jadi "Gunakan akun lain" atau sembunyikan saat `needsRoleSelection` | `src/features/auth/RoleSelectionScreen.tsx` |
| 5 | Masuk app | Provider student attendance aktif | Cocok | Keep | `src/app/AppNavigator.tsx` |

**Potong/sederhanakan:** Hilangkan cabang registrasi dari `RoleSelection` ketika konteksnya pemilihan role pasca-login.

## Skenario 2 — Lihat Jadwal & Detail Sesi

| Step | Aksi user | Sistem | Temuan | Rekomendasi | Bukti |
|---|---|---|---|---|---|
| 1 | Buka Beranda | Hero sesi hari ini/berikutnya + list hari ini + mendatang + pintasan | Banyak blok; informasi sesi bisa muncul berulang | Refine: satu hero + satu list "Hari ini/Mendatang" + pintasan kontekstual | `src/features/student/StudentHome.tsx` |
| 2 | Tap "Lihat semua" | Ke `StudentSchedule` | Dua CTA "Lihat semua" ke tujuan sama (hari ini & mendatang) | Merge jadi satu CTA | `src/features/student/StudentHome.tsx` |
| 3 | Buka Kalender | Week strip + preview sheet | Preview sheet bagus untuk mengurangi navigasi | Keep | `src/features/calendar/CalendarScreen.tsx` |
| 4 | Buka detail sesi | Info sesi + status + aksi presensi/izin | Aksi izin selalu tampil, termasuk sudah hadir/sesi tidak relevan | Refine aturan tampil aksi | `src/features/student/StudentSessionDetailScreen.tsx` |
| 5 | Buka dari notifikasi | Deep-ish route via `notificationRoute` | Bagus; perlu pastikan route tujuan masih valid | Keep, tambah regression check | `src/app/NotificationsScreen.tsx`, `src/domain/notificationTypes.ts` |

**Potong/sederhanakan:**
- "Ajukan Izin Ketidakhadiran": sembunyikan jika `attendance` sudah ada, atau ubah jadi informasi "Sudah hadir, izin tidak diperlukan". 
- Pertimbangkan sembunyikan/disable izin untuk sesi `closed` kecuali kebijakan produk mengizinkan izin retroaktif.

## Skenario 3 — Presensi (Scan QR + Geofence)

| Step | Aksi user | Sistem | Temuan | Rekomendasi | Bukti |
|---|---|---|---|---|---|
| 1 | Tap FAB kamera | Buka `BarcodeScan` | Jalur cepat jelas | Keep | `src/app/AppNavigator.tsx` |
| 2 | Scan QR | Parse session QR, `replace` ke `StudentCheckIn` | `replace` tepat, mencegah back ke kamera | Keep | `src/features/checkin/BarcodeScanScreen.tsx` |
| 3 | Lihat layar presensi | Detail sesi + status geofence + tombol presensi | Info sesi mengulang detail sesi; user sudah "intent presensi" | Refine: ringkas detail, fokus status lokasi & CTA | `src/features/checkin/StudentCheckInScreen.tsx` |
| 4 | Periksa lokasi | Manual refresh lokasi/geofence | Berguna saat GPS lambat, tapi jadi step ekstra | Keep sebagai fallback; auto-check saat masuk layar jika belum ada | `src/features/checkin/StudentCheckInScreen.tsx` |
| 5 | Konfirmasi presensi | ConfirmSheet lalu submit | Konfirmasi penting karena aksi tercatat | Keep | `src/features/checkin/StudentCheckInScreen.tsx` |
| 6 | Sukses | Banner sukses, tombol disabled | Jelas | Keep; tambah CTA "Kembali ke Beranda/Riwayat" opsional | `src/features/checkin/StudentCheckInScreen.tsx` |

**Potong/sederhanakan:**
- Hindari memaksa user membuka `StudentSessionDetail` dulu hanya untuk presensi; FAB scan sudah baik.
- Evaluasi gabung "Scan + status lokasi" dalam satu flow yang terasa satu tugas, bukan dua layar penuh dengan header besar.

## Skenario 4 — Ajukan Izin

| Step | Aksi user | Sistem | Temuan | Rekomendasi | Bukti |
|---|---|---|---|---|---|
| 1 | Dari detail sesi / list izin | Buka form izin | Entry point ada, tapi dari detail sesi tidak memfilter state hadir | Refine entry point | `src/features/student/StudentSessionDetailScreen.tsx`, `src/features/leave/StudentLeaveListScreen.tsx` |
| 2 | Isi alasan | Hitung panjang minimal 5 | Validasi jelas | Keep | `src/features/leave/StudentLeaveRequestFormScreen.tsx` |
| 3 | Pratinjau AI | Tombol terpisah `Pratinjau klasifikasi AI` | Berguna untuk transparansi, tapi menambah step sebelum submit | Refine: jadikan opsional sekunder atau auto-preview debounce | `src/features/leave/StudentLeaveRequestFormScreen.tsx` |
| 4 | Kirim pengajuan | Submit, tampil banner sukses, tombol "Lihat pengajuan saya" | Setelah sukses form masih terlihat; user bisa bingung apakah bisa kirim lagi | Refine: setelah sukses, fokus ke status/result card dan CTA ke daftar/detail | `src/features/leave/StudentLeaveRequestFormScreen.tsx` |
| 5 | Cek daftar izin | `StudentLeaveList` | Perlu pastikan status, alasan, catatan asisten, dan next action jelas | Audit detail komponen list | `src/features/leave/StudentLeaveListScreen.tsx` |

**Potong/sederhanakan:**
- Jangan tampilkan form submit aktif jika pengajuan existing non-rejected; saat ini sudah ada banner duplicate, tapi CTA submit/preview masih area form — pastikan disabled state benar-benar mencegah aksi.
- "Pratinjau klasifikasi AI" bisa dipindah ke bawah sebagai opsi lanjutan; submit tetap aksi primer.

## Skenario 5 — Riwayat, Denda, Pembayaran

| Step | Aksi user | Sistem | Temuan | Rekomendasi | Bukti |
|---|---|---|---|---|---|
| 1 | Buka Riwayat Presensi | Daftar riwayat | Route ada di tab dan shortcut | Keep satu jalur utama | `src/features/student/StudentAttendanceHistoryScreen.tsx` |
| 2 | Buka Tagihan Denda | Daftar denda | Pintasan selalu tampil di Home | Refine: tampilkan badge/count bila ada denda unpaid | `src/features/student/StudentHome.tsx` |
| 3 | Buka Detail Denda | Detail + riwayat pembayaran | Aksi bayar perlu jelas statusnya | Audit action state | `src/features/fines/StudentFineDetailScreen.tsx` |
| 4 | Buka Riwayat Pembayaran | Daftar transaksi | Bisa diakses dari Home dan detail denda | Keep, tapi hindari duplikasi navigasi berlebihan | `src/features/fines/StudentPaymentHistoryScreen.tsx` |

## Skenario 6 — Peta, Notifikasi, Profil

| Area | Temuan | Rekomendasi | Bukti |
|---|---|---|---|
| Peta Lab | Berguna untuk konteks lokasi; ada tombol back, refresh, center user/campus | Keep; pastikan label/empty state saat tidak ada lab | `src/features/maps/LabMapsScreen.tsx` |
| Notifikasi | Mark read saat dibuka, mark all read tersedia | Keep; pastikan route notifikasi mencakup semua tipe penting | `src/app/NotificationsScreen.tsx` |
| Profil | Menu profil menduplikasi banyak tujuan tab/shortcut | Refine: profil fokus ke identitas, edit profil, logout, pengaturan; tautan operasional sekunder | `src/app/ProfileScreen.tsx` |

## Backlog Usulan (Praktikan)

| ID | Usulan | Jenis | Prioritas |
|---|---|---|---|
| STU-01 | Sembunyikan/ubah aksi izin saat sudah hadir atau status sesi tidak mendukung | Cut/Refine | P1 |
| STU-02 | Satukan CTA "Lihat semua" di Home praktikan | Merge | P2 |
| STU-03 | Ringkas layar check-in: fokus geofence, pindahkan detail sesi ke collapsible | Refine | P1 |
| STU-04 | Setelah submit izin sukses, ganti form dengan status + next action | Refine | P2 |
| STU-05 | Tampilkan pintasan denda/pembayaran secara kontekstual (badge/count) | Refine | P3 |
| STU-06 | Sederhanakan menu profil agar tidak duplikat dock/home | Refine | P2 |