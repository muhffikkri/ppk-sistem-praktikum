# PPK Mobile

Aplikasi mobile demo praktikum: jadwal sesi, buka/tutup sesi, presensi, dan rekap kehadiran untuk role Praktikan dan Asisten. Dibangun dengan React Native + Expo SDK 58 (TypeScript) dan berjalan sepenuhnya dengan fixture lokal pada Sprint 1.

## Menjalankan

```bash
npm install
npm start          # Expo dev server
npm run android    # Android
npm run ios        # iOS (butuh macOS)
```

## Script

| Script                    | Kegunaan                                        |
| ------------------------- | ----------------------------------------------- |
| `npm start`               | Menjalankan Expo dev server                     |
| `npm run lint`            | ESLint (`eslint-config-expo`)                   |
| `npm run lint:fix`        | ESLint dengan auto-fix                          |
| `npm run format`          | Prettier menulis ulang file                     |
| `npm run format:check`    | Cek format tanpa mengubah file                  |
| `npm run typecheck`       | `tsc --noEmit`                                  |
| `npm run verify:contracts`| Assertion domain dan fixture Sprint 1           |

## Struktur

```text
App.tsx                 entry point + navigator
src/domain/             tipe dan aturan sesi/presensi
src/data/fixtures/      fixture asisten dan praktikan
src/state/              provider Context + useReducer per role
src/shared/ui/          komponen UI bersama
scripts/                verifikasi kontrak
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
2. Untuk menerima OTA, build dengan channel yang sesuai harus terpasang. Contoh build preview: `npx eas-cli build --profile preview`.

Menjalankan workflow secara manual dan memasang hasil build:

```bash
npx eas-cli workflow:run .eas/workflows/build-development.yml
npx eas-cli build:run --platform android --profile development
npx eas-cli update:list --branch preview
```

Update hanya diterima build yang `runtimeVersion` dan channel-nya cocok. Perubahan native butuh build baru; perubahan JavaScript/asset cukup OTA. Build production tidak otomatis publish OTA production; jalankan `npx eas-cli update --branch production --environment production` bila perlu.

## Dokumentasi

- [PRD Sprint 1](docs/PRD.md)
- [Kontrak bersama](docs/shared-contract.md)
- [System spec](spec/system-spec.md)
- [Peta dokumen](docs/README.md)
