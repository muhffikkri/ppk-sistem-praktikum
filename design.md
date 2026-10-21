# Design — Aplikasi Praktikum

## Prinsip

- **Status mudah dipahami:** sesi terjadwal, terbuka, dan tertutup memakai label teks konsisten; warna hanya penguat.
- **Aksi sesuai konteks:** tombol presensi hanya aktif untuk sesi terbuka; kontrol buka/tutup hanya tersedia pada role asisten.
- **Fokus satu tugas:** jadwal menjadi titik masuk, detail sesi menjadi tempat aksi dan informasi lengkap.
- **Responsif:** utamakan satu kolom yang nyaman disentuh pada ponsel; konten memanjang boleh discroll dan tidak boleh tertutup area sistem.
- **Feedback langsung:** setelah aksi lokal, tampilkan konfirmasi dan perbarui state/label yang berkaitan.

## Navigasi yang disarankan

```text
Pemilihan role
├── Praktikan
│   ├── Jadwal → Detail sesi → Presensi
│   └── Riwayat kehadiran
└── Asisten
    ├── Jadwal → Detail sesi → Buka/Tutup sesi
    └── Rekap kehadiran sesi
```

Gunakan pola navigasi yang sudah dipakai proyek bila aplikasi tersedia. Pilihan role hanya mode demo lokal.

## Pola implementasi yang disarankan

MVVM dapat digunakan secara ringan dan cocok untuk menjaga layar tetap fokus pada presentasi. Terapkan per fitur: **View** adalah screen/component React Native, **ViewModel** adalah custom hook yang menyiapkan data dan menangani aksi UI, dan **Model** adalah tipe domain, aturan, serta fixture lokal. Nama hook dan identifier final ditetapkan di [kontrak bersama](docs/shared-contract.md).

Pertahankan aliran data satu arah: View membaca state dari ViewModel dan memanggil aksi; ViewModel memvalidasi aturan, memperbarui state lokal, lalu View dirender ulang. Gunakan state React sesuai kebutuhan. Struktur folder berbasis fitur melengkapi MVVM; keduanya menjawab hal berbeda.

Jaga ViewModel tetap berupa hook sederhana. Untuk sprint ini belum perlu class ViewModel, state manager global, repository abstrak, dependency injection, atau lapisan use-case terpisah kecuali kompleksitas nyata menuntutnya. Fixture role asisten dan praktikan boleh dipisahkan.

## Layar dan elemen

### Pemilihan role

Dua pilihan utama dengan deskripsi ringkas: “Praktikan” untuk presensi/riwayat dan “Asisten” untuk pengelolaan/rekap. Tampilkan indikator role aktif setelah masuk.

### Jadwal

Kelompokkan sesi secara mudah dipindai. Setiap kartu/baris memuat nama praktikum, kelas, waktu, dan badge status. Area kartu dapat membuka detail; hindari tombol kecil yang sulit disentuh.

### Detail sesi

Tampilkan nama praktikum, kelas, tanggal/waktu, status, dan aksi sesuai role. Pada praktikan tampilkan status presensi saat ini serta waktu presensi jika sudah berhasil. Pada asisten tampilkan jumlah hadir dan aksi buka/tutup.

### Rekap asisten

Daftar nama praktikan dan waktu kehadiran. Sediakan keadaan kosong dengan keterangan bahwa belum ada presensi pada fixture demo.

### Riwayat praktikan

Daftar catatan milik praktikan yang sedang dipilih dalam demo; tampilkan nama sesi, tanggal, status/catatan hadir, serta waktu presensi jika tersedia.

## Status dan feedback

| Status sesi | Praktikan                                                                               | Asisten                                  |
| ----------- | --------------------------------------------------------------------------------------- | ---------------------------------------- |
| Terjadwal   | Presensi nonaktif; tampilkan alasan sesi belum dibuka.                                  | Tawarkan Buka sesi.                      |
| Terbuka     | Tawarkan Presensi bila belum tercatat; jika sudah, tampilkan waktu dan cegah duplikasi. | Tawarkan Tutup sesi dan tampilkan rekap. |
| Tertutup    | Presensi nonaktif; riwayat tetap dapat dibaca.                                          | Tampilkan status tertutup dan rekap.     |

Setiap aksi harus memberi feedback singkat yang terlihat, misalnya banner/alert sukses. Gunakan teks yang konsisten: “Sesi dibuka”, “Sesi ditutup”, dan “Presensi berhasil pukul …”. Jangan menyatakan aksi tersimpan ke server.

## Aksesibilitas dan layout

- Pertahankan kontras teks dan indikator status yang memadai.
- Beri label aksesibel pada kontrol; jangan bergantung pada ikon saja.
- Gunakan target sentuh yang nyaman dan jarak antaraksi yang cukup.
- Pastikan daftar dan detail dapat discroll, termasuk saat keyboard tampil pada form bila kelak diperlukan.
- Tangani daftar kosong dan teks nama praktikum/kelas yang panjang tanpa overflow.

## Fixture dan state

Pisahkan fixture role asisten dan praktikan jika mendukung demo yang lebih jelas. Perubahan lokal asisten tidak harus mengubah status yang dibaca praktikan. Untuk fixture praktikan, gunakan identitas demonstrasi yang tetap agar presensi kedua pada sesi yang sama bisa dicegah. State tidak dijanjikan bertahan setelah aplikasi dimulai ulang kecuali implementasi memilih penyimpanan lokal secara eksplisit.
