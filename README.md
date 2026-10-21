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

## Deploy otomatis (EAS Update)

Setiap push tag `v*` memicu `.eas/workflows/deploy-preview.yml`, yang mem-publish update OTA ke branch `preview` lewat EAS Workflows. Push commit biasa ke `main` tidak men-deploy.

```bash
git tag v1.0.1
git push origin v1.0.1
```

Prasyarat sekali setup:

1. Repo GitHub terhubung ke project EAS `@muhffikkris-team/ppk-mobile` (Expo dashboard → project settings → GitHub).
2. Build dengan channel `preview` terpasang di perangkat. Build pertama: `npx eas-cli build --profile preview`.

Menjalankan workflow secara manual:

```bash
npx eas-cli workflow:run .eas/workflows/deploy-preview.yml
npx eas-cli update:list --branch preview
```

Update hanya diterima build yang `runtimeVersion` dan channel-nya cocok (`preview`). Perubahan native butuh build baru; perubahan JavaScript/asset cukup OTA.

## Dokumentasi

- [PRD Sprint 1](docs/PRD.md)
- [Kontrak bersama](docs/shared-contract.md)
- [System spec](spec/system-spec.md)
- [Peta dokumen](docs/README.md)
