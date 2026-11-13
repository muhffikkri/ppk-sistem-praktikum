# Design — PPK Mobile (LabPresensi)

**Source of truth:** the raw sticker sheet lives in
[`spec/design-sticker-sheet.md`](spec/design-sticker-sheet.md)
(LabPresensi v1.2, "Sebenza" visual language). This file is the human +
agent-readable reference: every token, component, and screen convention
below is derived from that raw file. If the raw sticker sheet changes,
update this document and `src/theme/tokens.ts` together.

When an agentic AI works on this repo, read **this file first**. Do not
invent colors, radii, spacing, or type styles — pull them from the tokens
defined here and from `src/theme/tokens.ts`.

---

## Prinsip

- **Status mudah dipahami:** sesi Terjadwal / Terbuka / Tertutup memakai
  label teks konsisten; warna hanya penguat.
- **Aksi sesuai konteks:** tombol presensi hanya aktif untuk sesi terbuka;
  kontrol buka/tutup hanya tersedia untuk role asisten.
- **Fokus satu tugas:** jadwal = titik masuk; detail sesi = aksi + info.
- **Responsif:** satu kolom nyaman disentuh; konten memanjang discroll.
- **Feedback langsung:** aksi → banner konfirmasi + state diperbarui dari
  Firestore (listener realtime).
- **Konten jujur:** setiap angka, nama, lokasi, dan status berasal dari data
  Firestore atau label UI statis. Tidak ada metrik, nama, atau fitur
  karangan (QR, beacon, geofence, tukar shift, modul materi) — lihat
  batas fitur di [`docs/sprint-2-prd.md`](docs/sprint-2-prd.md).

## Navigasi

```text
Landing
├── Masuk (email/password) ─┐
├── Masuk dengan Google ────┼─→ Pilih peran (sekali, akun baru) ─→ App
└── Daftar ─────────────────┘

App (BottomDock: Beranda · Jadwal · [Izin] · Presensi · Akun)
├── Praktikan
│   ├── Jadwal → Detail sesi → Presensi / Ajukan izin
│   ├── Riwayat kehadiran
│   └── Izin saya
└── Asisten
    ├── Kelas → Form kelas / peserta
    ├── Jadwal → Detail sesi → Buka/Tutup sesi → Rekap kehadiran
    └── Pemeriksaan izin
```

Autentikasi memakai Firebase Auth; peran disimpan di profil Firestore dan
tidak bisa diganti sendiri oleh pengguna. FAB tengah dock membuka layar izin
sesuai peran — tidak ada aksi QR.

---

## Design Tokens (dari sticker sheet)

### Font

| Token      | Family               | Kegunaan                    |
| ---------- | -------------------- | --------------------------- |
| display    | `Fraunces` (serif)   | Judul, angka hero, headline |
| sans       | `Plus Jakarta Sans`  | Body UI, label, caption     |

Fraunces memakai letter-spacing negatif (editorial):
`display` `-0.03em`, `subtitle` `-0.02em`.

**Pemuatan font:** paket `@expo-google-fonts/fraunces` dan
`@expo-google-fonts/plus-jakarta-sans`, dimuat oleh `useFonts` di `App.tsx`
(daftar file di `src/theme/fonts.ts`) sebelum render pertama; splash
ditahan dengan `expo-splash-screen`. Cara ini berjalan di Expo Go maupun
development build.

**Satu family per berat.** Android tidak memilih berat dari `fontWeight`
untuk font custom, jadi token memakai nama family per berat dan **tidak**
memakai `fontWeight`:

| Token `fontFamily` | Family terdaftar              |
| ------------------ | ----------------------------- |
| `display`          | `Fraunces_400Regular`         |
| `displayItalic`    | `Fraunces_400Regular_Italic`  |
| `displaySemibold`  | `Fraunces_600SemiBold`        |
| `displayBold`      | `Fraunces_700Bold`            |
| `sans`             | `PlusJakartaSans_400Regular`  |
| `sansMedium`       | `PlusJakartaSans_500Medium`   |
| `sansSemibold`     | `PlusJakartaSans_600SemiBold` |
| `sansBold`         | `PlusJakartaSans_700Bold`     |

Layar tidak menulis `fontFamily`/`fontSize`/`fontWeight` sendiri — pakai
primitif `Text` (`variant` = nama token tipografi, `tone` = warna).

### Ikon

`@expo/vector-icons` → **Ionicons** (sticker sheet memakai Phosphor sebagai
referensi web; padanannya di app adalah Ionicons). Varian `-outline` untuk
keadaan pasif, solid untuk aktif. Jangan pakai glyph unicode/emoji
sebagai ikon.

### Warna (Sebenza violet family)

| Token           | Hex       | Keterangan                              |
| --------------- | --------- | --------------------------------------- |
| `violet`        | `#5B3BE8` | Primary: tombol, link, aksen, aktif     |
| `violetDark`    | `#4427C6` | Hover/pressed dari violet                |
| `violetLight`   | `#7356F5` | Aksen sekunder terang                   |
| `lime`          | `#D3F36B` | Aksen high-visibility, highlight        |
| `limeHover`     | `#C0E255` | Hover/pressed dari lime                 |
| `lavender`      | `#E4DBFF` | Tint lembut, fill soft                  |
| `lavenderSubtle`| `#F3EFFF` | Tint sangat lembut, hover panel         |
| `pink`          | `#FFC2D9` | Aksen dekoratif, tint "late/warning"    |
| `ink`           | `#17141F` | Teks utama, permukaan gelap, bottom dock |
| `inkMuted`      | `#5D586C` | Teks sekunder, caption                  |
| `surface`       | `#F4F2F9` | Canvas aplikasi (latar layar)          |
| `panel`         | `#FFFFFF` | Kartu, input, modal (permukaan putih)   |
| `border`        | `#E7E3F2` | Garis tepi utama                        |
| `borderSubtle`  | `#F0EDF7` | Garis tepi halus / divider              |
| `pinkInk`       | `#8A0F41` | Teks di atas `pink` (badge late/izin)   |

### Warna di atas permukaan gelap & overlay

| Token         | Nilai                    | Untuk                                   |
| ------------- | ------------------------ | --------------------------------------- |
| `onPrimary`   | `#FFFFFF`                | Teks/ikon utama di atas `violet`/`ink`  |
| `onInkMuted`  | `rgba(255,255,255,0.7)`  | Teks sekunder di atas `violet`/`ink`    |
| `onInkSubtle` | `rgba(255,255,255,0.08)` | Tint panel/metrik di atas `ink` (white/5–10) |
| `scrim`       | `rgba(23,20,31,0.45)`    | Backdrop sheet/modal                    |

### Warna semantik

| Token         | Hex       | Untuk                        |
| ------------- | --------- | --------------------------- |
| `success`     | `#22C55E` | Tercapai / valid            |
| `successSoft` | `#F0FDF4` | Latar banner sukses         |
| `successBorder` | `#BBF7D0` | Tepi banner sukses          |
| `successInk`  | `#15803D` | Teks sukses                 |
| `danger`      | `#EF4444` | Error / destructive         |
| `dangerSoft`  | `#FEF2F2` | Latar banner error         |
| `dangerBorder`| `#FCA5A5` | Tepi banner error          |
| `dangerInk`   | `#DC2626` | Teks error                  |
| `onSite`      | `#166534` | GPS on-site chip            |
| `onSiteSoft`  | `#DCFCE7` | Latar on-site chip          |
| `onSiteBorder`| `#86EFAC` | Tepi on-site chip           |

### Spacing (px)

`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40`
(`xs sm md lg xl 2xl 3xl 4xl`)

### Radius (px) — skala sticker sheet

| Token | Nilai | Umumnya untuk              |
| ----- | ----- | ------------------------- |
| `sm`  | 8     | chip kecil                |
| `md`  | 12    | tombol kecil, badge       |
| `lg`  | 16    | input, panel kecil        |
| `2xl` | 18    | tombol, card kecil        |
| `3xl` | 24    | card, section block       |
| `4xl` | 32    | hero card, container besar |
| `full`| 999   | pill / badge              |

### Shadow

| Token      | CSS (referensi)                                        |
| ---------- | ------------------------------------------------------ |
| `subtle`   | `0 4px 20px -2px rgba(23,20,31,.05)`                  |
| `elevated` | `0 12px 32px -4px rgba(91,59,232,.12)`  (violet glow) |
| `card`     | `0 2px 10px rgba(0,0,0,.02), 0 0 1px rgba(0,0,0,.06)` |

### Type scale (px)

| Token           | Font       | Ukuran | Line-height | Berat      | Kegunaan            |
| --------------- | ---------- | -----: | ----------: | ---------- | ------------------- |
| `display`       | Fraunces   |   28   |      34     | 700        | Headline halaman    |
| `displayAccent` | Fraunces   |   28   |      34     | 400 italic | Potongan judul beraksen (maks. 1× per layar) |
| `displayHero`   | Fraunces   |   30   |      36     | 400        | Waktu hero "08:00"  |
| `title`         | Fraunces   |   24   |      30     | 600        | Judul kartu/section |
| `subtitle`      | Fraunces   |   18   |      26     | 400        | Judul kartu konten  |
| `body`          | Sans       |   14   |      20     | 400        | Body text           |
| `bodyStrong`    | Sans       |   14   |      20     | 600        | Body emphasized     |
| `label`         | Sans       |   13   |      18     | 500        | Label form/row      |
| `caption`       | Sans       |   12   |      16     | 400        | Caption, hint       |
| `captionStrong` | Sans       |   12   |      16     | 600        | Badge, label tab    |
| `overline`      | Sans       |   10   |      14     | 700        | Eyebrow, spec label |

`overline` & eyebrow selalu UPPERCASE + letter-spacing `0.08em` (sudah
termasuk di token). Caption 12px (bukan 11) agar tetap terbaca di Android.
Italic hanya lewat `displayAccent`, jangan `fontStyle: 'italic'` lokal.

---

## Komponen (mirror sticker sheet sections)

Nama komponen di `src/shared/ui/` cocok dengan section di sticker sheet.

### Card — Section 05 (hero + shift blocks)

Variants:

| Variant     | Latar                | Border / Shadow          |
| ----------- | -------------------- | ------------------------ |
| `panel`     | `panel` (putih)      | `border` + `shadow.card` |
| `surface`   | `surface` (canvas)   | `border`                 |
| `heroViolet`| `violet`             | `shadow.elevated`       |
| `heroInk`   | `ink`                | `shadow.elevated`       |
| `lavender`  | `lavender`           | `border = lavender`     |
| `pink`      | `pink`               | `border = pink`         |

Radius default `3xl` (24). Inner padding 16, gap vertikal 8.
Sub-primitif: `CardContent` (padding + rhythm), `CardHeader` (judul +
trailing slot), `CardOverline` (eyebrow di atas judul).

### Button — Section 02

Min-height 48, radius `2xl` (18), padding horizontal 24.

| Variant       | Latar              | Teks          | Pressed        |
| ------------- | ----------------- | ------------- | -------------- |
| `primary`     | `violet`          | putih         | `violetDark`   |
| `accent`      | `lime`            | `ink`         | `limeHover`    |
| `soft`        | `lavender`        | `violet`      | `lavenderSubtle`|
| `outline`     | `panel` + `border`| `ink`         | `surface`      |
| `destructive` | `dangerSoft`      | `dangerInk`   | `dangerBorder` |

Ukuran `size`: `md` (default, min-height 48, padding 24) dan `sm`
(min-height 40, padding 16) untuk aksi di dalam kartu/banner. Label
`bodyStrong` (`sm`: `label`), selalu satu baris. Ikon hanya lewat prop
`icon` (nama Ionicons) — tidak ada glyph unicode. Loading:
`ActivityIndicator` + label tetap tampil.
Semua tombol wajib `accessibilityRole="button"`.

### IconButton — Section 02 (icon states)

40×40 (hit-slop sampai 44), radius `lg`, ikon Ionicons 20.
Variant `outline` (default, panel + `border`), `soft` (lavender, ikon
violet), `ghost` (tanpa latar). `accessibilityLabel` **wajib** secara
tipe — ikon tidak punya teks untuk dibacakan.

### TopBar

Untuk layar push (detail, form): `IconButton` kembali (bila `onBack`
diberikan, label default "Kembali") + judul `bodyStrong` satu baris +
slot `trailing`. Tinggi minimum 44.

### Header

`eyebrow` (overline violet, opsional) + `title` (`display`) +
`accent` (opsional, potongan judul `displayAccent` italic violet —
maks. 1× per layar, hanya judul halaman utama) + `description` (body
muted). `dark` mengganti semua baris ke `onPrimary` / `onInkMuted`.

### SectionHeader

`overline` muted di kiri + aksi teks kecil opsional di kanan
(`captionStrong` violet, mis. "Lihat semua"). Dipakai antar section,
bukan di setiap kartu.

### Form controls — Section 03

- **Input floating pill (`TextField`):** panel putih, radius `2xl`,
  padding 12. Label kecil uppercase (`overline`) di dalam field.
  Focused → border 2px `violet` + `shadow.subtle` (label ikut violet).
  Error → border `danger` + latar `dangerSoft` + pesan `caption`
  danger di bawah; `hint` (caption muted) tampil bila tidak ada error.
  Props: `label`, `error?`, `hint?`, `rightAccessory?` (mis.
  `IconButton` lihat password), plus prop `TextInput` (`value`,
  `onChangeText`, `secureTextEntry`, `multiline`, …).
- **Search bar:** `surface` + `border`, radius `2xl`, ikon kaca + shortcut ⌘K.
- **Dropdown:** panel + `border`, label kecil atas + nilai bold bawah.
- **Segmented switch:** container `surface`, item aktif `ink` (teks putih),
  item pasif `inkMuted`. Radius container `2xl`, item `lg`.

### Status chips / badges — Section 04

Pill radius `full`, padding horizontal 12 / vertikal 6,
font `caption` (11–12px) bold, gap 6px dari dot bila ada.

| Tone       | Latar        | Teks            |
| ---------- | ----------- | --------------- |
| `lime`     | `lime`      | `ink`           |
| `pink`     | `pink`      | `#8A0F41`       |
| `lavender` | `lavender`  | `violet`        |
| `ink`      | `ink`       | `panel`         |
| `violet`   | `violet`    | `panel` (+dot lime, bisa pulsing)|
| `neutral`  | `surface` + `border` | `inkMuted` |
| `success`  | `onSiteSoft` + `onSiteBorder` | `onSite` |
| `danger`   | `dangerSoft` + `dangerBorder` | `dangerInk` |

Status sesi legacy (Terjadwal/Terbuka/Tertutup) dipetakan oleh
`LegacyStatusBadge`: scheduled→`lavender`, open→`violet`+dot live,
closed→`neutral`.

### Attendance rows — Section 06

`ListRow`: panel + `border`, radius `2xl`, padding 12, min-height 64.
Slot `leading` (biasanya `Avatar`), `title` `bodyStrong` dan `meta`
`caption` muted (keduanya satu baris), slot `trailing` (badge status,
chevron). Dengan `onPress` seluruh row menjadi `Pressable`
(pressed → border violet + `lavenderSubtle`).

`Avatar`: lingkaran 36 (opsi 44), inisial dari nama **asli** (kata
pertama + terakhir). Tone `lavender` (default, teks violet), `pink`
(terlambat, teks `pinkInk`), `lime` (hadir, teks ink).

### Analytics — Section 07

- **Big number card:** `heroInk` (dark), angka `displayHero` + suffix
  `lime`, 3 kolom metrik di bawah dengan tint `white/5`.
- **Bar visualizer:** container `surface` + `border`, bar `lavender`,
  bar puncak `violet`, bar khusus `lime`.

### Feedback / dialog — Section 08

`Banner` primitive: radius `2xl`, padding 12–16, ikon bulat 32 di kiri,
judul `bodyStrong`, pesan `caption`. Tone `success` / `warning` /
`danger` memakai pasangan warna semantik di atas. Dismiss = tombol
kecil outline.
Empty state: blok `surface` **dashed border**, ikon panel 48 di tengah,
judul `bodyStrong`, deskripsi `body` (max 240px).

`LoadingState`: satu-satunya blok loading — spinner violet + label
body muted (default "Memuat…"), di tengah.
`ErrorState`: `Banner` danger (judul default "Gagal memuat data",
pesan dari service) + `Button` outline `sm` "Coba lagi" bila
`onRetry` diberikan.

### Screen

Kolom konten satu-satunya per layar; `withDock={false}` untuk layar
auth. `contentStyle` hanya untuk layout kolom, mis.
`{ flexGrow: 1, justifyContent: 'space-between' }` agar tombol menempel
di bawah pada HP tinggi tetapi tetap bisa discroll di HP pendek
(contoh: `LandingScreen`).

### Guard otomatis

`npm run check:ui [-- <path|glob> …]` (`scripts/check-ui-tokens.ts`)
menolak literal hex/rgba di luar `src/theme`, `fontSize`/`fontFamily`/
`fontWeight`/`fontStyle` di luar `src/theme` & `src/shared/ui`, `Text`
dari `react-native` di layar, dan copy di luar SRS (QR, Beacon, Shift,
SIAKAD, SSO, …). `--report` mencetak jumlah pelanggaran per file tanpa
gagal.

### Bottom dock (mobile)

Latar `ink`, rounded-top `3xl`, height ~64. Tab aktif: ikon + label
`lime`. Tab pasif: `zinc-400`-ish (pakai `inkMuted`). Center FAB:
`lime` 48×48 radius `lg`, ikon `ink`, border 4px `ink`.

---

## Pola implementasi

MVVM ringan per fitur:

- **View** = screen/component React Native
- **ViewModel** = custom hook (siapkan data + aksi UI)
- **Model** = tipe domain, aturan, service Firestore

Aliran satu arah: View baca state → panggil aksi → ViewModel validasi
aturan → update state → View re-render. Nama hook & identifier final
di [kontrak bersama](docs/shared-contract.md).

Struktur folder:

```text
src/
├─ theme/tokens.ts          # SEMUA token (sumber tunggal)
├─ shared/ui/               # primitif design system (Card, Button, ...)
├─ features/<role>/        # screen + viewmodel per fitur
├─ theme/fonts.ts           # daftar file font yang dimuat useFonts
├─ state/                  # provider Firestore per role
└─ domain/                 # tipe + aturan
```

**Aturan gaya:**

1. Jangan hardcode warna/radius/spacing/typo di component — selalu import
   dari `shared/ui` (yang me-re-export token) atau `theme/tokens`.
2. Component layar = susunan primitif `shared/ui`, bukan style inline
   ad-hoc. Style lokal hanya untuk layout (gap, direction, flex).
3. Nama prop component mengikuti naming sticker sheet (variant, tone,
   dark, live).
4. Teks aksesibel wajib: `accessibilityRole`, `accessibilityLabel` pada
   semua kontrol non-teks.
5. Teks di layar memakai primitif `Text` (`shared/ui`), bukan `Text` dari
   `react-native`, agar font & ukuran selalu dari token.
6. Feedback setelah tulis ke Firestore hanya ditampilkan setelah promise
   berhasil; gagal → banner danger dengan pesan dari service.

## Layar & elemen

- **Pemilihan role:** dua `Card` (praktikan / asisten), masing-masing
  `CardOverline` + judul `title` + deskripsi + `Button`.
- **Jadwal:** section per status (`open` → `scheduled` → `closed`),
  judul section `overline`, isi = `AssistantSessionCard` / hero card.
- **Detail sesi:** `Header` + `Banner` (feedback) + `Card` berisi
  info row + aksi (`Button`). Praktikan: status presensi + waktu.
  Asisten: jumlah hadir + buka/tutup.
- **Rekap asisten:** summary row (badge + hitung) + `Card` berisi
  daftar kehadiran (attendance rows).
- **Riwayat praktikan:** daftar catatan presensi, status + waktu.

## Status & feedback

| Status sesi | Praktikan                                    | Asisten                                 |
| ----------- | ------------------------------------------ | --------------------------------------- |
| Terjadwal   | Presensi nonaktif + alasan                 | Tawarkan **Buka sesi** (`primary`)     |
| Terbuka     | **Presensi** (`accent` lime) bila belum     | Tawarkan **Tutup sesi** + tampilkan rekap |
| Tertutup    | Presensi nonaktif, riwayat tetap terbaca    | Status tertutup + rekap                |

Feedback banner wajib setelah aksi: "Sesi dibuka", "Sesi ditutup",
"Presensi berhasil pukul …".

## Aksesibilitas & layout

- Kontras teks `ink` pada `panel`/`surface` memadai; `violet` pada
  `panel` untuk aksen.
- Target sentuh ≥ 44px; gap antar aksi ≥ 8px.
- Daftar & detail discroll termasuk saat keyboard tampil.
- Nama praktikum/kelas panjang: `numberOfLines` + ellipsis, jangan overflow.

## Data & state

Semua data layar berasal dari Firestore lewat provider di `src/state/`
(listener realtime, ter-scope ke user yang login). Fixture di
`data/fixtures/*` hanya untuk test/pengembangan — layar tidak boleh
mengimpornya. Presensi ganda dicegah oleh ID deterministik
`{sessionId}_{uid}` dan Security Rules, bukan oleh UI.

Layar yang tidak termasuk SRS Sprint 2 (modul materi, pengaturan
notifikasi/geofence) tidak ditampilkan di navigasi.

---

## Checklist untuk agentic AI

Sebelum menambah/mengubah UI:

- [ ] Baca `spec/design-sticker-sheet.md` (raw) + file ini.
- [ ] Semua warna/spacing/radius/typo dari `src/theme/tokens.ts`,
      bukan literal baru.
- [ ] Gunakan primitif `shared/ui` (Text, Button, IconButton, TopBar,
      Header, SectionHeader, TextField, ListRow, Avatar, Card,
      StatusBadge, Banner, LoadingState, ErrorState, Screen, EmptyState)
      — buat primitif baru hanya jika belum ada.
- [ ] Tidak ada konten karangan (angka, nama, lokasi, fitur di luar SRS).
- [ ] Jalankan `npm run typecheck`, `npm run lint`, dan
      `npm run format:check` sebelum selesai.
- [ ] Update file ini + sticker sheet bila menambah token/komponen baru.
