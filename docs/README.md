# Pusat dokumentasi

Dokumen di repo ini adalah source of truth untuk perencanaan Sprint 1 aplikasi praktikum.

## Peta dokumen

- [`PRD.md`](PRD.md): ruang lingkup, checklist fitur, dan acceptance criteria.
- [`database.md`](database.md): rancangan skema Supabase untuk integrasi mendatang.
- [`sprint-1-work-split.md`](sprint-1-work-split.md): pembagian kerja empat orang dan kontrak integrasi.
- [`shared-contract.md`](shared-contract.md): sumber tunggal untuk nama route, tipe, field, kondisi, dan aksi final lintas fitur.
- [`../design.md`](../design.md): arahan tampilan, navigasi, dan interaksi.
- [`../spec/system-spec.md`](../spec/system-spec.md): batasan sistem dan kontrak implementasi Sprint 1.
- [`../CHANGELOG.md`](../CHANGELOG.md): catatan perubahan dokumen dan produk.

## Aturan untuk AI coding agents

1. Baca dokumen di atas sebelum mengubah atau menambah kode produk.
2. `spec/system-spec.md` menetapkan batas teknis Sprint 1; `PRD.md` menetapkan perilaku dan kriteria penerimaan. `design.md` menetapkan presentasi serta interaksi. `shared-contract.md` menjadi acuan tunggal identifier implementasi. `database.md` hanya rancangan untuk masa depan.
3. Jangan menganggap rancangan database sebagai izin untuk menambahkan koneksi Supabase, autentikasi, backend, atau migrasi pada Sprint 1.
4. Demo asisten dan praktikan menggunakan data dummy dan state lokal. Fixture kehadiran untuk tiap role boleh terpisah dan tidak perlu tersinkron.
5. Bila implementasi stack tersedia, ikuti pola serta dependensi yang sudah ada. Jangan menambahkan library tanpa kebutuhan yang jelas.
6. Bila kebutuhan baru bertentangan dengan dokumen ini, perbarui dokumen terkait dan `CHANGELOG.md` dalam perubahan yang sama. Jangan diam-diam mengubah kontrak.
7. Jangan mengedit file referensi tersinkron di `sources/`.

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
│   └── sprint-1-work-split.md
├── spec/
│   └── system-spec.md
└── sources/                 # referensi tersinkron; read-only
```
