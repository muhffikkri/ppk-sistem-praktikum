# PPK Mobile

Aplikasi mobile praktikum: jadwal sesi, buka/tutup sesi, presensi, dan rekap kehadiran untuk role Praktikan, Asisten praktikum, dan Admin. Dibangun dengan React Native + Expo SDK 58 (TypeScript) dan Cloud Firestore (Firebase) untuk data real-time dan autentikasi.

## Fitur Utama (Sprint 2)

- **Autentikasi**: Login/Register dengan email & password, serta **Google Authentication** (login sekali klik).
- **Role**: Praktikan, Asisten praktikum, dan Admin — tiap role memiliki akses dan tampilan yang berbeda.
- **CRUD Admin/Asisten**: Kelola kelas, peserta, dan sesi praktikum.
- **Presensi Real-Time**: Praktikan check-in saat sesi `open`, data tersimpan ke Firestore secara real-time.
- **Pengajuan Izin**: Praktikan ajukan izin dengan klasifikasi AI pendukung; Asisten meninjau dan memberikan keputusan Terima/Tolak.
- **Persisten**: Sesi login dan data tersimpan, tetap tersedia setelah aplikasi ditutup dan dibuka kembali.

## Menjalankan (Development)

```bash
# Install dependencies
npm install

# Pastikan Firebase sudah dikonfigurasi
# Salin .env.example menjadi .env dan isi EXPO_PUBLIC_FIREBASE_*

# Jalankan Expo dev server (bisa dipakai dengan Expo Go)
npm start          # atau npx expo start

# Android (development build)
npm run android    # atau npx expo run:android

# iOS (butuh macOS)
npm run ios        # atau npx expo run:ios
```

> **Catatan**: Expo Go menyertakan Firebase JS SDK secara bawaan, jadi aplikasi bisa berjalan langsung dengan Expo Go tanpa development build, asalkan konfigurasi `.env` sudah benar.

## Script

| Script                    | Kegunaan                                        |
| ------------------------- | ----------------------------------------------- |
| `npm start`               | Menjalankan Expo dev server                     |
| `npm run android`         | Menjalankan di Android (development build)      |
| `npm run ios`             | Menjalankan di iOS (butuh macOS)                |
| `npm run web`             | Menjalankan di browser                          |
| `npm run lint`            | ESLint (`eslint-config-expo`)                   |
| `npm run lint:fix`        | ESLint dengan auto-fix                          |
| `npm run format`          | Prettier menulis ulang file                     |
| `npm run format:check`    | Cek format tanpa mengubah file                  |
| `npm run typecheck`       | `tsc --noEmit`                                  |
| `npm run verify:contracts`| Assertion domain dan fixture Sprint 1           |
| `npm run seed`            | (opsional) Jalankan seeder dummy data ke Firestore |

## Struktur Repo

```text
App.tsx                 entry point + auth gate + navigator
src/app/                navigator & screens (Home, Calendar, Profile, dll.)
src/app/navigation.ts   tipe route (AuthStackParamList, RootStackParamList)
src/domain/             tipe domain & aturan sesi/presensi/auth
src/features/           fitur per modul (assistant, auth, leave, student)
src/features/auth/      LoginScreen, RegisterScreen
src/features/assistant/ AssistantClassList, ClassForm, SessionForm, dll.
src/features/leave/     StudentLeaveRequestForm, StudentLeaveList, AssistantLeaveReviewList
src/features/student/   StudentSchedule, SessionDetail, AttendanceHistory, dll.
src/state/              provider Context (AuthContext, AssistantSessionsContext, dll.)
src/services/firestore/ assistantService, studentService, leaveService
src/services/ai/        leaveClassifier (API model AI pengajar)
src/shared/ui/          komponen UI bersama (Banner, Button, Card, dll.)
src/theme/tokens.ts     design token (warna, spacing, radius, typografi)
scripts/seed-firestore.ts seeder data dummy ke Firestore
docs/                   PRD, kontrak bersama, skema database
spec/                   system spec
```

## CI

`.github/workflows/ci.yml` menjalankan `npm ci`, typecheck, lint, dan format check pada setiap push ke `main` dan pull request.

## Build dan deploy via tag

Semua build berjalan di EAS (cloud), jadi tidak perlu Android SDK/emulator di mesin lokal. Workflow dipicu oleh tag:

| Tag | Workflow | Hasil |
| --- | --- | --- |
| `dev-*` | `.eas/workflows/build-development.yml` | APK development client (profil `development`, channel `development`) |
| `v*` | `.eas/workflows/build-production.yml` | AAB production (profil `production`, channel `production`) |
| `preview-*` | `.eas/workflows/deploy-preview.yml` | OTA update ke branch `preview` |

```bash
# development build (APK, bisa langsung di-install)
git tag dev-1.1.0
git push origin dev-1.1.0

# production build (AAB untuk Play Store)
git tag v1.2.0
git push origin v1.2.0

# OTA preview untuk build channel preview
git tag preview-1.1.1
git push origin preview-1.1.1
```

Prasyarat sekali setup:

1. Repo GitHub terhubung ke project EAS `@muhffikkris-team/ppk-mobile` (Expo dashboard → project settings → GitHub).
2. Untuk menerima OTA, build dengan channel yang sesuai harus terpasang. Contoh build preview: `npx eas-cli build --profile development`.

Menjalankan workflow secara manual dan memasang hasil build:

```bash
npx eas-cli workflow:run .eas/workflows/build-development.yml
npx eas-cli build:run --platform android --profile development
npx eas-cli update:list --branch preview
```

Update hanya diterima build yang `runtimeVersion` dan channel-nya cocok. Perubahan native butuh build baru; perubahan JavaScript/asset cukup OTA. Build production tidak otomatis publish OTA production; jalankan `npx eas-cli update --branch production --environment production` bila perlu.

## Seeder Data Dummy (Opsional)

Untuk mengisi Firestore dengan data demo (kelas, sesi, praktikan, asisten, admin):

```bash
# Pastikan .env sudah diisi konfigurasi Firebase
npx tsx scripts/seed-firestore.ts
```

Akun demo yang di-generate:

| Peran | Email |
|-------|-------|
| Praktikan | budi@kampus.ac.id |
| Praktikan | siti@kampus.ac.id |
| Praktikan | dimas@kampus.ac.id |
| Asisten | asisten.rpl@kampus.ac.id |
| Admin | admin@kampus.ac.id |

## Dokumentasi

- [PRD Sprint 2](docs/sprint-2-prd.md)
- [Kontrak Bersama Sprint 2](docs/sprint-2-shared-contract.md)
- [Firebase & Skema Firestore](docs/sprint-2-firebase-and-ai.md)
- [Pembagian Kerja Sprint 2](docs/sprint-2-work-split.md)
- [Peta Dokumen](docs/README.md)
- [Design & UI](design.md)
- [Spesifikasi Sistem](spec/system-spec.md)