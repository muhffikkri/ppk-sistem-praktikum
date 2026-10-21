# Changelog

Perubahan penting pada dokumen dan produk dicatat di sini. Entri terbaru diletakkan paling atas.

## [Unreleased]

### Alur asisten

- Menambahkan layar `AssistantSchedule`, `AssistantSessionDetail`, dan `AssistantAttendanceRoster` di `src/features/assistant/` memakai `useAssistantSessionsViewModel` dan komponen `src/shared/ui/`.
- Jadwal dikelompokkan per status; detail sesi hanya menawarkan aksi yang valid (Buka untuk terjadwal, Tutup untuk terbuka, tanpa aksi untuk tertutup) beserta petunjuk status.
- Menampilkan feedback “Sesi dibuka/ditutup pukul …” setelah aksi, serta rekap praktikan hadir terurut waktu dengan keadaan kosong.
- Layar belum disambungkan ke navigator; penyambungan route dilakukan oleh Orang 1 melalui ekspor `src/features/assistant`.

### Fondasi UI bersama

- Menambahkan layout scroll responsif dengan safe area, header, tombol, badge status berlabel, dan keadaan kosong di `src/shared/ui/`.
- Menyatukan warna UI serta menyediakan feedback tekan, status tombol nonaktif, dan label aksesibel tanpa aturan bisnis sesi/presensi.

### Setup aplikasi

- Menambahkan aplikasi Expo SDK 58 (React Native + TypeScript) di root repo dari template `blank-typescript`.
- Menambahkan React Navigation native stack sebagai kerangka navigasi; layar `RoleSelect` masih placeholder sampai Orang 1 memasang `RootStackParamList`.
- Menambahkan `expo-mcp` (dev) dan koneksi MCP Expo remote di `opencode.json` untuk alur pengembangan dengan agent.
- Menambahkan skill proyek di `.opencode/skills/`: `caveman`, `ponytail`, dan `rtk-tdd`.

### Dokumentasi

- Menambahkan PRD Sprint 1 dengan checklist fitur, acceptance criteria, skenario demo, dan batas lingkup.
- Menambahkan rancangan skema Supabase untuk integrasi mendatang; belum ada koneksi/backend pada Sprint 1.
- Menambahkan panduan desain, system spec, peta dokumen, dan aturan source of truth untuk AI coding agents.
- Menetapkan rekomendasi MVVM ringan berbasis custom hook dengan struktur folder per fitur.
- Menambahkan pembagian pekerjaan Sprint 1 untuk empat orang.
- Menambahkan satu file kontrak bersama sebagai sumber tunggal nama route, tipe, field, kondisi, dan aksi.
- Mengisi kontrak bersama dengan usulan route, tipe domain, kondisi sesi/presensi, fixture terpisah per role, dan ViewModel hook untuk ditinjau pemilik produk.
