# Pusat dokumentasi

Dokumen di repo ini adalah source of truth untuk perencanaan Sprint 1 dan Sprint 2 aplikasi praktikum.

## Peta dokumen Sprint 2 (Aktif — Data Dinamis dengan Firebase & AI)

- [`sprint-2-prd.md`](sprint-2-prd.md): ruang lingkup Sprint 2 berbasis SRS, 8 kebutuhan fungsional, kondisi wajib, dan 2 skenario demo akhir.
- [`sprint-2-firebase-and-ai.md`](sprint-2-firebase-and-ai.md): setup Firebase Expo, skema Cloud Firestore, `firestore.rules`, indeks, dan kontrak adapter API model AI pengajar.
- [`sprint-2-shared-contract.md`](sprint-2-shared-contract.md): sumber tunggal route, tipe domain TypeScript, aturan validasi, dan kontrak ViewModel hooks Sprint 2.
- [`sprint-2-work-split.md`](sprint-2-work-split.md): pembagian kerja 4 developer paralel, matriks kepemilikan file, dan strategi integrasi PM/Lead Developer.

## Peta dokumen Sprint 1 (Arsip Fondasi UI & Demo Lokal)

- [`PRD.md`](PRD.md): ruang lingkup, checklist fitur, dan acceptance criteria Sprint 1.
- [`database.md`](database.md): rancangan skema Supabase historis (digantikan oleh Firebase pada Sprint 2).
- [`sprint-1-work-split.md`](sprint-1-work-split.md): pembagian kerja empat orang Sprint 1.
- [`shared-contract.md`](shared-contract.md): kontrak identifier Sprint 1.
- [`../design.md`](../design.md): arahan tampilan, navigasi, dan interaksi.
- [`../spec/system-spec.md`](../spec/system-spec.md): batasan sistem dan kontrak implementasi Sprint 1.
- [`../CHANGELOG.md`](../CHANGELOG.md): catatan perubahan dokumen dan produk.

## Aturan untuk AI coding agents

1. Baca dokumen Sprint 2 di atas (serta `design.md` untuk token dan primitif UI) sebelum mengubah atau menambah kode produk Sprint 2.
2. `sprint-2-prd.md` menetapkan perilaku dan batas ruang lingkup SRS; `sprint-2-firebase-and-ai.md` menetapkan skema Firestore, Security Rules, dan adapter AI; `sprint-2-shared-contract.md` menjadi acuan tunggal identifier implementasi Sprint 2.
3. Jangan menambahkan fitur di luar kebutuhan SRS Sprint 2 (seperti QR scanner, upload file, push notification, atau keputusan izin otomatis oleh AI).
4. Bila implementasi stack tersedia, ikuti pola serta dependensi yang sudah ada. Jangan menambahkan library tanpa kebutuhan yang jelas.
5. Bila kebutuhan baru bertentangan dengan dokumen ini, perbarui dokumen terkait dan `CHANGELOG.md` dalam perubahan yang sama. Jangan diam-diam mengubah kontrak.
6. Jangan mengedit file referensi tersinkron di `sources/`.

## Struktur repo yang disarankan

```text
.
├── CHANGELOG.md
├── design.md
├── docs/
│   ├── README.md
│   ├── PRD.md
│   ├── database.md
│   ├── shared-contract.md
│   ├── sprint-1-work-split.md
│   ├── sprint-2-prd.md
│   ├── sprint-2-firebase-and-ai.md
│   ├── sprint-2-shared-contract.md
│   └── sprint-2-work-split.md
├── spec/
│   └── system-spec.md
└── sources/                 # referensi tersinkron; read-only
```
