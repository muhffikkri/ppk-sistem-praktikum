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
- **Feedback langsung:** aksi lokal → banner konfirmasi + state diperbarui.

## Navigasi

```text
Pemilihan role
├── Praktikan
│   ├── Jadwal → Detail sesi → Presensi
│   └── Riwayat kehadiran
└── Asisten
    ├── Jadwal → Detail sesi → Buka/Tutup sesi
    └── Rekap kehadiran sesi
```

Pilihan role = mode demo lokal (bukan login).

---

## Design Tokens (dari sticker sheet)

### Font

| Token      | Family               | Kegunaan                    |
| ---------- | -------------------- | --------------------------- |
| display    | `Fraunces` (serif)   | Judul, angka hero, headline |
| sans       | `Plus Jakarta Sans`  | Body UI, label, caption     |

Fraunces memakai letter-spacing negatif (editorial):
`display` `-0.03em`, `subtitle` `-0.02em`.

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

| Token        | Font       | Ukuran | Line-height | Berat   | Kegunaan            |
| ------------ | ---------- | -----: | ----------: | ------ | ------------------- |
| `display`    | Fraunces   |   28   |      34     | 700    | Headline halaman    |
| `displayHero`| Fraunces   |   30   |      36     | 400    | Waktu hero "08:00"  |
| `title`      | Fraunces   |   24   |      30     | 600    | Judul kartu/section |
| `subtitle`   | Fraunces   |   18   |      26     | 400    | Judul kartu konten  |
| `body`       | Sans       |   14   |      20     | 400    | Body text           |
| `bodyStrong` | Sans       |   14   |      20     | 600    | Body emphasized     |
| `label`      | Sans       |   13   |      18     | 500    | Label form/row      |
| `caption`    | Sans       |   11   |      16     | 400    | Caption, hint       |
| `overline`   | Sans       |   10   |      14     | 700    | Eyebrow, spec label |

`overline` & eyebrow selalu UPPERCASE + letter-spacing `0.08em`.

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

Icon-only: 40×40, radius `lg`. Loading: spinner + label "…".
Semua tombol wajib `accessibilityRole="button"`.

### Form controls — Section 03

- **Input floating pill:** panel putih, radius `2xl`, padding 12.
  Label kecil uppercase di dalam field. Focused → border 2px `violet`
  + `shadow.subtle`. Error → border `danger` + latar `dangerSoft/20`.
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

Row: panel + `border`, radius `2xl`, padding 12, tinggi ~64.
Avatar bulat 36 (initials, latar tint per status). Nama `bodyStrong`,
meta `caption` (`inkMuted`). Trailing: badge status + menu (⋮).
Row "late" pakai avatar `pink`, "izin" pakai `lavender`.

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

### Bottom dock (mobile)

Latar `ink`, rounded-top `3xl`, height ~64. Tab aktif: ikon + label
`lime`. Tab pasif: `zinc-400`-ish (pakai `inkMuted`). Center FAB:
`lime` 48×48 radius `lg`, ikon `ink`, border 4px `ink`.

---

## Pola implementasi

MVVM ringan per fitur:

- **View** = screen/component React Native
- **ViewModel** = custom hook (siapkan data + aksi UI)
- **Model** = tipe domain, aturan, fixture lokal

Aliran satu arah: View baca state → panggil aksi → ViewModel validasi
aturan → update state → View re-render. Nama hook & identifier final
di [kontrak bersama](docs/shared-contract.md).

Struktur folder:

```text
src/
├─ theme/tokens.ts          # SEMUA token (sumber tunggal)
├─ shared/ui/               # primitif design system (Card, Button, ...)
├─ features/<role>/        # screen + viewmodel per fitur
├─ state/                  # context/demo state
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
5. Jangan pernyataan "tersimpan ke server" pada demo — semua aksi lokal.

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

## Fixture & state

Fixture role asisten & praktikan dipisah (`data/fixtures/*`).
Perubahan lokal asisten tidak mengubah status yang dibaca praktikan.
Identitas demo praktikan tetap agar presensi duplikat bisa dicegah.
State tidak dijanjikan persist antar restart kecuali sengaja disimpan.

---

## Checklist untuk agentic AI

Sebelum menambah/mengubah UI:

- [ ] Baca `spec/design-sticker-sheet.md` (raw) + file ini.
- [ ] Semua warna/spacing/radius/typo dari `src/theme/tokens.ts`,
      bukan literal baru.
- [ ] Gunakan primitif `shared/ui` (Card, Button, StatusBadge, Banner,
      Header, Screen, EmptyState) — buat primitif baru hanya jika
      belum ada.
- [ ] Jalankan `npx tsc --noEmit` dan `npx eslint .` sebelum selesai.
- [ ] Update file ini + sticker sheet bila menambah token/komponen baru.
