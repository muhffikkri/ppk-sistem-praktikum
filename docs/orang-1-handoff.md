# Handoff Orang 1 — Fondasi aplikasi

## Menjalankan dan memeriksa

```sh
npm ci
npm start
```

Buka melalui Expo Go yang kompatibel atau emulator Android. Gunakan `npm run android` bila emulator sudah tersedia.

```sh
npx tsc --noEmit
npx expo export --platform android
```

## Area implementasi

- `src/app/AppNavigator.tsx`: tujuh route native stack sesuai `shared-contract.md`.
- `src/app/navigation.ts`: `RootStackParamList` untuk tipe route dan parameter.
- `src/app/RoleSelectScreen.tsx`: pemilihan mode demo Praktikan/Asisten.
- `src/app/placeholders/PlaceholderScreen.tsx`: placeholder navigasi untuk layar Orang 2/3.
- `src/shared/ui/`: `Screen`, `Header`, `Button`, `StatusBadge`, `EmptyState`, dan warna bersama.

`Screen` menyediakan scroll, batas lebar konten, dan safe area bawah/kiri/kanan. Safe area atas ditangani header navigator. `Button` mendukung `variant="secondary"` dan `disabled`; `StatusBadge` menerima `scheduled`, `open`, atau `closed` dengan label teks Indonesia.

## Integrasi berikutnya

Ganti `component={PlaceholderScreen}` pada route terkait di `AppNavigator.tsx` dengan screen Orang 2/3. Pertahankan nama route dan parameter. Provider state per role mengikuti kontrak bersama saat implementasi Orang 4 tersedia; jangan membungkus setiap screen dengan provider terpisah karena state harus bertahan selama navigasi.

Identifier `preview-session` hanya untuk mencoba perpindahan layar. Ganti dengan ID sesi fixture saat integrasi; parameter `sessionId` pada detail asisten diteruskan ke rekap.

Seluruh layar fitur masih placeholder. Presensi, buka/tutup sesi, fixture, dan provider state merupakan pekerjaan Orang 2–4. Database dan autentikasi belum digunakan. Kontrak bersama tetap berstatus usulan sampai disepakati pemilik produk.

## Checklist verifikasi navigasi

1. Pilih Praktikan; header menampilkan `Praktikan · Demo`.
2. Buka contoh detail, kembali ke jadwal, lalu buka riwayat kehadiran.
3. Tekan `Ganti mode`; pemilihan mode tampil tanpa menyisakan layar Praktikan pada stack.
4. Pilih Asisten; buka contoh detail lalu rekap kehadiran.
5. Gunakan tombol kembali di layar maupun header; dari rekap kembali ke detail, lalu jadwal.
6. Ganti mode dari layar yang lebih dalam; masuk mode lain dan pastikan kembali menuju pemilihan mode.
7. Periksa layar sempit dan teks yang membesar: konten dapat discroll, tombol terbaca, dan header menandai role sebagai demo.

## Branch dan PR

Komponen UI bersama sudah masuk ke `main`. Branch `feat/navigation-to-main` dibuat dari `main` terbaru dan membawa dua commit fitur terpisah: navigasi/pemilihan mode serta penghubung placeholder/panduan integrasi.

PR branch ini langsung menuju `main` dan menggantikan alur PR berantai sebelumnya. Untuk pekerjaan berikutnya, buat branch dari `main` dan arahkan PR langsung ke `main`.
