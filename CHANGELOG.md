# Changelog

Perubahan penting pada dokumen dan produk dicatat di sini. Entri terbaru diletakkan paling atas.

## [1.2.0] - 2026-11-11

### Implementasi Sprint 2 — Data Dinamis dengan Firebase

- **Autentikasi (SRS R1)**: `LoginScreen` dan `RegisterScreen` di `src/features/auth/` dengan email/password dan Google Authentication. Role: `student`, `assistant` (admin hanya via `.env`).
- **Account Linking (Email + Google)**: Satu email mengakses user yang sama dengan role yang sama, terlepas dari metode login. Firebase auto-link account saat "One account per email" aktif. Error `auth/credential-already-in-use` ditangani dengan pesan yang jelas.
- **Auth Gate (SRS R1, R8)**: `App.tsx` dan `src/app/AppNavigator.tsx` — pengguna yang belum login diarahkan ke halaman Landing → Login/Register; tidak ada akses data praktikum tanpa login.
- **Google Auth (SRS R1)**: `loginWithGoogle()` di `AuthContext.tsx` menggunakan `GoogleAuthProvider` + `signInWithPopup`; tombol "Masuk dengan Akun Google" di LandingScreen dan LoginScreen.
- **Role Selection**: Setelah Google login pertama kali (belum ada profil Firestore), user diarahkan ke `RoleSelectionScreen` untuk memilih Praktikan atau Asisten. Admin hanya dapat dibuat melalui `EXPO_PUBLIC_ADMIN_EMAIL` di `.env`.
- **CRUD Asisten (SRS R2)**: `AssistantClassListScreen`, `AssistantClassFormScreen`, `AssistantSessionFormScreen` di `src/features/assistant/` — CRUD kelas, peserta, dan sesi di Firestore.
- **Firestore Service**: `src/services/firestore/assistantService.ts`, `studentService.ts`, `leaveService.ts` — CRUD + real-time `onSnapshot`.
- **Security Rules**: `firestore.rules` — pembatasan akses per role, ID deterministik presensi `{sessionId}_{studentId}`, pencegahan presensi ganda, validasi status izin.
- **Seeder**: `scripts/seed-firestore.ts` — generate data dummy (5 user, 3 kelas, 4 sesi) ke Firestore.
- **Role Admin**: Admin hanya dapat dibuat melalui `EXPO_PUBLIC_ADMIN_EMAIL` di `.env`; tidak dapat didaftarkan melalui layar Register.
- **Pembersihan**: Dihapus 20 file komponen lama yang tidak digunakan (themed-text, themed-view, app-tabs, animated-icon, dll.) dan 2 file state kosong.

### Dokumentasi & Persiapan Tahap 0 Sprint 2

- Menambahkan [`docs/sprint-2-prd.md`](docs/sprint-2-prd.md) berisi ruang lingkup ketat berbasis SRS Sprint 2, 8 kebutuhan fungsional, kondisi wajib, batas anti-scope-creep, dan 2 skenario demo akhir.
- Menambahkan [`docs/sprint-2-firebase-and-ai.md`](docs/sprint-2-firebase-and-ai.md) berisi setup Firebase Expo, skema Cloud Firestore, `firestore.rules`, indeks, dan adapter API model AI pengajar.
- Menambahkan [`docs/sprint-2-shared-contract.md`](docs/sprint-2-shared-contract.md) berisi kontrak bersama route, tipe domain TypeScript, validasi, dan ViewModel hooks Sprint 2.
- Menambahkan [`docs/sprint-2-work-split.md`](docs/sprint-2-work-split.md) berisi pembagian kerja 4 developer paralel, tabel pemetaan SRS per developer, matriks kepemilikan file, dan strategi penggabungan PM/Lead Developer.
- Memperbarui [`docs/README.md`](docs/README.md) untuk menambahkan peta dokumen Sprint 2.
- Menyiapkan Tahap 0 PM/Lead Developer: memasang `firebase` & `@react-native-async-storage/async-storage`, menambahkan `.env.example`, `firestore.rules`, `firestore.indexes.json`, serta memperluas kontrak tipe di `src/domain/types.ts` dan route di `src/app/navigation.ts`.

### Fitur Baru

- **Kalender interaktif (CalendarScreen)**: grid hari × jam (07:00–18:00) dengan event cards absolut, bottom sheet drawer detail sesi, view mode switcher (Hari/Minggu/Agenda), navigasi minggu dengan label tanggal dan badge peran.
- **HomeScreen: radio button hari**: tombol Senin–Sabtu di bar bawah kini perilakutama radio button—setak diklik menyimpan hari aktif di state dan menampilkan tampilan `tanggal` di beranda; kalender penuh hanya bisa dibuka lewat halaman Jadwal.
- **ProfileScreen fix**: menyelesaikan error runtime "Text strings must be rendered within a <Text> component" dengan membungkus teks glyph di `<Text>`.
- **Setup lint & CI**: aturan ESLint `react-native/no-raw-text` baru, serta GitHub Actions workflow (`lint.yml`) yang menjalankan `eslint src/` + `tsc --noEmit` pada setiap pull request ke `main`.

### [1.1.0] - 2026-10-21

(Membuat turun dari entri sebelumnya)

- Menambahkan `expo-dev-client` dan profil `development` di `eas.json` (development client, APK internal, channel `development`, iOS simulator).
- Menambahkan `android.package` `com.muhffikkris.ppkmobile` agar build Android bisa berjalan di EAS.
- Menambahkan workflow `build-development.yml` (tag `dev-*`) dan `build-production.yml` (tag `v*`); OTA preview sekarang dipicu tag `preview-*`.

## [1.1.0] - 2026-10-21

### Alur asisten

- Menambahkan layar `AssistantSchedule`, `AssistantSessionDetail`, dan `AssistantAttendanceRoster` di `src/features/assistant/` memakai `useAssistantSessionsViewModel` dan komponen `src/shared/ui/`.
- Jadwal dikelompokkan per status; detail sesi hanya menawarkan aksi yang valid (Buka untuk terjadwal, Tutup untuk terbuka, tanpa aksi untuk tertutup) beserta petunjuk status.
- Menampilkan feedback “Sesi dibuka/ditutup pukul …” setelah aksi, serta rekap praktikan hadir terurut waktu dengan keadaan kosong.
- Layar belum disambungkan ke navigator; penyambungan route dilakukan oleh Orang 1 melalui ekspor `src/features/assistant`.

### Placeholder alur praktikum

- Menghubungkan jadwal, detail, riwayat praktikan, dan rekap asisten melalui placeholder navigasi yang jelas.
- Meneruskan `sessionId` dari detail ke rekap asisten dan menyediakan tombol kembali pada seluruh placeholder.
- Menempatkan placeholder di `src/app/placeholders/` agar dapat diganti layar milik Orang 2/3 tanpa mengubah kontrak route.

### Navigasi mode demo

- Menambahkan pemilihan mode Praktikan/Asisten dan native stack bertipe sesuai `RootStackParamList`.
- Menampilkan role aktif sebagai mode demo pada header, menyediakan kembali/ganti mode, dan mereset riwayat navigasi role dengan kembali ke pemilihan mode.
- Memindahkan kerangka aplikasi ke `src/app/` dengan placeholder sementara untuk layar fitur serta provider safe area.

### Domain dan state

- Menambahkan tipe domain, aturan sesi/presensi, fixture terpisah per role, serta provider `AssistantDemoProvider` dan `StudentDemoProvider` berbasis Context + `useReducer`.
- Menambahkan `npm run verify:contracts` untuk memverifikasi aturan domain dan fixture terhadap kontrak bersama.

### Fondasi UI bersama

- Menambahkan layout scroll responsif dengan safe area, header, tombol, badge status berlabel, dan keadaan kosong di `src/shared/ui/`.
- Menyatukan warna UI serta menyediakan feedback tekan, status tombol nonaktif, dan label aksesibel tanpa aturan bisnis sesi/presensi.

### Setup aplikasi

- Menambahkan aplikasi Expo SDK 58 (React Native + TypeScript) di root repo dari template `blank-typescript`.
- Menambahkan React Navigation native stack sebagai kerangka navigasi; layar `RoleSelect` masih placeholder sampai Orang 1 memasang `RootStackParamList`.
- Menambahkan `expo-mcp` (dev) dan koneksi MCP Expo remote di `opencode.json` untuk alur pengembangan dengan agent.
- Menambahkan skill proyek di `.opencode/skills/`: `caveman`, `ponytail`, dan `rtk-tdd`.
- Menambahkan ESLint (`eslint-config-expo`) + Prettier dengan script `lint`, `lint:fix`, `format`, `format:check`, dan `typecheck`.
- Menambahkan CI GitHub Actions (`.github/workflows/ci.yml`) yang menjalankan typecheck, lint, dan format check pada push/PR.
- Mengonfigurasi EAS Update (`expo-updates`, `updates.url`, `runtimeVersion` appVersion) dan workflow `.eas/workflows/deploy-preview.yml` untuk publish update otomatis ke branch `preview` saat tag `v*` dipush, bukan pada setiap push.

### Dokumentasi

- Menambahkan PRD Sprint 1 dengan checklist fitur, acceptance criteria, skenario demo, dan batas lingkup.
- Menambahkan rancangan skema Supabase untuk integrasi mendatang; belum ada koneksi/backend pada Sprint 1.
- Menambahkan panduan desain, system spec, peta dokumen, dan aturan source of truth untuk AI coding agents.
- Menetapkan rekomendasi MVVM ringan berbasis custom hook dengan struktur folder per fitur.
- Menambahkan pembagian pekerjaan Sprint 1 untuk empat orang.
- Menambahkan satu file kontrak bersama sebagai sumber tunggal nama route, tipe, field, kondisi, dan aksi.
- Mengisi kontrak bersama dengan usulan route, tipe domain, kondisi sesi/presensi, fixture terpisah per role, dan ViewModel hook untuk ditinjau pemilik produk.