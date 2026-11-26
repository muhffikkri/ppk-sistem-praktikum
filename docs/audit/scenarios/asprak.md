# Audit Skenario — Asprak (`assistant`)

## Ringkasan Role

- Tujuan utama: kelola kelas/sesi, buka/tutup sesi, tampilkan QR presensi, pantau rekap kehadiran, review izin.
- Aktor runtime: `assistant` diperlakukan `asisten` oleh `useActorRole`/`isAssistantRole`.
- Entry utama: `DockTabs` -> `Home` / `AssistantSchedule` / `AssistantAllAttendance` / `Profile`.

## Skenario 1 — Onboarding & Akses

| Step | Aksi user | Sistem | Temuan | Rekomendasi | Bukti |
|---|---|---|---|---|---|
| 1 | Login/Register | Role `assistant` dapat dipilih saat register/role selection | Label "Asisten praktikum" dipakai di auth, "Asprak" di profil | Refine: konsistensi label role | `src/features/auth/RegisterScreen.tsx`, `src/features/auth/RoleSelectionScreen.tsx`, `src/app/ProfileScreen.tsx` |
| 2 | Masuk app | `AssistantSessionsProvider` aktif jika `isAssistantRole` | Benar untuk asprak/aslab | Keep | `src/app/AppNavigator.tsx` |
| 3 | Buka dock | Tab Presensi mengarah ke `AssistantAllAttendance` | Secara mental model, "Presensi" bisa berarti aksi scan; untuk asisten ini adalah rekap | Refine label tab jadi "Rekap" atau "Kehadiran" | `src/app/AppNavigator.tsx` |

## Skenario 2 — Dashboard Asisten

| Step | Aksi user | Sistem | Temuan | Rekomendasi | Bukti |
|---|---|---|---|---|---|
| 1 | Buka Home | Hero sesi aktif/berikutnya + stat hadir/izin/belum hadir + aksi buka/tutup | Padat tapi informatif | Keep | `src/features/assistant/AssistantHome.tsx` |
| 2 | Buka/tutup sesi dari Home | ConfirmSheet untuk tutup, buka langsung | Buka sesi tanpa konfirmasi; tutup pakai konfirmasi | Refine: pertimbangkan konfirmasi ringan saat buka jika sesi belum waktunya, atau tampilkan dampak | `src/features/assistant/AssistantHome.tsx` |
| 3 | Lihat jadwal hari ini | Daftar sesi hari ini dengan status | Duplikasi dengan Schedule/Calendar | Keep, tapi batasi jumlah item | `src/features/assistant/AssistantHome.tsx` |
| 4 | Gunakan pintasan | Kelola kelas, Buat sesi, Semua sesi, Pemeriksaan izin, Peta | Banyak pintasan; beberapa juga ada di Profile/Schedule | Refine: kelompokkan pintasan berdasarkan frekuensi | `src/features/assistant/AssistantHome.tsx`, `src/app/ProfileScreen.tsx` |

## Skenario 3 — Kelola Kelas

| Step | Aksi user | Sistem | Temuan | Rekomendasi | Bukti |
|---|---|---|---|---|---|
| 1 | Buka daftar kelas | `AssistantClassList` | Akses dari Home, Schedule, Profile | Merge entry point atau tetapkan satu jalur utama | `src/features/assistant/AssistantClassListScreen.tsx` |
| 2 | Tambah/edit kelas | `AssistantClassForm` | CRUD penting | Keep | `src/features/assistant/AssistantClassFormScreen.tsx` |
| 3 | Buat sesi dari konteks kelas | `AssistantSessionForm` dengan `classId` | Bagus mengurangi input ulang | Keep | `src/app/navigation.ts`, `src/features/assistant/AssistantSessionFormScreen.tsx` |

**Potong/sederhanakan:** Hindari tombol "Kelola kelas" muncul di terlalu banyak layar tanpa konteks berbeda.

## Skenario 4 — Kelola Sesi & QR Presensi

| Step | Aksi user | Sistem | Temuan | Rekomendasi | Bukti |
|---|---|---|---|---|---|
| 1 | Buat sesi | Form sesi, bisa navigasi ke buat kelas/lab | Navigasi ke LabForm berguna untuk Aslab; untuk Asprak bisa dead-end jika tidak berhak | Refine: tampilkan "Buat lab" hanya untuk Aslab | `src/features/assistant/AssistantSessionFormScreen.tsx` |
| 2 | Buka detail sesi | Stat hadir/izin/belum hadir, info waktu, aksi buka/tutup/QR/rekap | Layout jelas | Keep | `src/features/assistant/AssistantSessionDetailScreen.tsx` |
| 3 | Buka sesi | ConfirmSheet | Baik untuk mencegah salah buka | Keep | `src/features/assistant/AssistantSessionDetailScreen.tsx` |
| 4 | Tampilkan QR | Hanya saat sesi open; QR + jumlah hadir/peserta | Bagus, tindakan kontekstual | Keep | `src/features/assistant/AssistantSessionQrScreen.tsx` |
| 5 | Tutup sesi | ConfirmSheet danger dengan ringkasan hadir | Baik | Keep | `src/features/assistant/AssistantSessionDetailScreen.tsx` |

**Potong/sederhanakan:**
- Pastikan tidak ada jalur membuat lab oleh role non-aslab dari form sesi.
- QR screen bisa menambahkan shortcut "Lihat rekap" agar asisten tidak back lalu tap lagi.

## Skenario 5 — Rekap Presensi

| Step | Aksi user | Sistem | Temuan | Rekomendasi | Bukti |
|---|---|---|---|---|---|
| 1 | Buka tab Presensi | `AssistantAllAttendance` | Nama tab "Presensi" kurang presisi untuk rekap | Refine label | `src/app/AppNavigator.tsx` |
| 2 | Buka rekap per sesi | `AssistantAttendanceRoster` | Akses dari detail sesi dan daftar rekap | Keep | `src/features/assistant/AssistantAttendanceRosterScreen.tsx` |
| 3 | Lihat semua sesi | `AssistantAllSessions` | Berguna, tapi ada overlap dengan Schedule/Calendar | Refine: bedakan jelas "jadwal operasional" vs "arsip semua sesi" | `src/features/assistant/AssistantAllSessionsScreen.tsx` |

## Skenario 6 — Review Izin

| Step | Aksi user | Sistem | Temuan | Rekomendasi | Bukti |
|---|---|---|---|---|---|
| 1 | Buka daftar izin | List pengajuan, banner feedback/error | Jelas | Keep | `src/features/leave/AssistantLeaveReviewListScreen.tsx` |
| 2 | Terima/Tolak | ConfirmSheet dengan catatan opsional, prediksi AI ditampilkan sebagai pendukung | Sudah ada guardrail "prediksi AI bukan keputusan" | Keep | `src/features/leave/AssistantLeaveReviewListScreen.tsx` |
| 3 | Simpan keputusan | Feedback sukses/gagal | Error dalam sheet sudah ditangani | Keep | `src/features/leave/AssistantLeaveReviewListScreen.tsx` |

**Refine:** Tambah filter status (pending/approved/rejected) dan pencarian nama/sesi jika daftar panjang.

## Skenario 7 — Peta, Notifikasi, Profil

| Area | Temuan | Rekomendasi | Bukti |
|---|---|---|---|
| Peta | Akses dari Home top bar; detail sesi membuka detail asisten | Keep | `src/features/maps/LabMapsScreen.tsx` |
| Notifikasi | Sama dengan role lain | Keep | `src/app/NotificationsScreen.tsx` |
| Profil | Menu duplikat dengan Home/Schedule; Aslab dapat item master lab | Refine: profil jadi "Akun & Administrasi" | `src/app/ProfileScreen.tsx` |

## Backlog Usulan (Asprak)

| ID | Usulan | Jenis | Prioritas |
|---|---|---|---|
| ASP-01 | Ubah label tab "Presensi" untuk asisten menjadi "Rekap" | Refine | P2 |
| ASP-02 | Sembunyikan CTA "Buat lab" di form sesi untuk non-aslab | Cut/Guard | P1 |
| ASP-03 | Kurangi duplikasi pintasan Kelola Kelas/Buat Sesi antar Home/Profile/Schedule | Merge | P2 |
| ASP-04 | Tambah filter status pada pemeriksaan izin | Refine | P2 |
| ASP-05 | Tambah CTA "Lihat rekap" di layar QR sesi | Refine | P3 |