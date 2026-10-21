# Changelog

Perubahan penting pada dokumen dan produk dicatat di sini. Entri terbaru diletakkan paling atas.

## [Unreleased]

### Development build dan build via tag

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
