<<<<<<< HEAD
# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
=======
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
>>>>>>> 1e30cb0b23bc7e10af688e49ec527c81bfb93f56
