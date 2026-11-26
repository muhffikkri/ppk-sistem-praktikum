# Audit Per Halaman

Gunakan dokumen ini untuk review cepat tiap layar. Status: `keep`, `cut`, `refine`, `merge`, `blocker`.

**Pembaruan 2026-11-26:** diperbarui setelah merge fix `#49/#50/#51`. Cek kolom Temuan/Rekomendasi untuk status terkini.

## Cara Audit

- Cek **tujuan halaman**: satu halaman = satu tugas utama.
- Cek **entry point**: apakah terlalu banyak jalan menuju halaman yang sama?
- Cek **aksi utama**: maksimal 1 CTA primer per konteks.
- Cek **state**: loading, empty, error, success, no-permission, data stale.
- Cek **role guard**: route tidak boleh bisa diakses role yang tidak berhak.
- Cek **biaya kognitif**: info/aksi yang tidak perlu di state saat ini harus disembunyikan.

## Ringkasan Route

| Route | File | Role | Tujuan utama | Aksi utama | Temuan | Rekomendasi | Status |
|---|---|---|---|---|---|---|---|
| `Landing` | `src/features/auth/LandingScreen.tsx` | Public | Masuk/daftar | Login, Register | - | Pastikan CTA sekunder tidak mengganggu |  |
| `Login` | `src/features/auth/LoginScreen.tsx` | Public | Autentikasi | Masuk | Google login + email/password; link daftar | Keep; cek error copy Firebase |  |
| `Register` | `src/features/auth/RegisterScreen.tsx` | Public | Buat akun | Buat akun | Role Aslab tidak tersedia | Produk: by design/provisioning? |  |
| `RoleSelection` | `src/features/auth/RoleSelectionScreen.tsx` | Auth butuh role | Pilih role | Lanjutkan | Ada "Daftar dengan email" di konteks pasca-login Google | Cut/ubah CTA sesuai konteks |  |
| `DockTabs/Home` | `src/app/HomeScreen.tsx`, `src/features/student/StudentHome.tsx`, `src/features/assistant/AssistantHome.tsx` | Semua auth | Ringkasan & next action | Buka sesi aktif / aksi role | **Update:** icon settings kecil di hero Asisten sudah dihapus, tapi hero card belum jelas sebagai affordance buka detail; pintasan duplikat masih ada | Jadikan hero pressable bila sesuai, dan kurangi pintasan duplikat |  |
| `StudentSchedule` | `src/features/student/StudentScheduleScreen.tsx` | Student | Lihat jadwal | Buka detail sesi | - | Pastikan filter/status jelas |  |
| `StudentSessionDetail` | `src/features/student/StudentSessionDetailScreen.tsx` | Student | Detail sesi + next action | Presensi jika open | **Update:** izin/presensi sudah punya guard state & label kontekstual; tombol masih tampil sebagai disabled | Opsional ringkas dengan menyembunyikan aksi yang tidak relevan |  |
| `StudentCheckIn` | `src/features/checkin/StudentCheckInScreen.tsx` | Student | Presensi geofence | Presensi Sekarang | Info sesi berulang; manual cek lokasi | Ringkas; auto-check lokasi saat masuk |  |
| `BarcodeScan` | `src/features/checkin/BarcodeScanScreen.tsx` | Student | Scan QR sesi | Scan otomatis | Bagus pakai `replace` | Keep; tambahkan fallback input kode jika kamera gagal |  |
| `StudentAttendanceHistory` | `src/features/student/StudentAttendanceHistoryScreen.tsx` | Student | Riwayat hadir | Lihat riwayat | - | Pastikan empty state actionable |  |
| `StudentAllSessions` | `src/features/student/StudentAllSessionsScreen.tsx` | Student | Semua sesi | Buka detail | Kemungkinan overlap dengan Schedule | Merge/hide jika tidak punya nilai beda |  |
| `StudentAllAttendance` | `src/features/student/StudentAllAttendanceScreen.tsx` | Student | Semua presensi | Buka detail | Overlap dengan history | Merge/hide |  |
| `StudentLeaveRequestForm` | `src/features/leave/StudentLeaveRequestFormScreen.tsx` | Student | Ajukan izin | Kirim pengajuan | Preview AI step tambahan; sukses masih tampilkan form | Refine post-submit state; AI preview sekunder |  |
| `StudentLeaveList` | `src/features/leave/StudentLeaveListScreen.tsx` | Student | Pantau izin | Buka/ajukan | - | Pastikan status & catatan asisten jelas |  |
| `StudentFineList` | `src/features/fines/StudentFineListScreen.tsx` | Student | Lihat denda | Buka detail | - | Badge unpaid di Home |  |
| `StudentFineDetail` | `src/features/fines/StudentFineDetailScreen.tsx` | Student | Detail/bayar denda | Bayar/lihat status | - | Pastikan state pembayaran idempotent |  |
| `StudentPaymentHistory` | `src/features/fines/StudentPaymentHistoryScreen.tsx` | Student | Riwayat bayar | Lihat transaksi | - | Keep |  |
| `AssistantSchedule` | `src/features/assistant/AssistantScheduleScreen.tsx` | Asisten/Aslab | Jadwal operasional | Buka sesi/buat sesi | - | Bedakan dengan AllSessions |  |
| `AssistantSessionDetail` | `src/features/assistant/AssistantSessionDetailScreen.tsx` | Asisten/Aslab | Kontrol sesi | Buka/Tutup/QR/Rekap | Aksi banyak tapi kontekstual | Keep; prioritaskan aksi sesuai status |  |
| `AssistantSessionQr` | `src/features/assistant/AssistantSessionQrScreen.tsx` | Asisten/Aslab | Tampilkan QR | Tunjukkan QR | Tidak ada shortcut ke rekap | Tambah CTA sekunder "Lihat rekap" |  |
| `AssistantAttendanceRoster` | `src/features/assistant/AssistantAttendanceRosterScreen.tsx` | Asisten/Aslab | Rekap per sesi | Review hadir/izin/absen | - | Pastikan filter/search |  |
| `AssistantAllSessions` | `src/features/assistant/AssistantAllSessionsScreen.tsx` | Asisten/Aslab | Arsip semua sesi | Buka detail | Overlap Schedule/Calendar | Jelaskan perbedaan atau merge |  |
| `AssistantAllAttendance` | `src/features/assistant/AssistantAllAttendanceScreen.tsx` | Asisten/Aslab | Rekap presensi lintas sesi | Buka roster | Label tab dock "Presensi" kurang tepat | Rename tab untuk asisten |  |
| `AssistantClassList` | `src/features/assistant/AssistantClassListScreen.tsx` | Asisten/Aslab | Kelola kelas | Tambah/edit kelas | Entry point banyak | Tetapkan entry point utama |  |
| `AssistantClassForm` | `src/features/assistant/AssistantClassFormScreen.tsx` | Asisten/Aslab | Buat/edit kelas | Simpan | - | Validasi & dirty-state guard |  |
| `AssistantSessionForm` | `src/features/assistant/AssistantSessionFormScreen.tsx` | Asisten/Aslab | Buat/edit sesi | Simpan | **Open:** Link/navigasi ke LabForm masih ada; guard role belum jelas | Sembunyikan untuk non-aslab + guard di screen |  |
| `AssistantLeaveReviewList` | `src/features/leave/AssistantLeaveReviewListScreen.tsx` | Asisten/Aslab | Review izin | Terima/Tolak | Tidak ada filter status | Tambah filter/pencarian |  |
| `AssistantLabList` | `src/features/labs/AssistantLabListScreen.tsx` | Aslab | Kelola master lab | Tambah/edit lab | Route global, guard menu saja | Tambah guard role di screen |  |
| `AssistantLabForm` | `src/features/labs/AssistantLabFormScreen.tsx` | Aslab | Buat/edit lab | Simpan | Input geofence kritikal | Validasi ketat & konfirmasi destructive |  |
| `Calendar` | `src/features/calendar/CalendarScreen.tsx` | Semua auth | Lihat sesi per tanggal | Preview/detail | - | Keep; bagus sebagai overview |  |
| `Profile` | `src/app/ProfileScreen.tsx` | Semua auth | Akun & pintasan | Edit/logout | Menu duplikat dengan Home/dock | Kurangi pintasan operasional |  |
| `ProfileEdit` | `src/app/ProfileEditScreen.tsx` | Semua auth | Edit profil | Simpan | - | Pastikan validasi & feedback |  |
| `Notifications` | `src/app/NotificationsScreen.tsx` | Semua auth | Inbox notifikasi | Buka notifikasi | - | Pastikan semua tipe route ter-cover |  |
| `LabMaps` | `src/features/maps/LabMapsScreen.tsx` | Semua auth | Peta lab | Lihat/detail sesi | - | Pastikan fallback tanpa GPS/lab kosong |  |
| `BarcodeScan` (shared route) | `src/features/checkin/BarcodeScanScreen.tsx` | Student | Scan QR | Scan | Student-only action tapi route ada di root stack | Guard role atau redirect ramah |  |

## Kandidat Penghapusan/Merge Route

| Kandidat | Alasan | Cek sebelum cut | Bukti |
|---|---|---|---|
| `Home` stack route | Home sudah dirender di `DockTabs` | Cari `navigate('Home')` | `src/app/AppNavigator.tsx` |
| `StudentSchedule` stack route | Ada di dock | Cari deep link/notifikasi | `src/app/AppNavigator.tsx` |
| `StudentAttendanceHistory` stack route | Ada di dock | Cari navigate langsung | `src/app/AppNavigator.tsx` |
| `AssistantSchedule` stack route | Ada di dock | Cari navigate langsung | `src/app/AppNavigator.tsx` |
| `AssistantAllAttendance` stack route | Ada di dock | Cari navigate langsung | `src/app/AppNavigator.tsx` |
| `StudentAllSessions` / `StudentAllAttendance` | Overlap dengan schedule/history | Cek penggunaan nyata | `src/app/navigation.ts` |
| `AssistantAllSessions` | Overlap schedule/calendar | Cek kebutuhan arsip | `src/app/navigation.ts` |

## Checklist Audit Cepat per Halaman

```md
- [ ] Tujuan halaman jelas dalam 5 detik
- [ ] Ada 1 aksi primer
- [ ] Aksi tidak relevan disembunyikan per state/role
- [ ] Loading/empty/error/success ada
- [ ] Back behavior benar
- [ ] Tidak ada duplikasi info dengan layar sebelumnya
- [ ] Navigasi tidak membuat loop
- [ ] Copy role/status konsisten
- [ ] Aksesibilitas label/touch target cukup
```