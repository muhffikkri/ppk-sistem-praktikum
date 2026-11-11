# Pembagian kerja Sprint 1 — 4 orang

Pembagian ini memisahkan area kode agar tiap orang dapat bekerja paralel. Pemilik produk menetapkan nama route, tipe, field, kondisi, dan aksi canonical di [`shared-contract.md`](shared-contract.md) sebelum implementasi paralel dimulai. Ikuti struktur repo yang sudah ada jika implementasi dimulai di repo aplikasi yang berbeda.

## Orang 1 — Fondasi aplikasi, navigasi, dan komponen bersama

**Tanggung jawab**

- Menyiapkan kerangka navigasi dan pemilihan mode Praktikan/Asisten.
- Menyiapkan layout responsif, header, tombol, badge status, dan keadaan kosong yang dipakai bersama.
- Menyambungkan route ke layar placeholder dari Orang 2 dan 3.

**Area file yang disarankan**

- `src/app/` untuk entry point, navigator, dan pemilihan role.
- `src/shared/ui/` untuk komponen UI bersama.

**Selesai bila**

- Pengguna dapat berganti mode demo dan indikator role aktif terlihat.
- Semua route inti dapat dibuka dan kembali dengan pola navigasi yang konsisten.
- Komponen bersama tidak mengandung aturan domain presensi atau sesi.

## Orang 2 — Alur Praktikan

**Tanggung jawab**

- Membangun jadwal dan detail sesi dari sudut pandang praktikan.
- Membangun aksi presensi, feedback berhasil, pencegahan presensi ganda, dan riwayat pribadi.
- Menangani kondisi sesi terjadwal/terbuka/tertutup dan kondisi sudah presensi.

**Area file yang disarankan**

- `src/features/student/` untuk screen, komponen khusus praktikan, dan ViewModel hook.

**Selesai bila**

- Presensi hanya tersedia untuk sesi terbuka.
- Presensi pertama menyimpan waktu lokal dan memberi feedback; aksi kedua pada sesi yang sama dicegah.
- Riwayat hanya menampilkan catatan praktikan demo.

## Orang 3 — Alur Asisten

**Tanggung jawab**

- Membangun jadwal dan detail sesi dari sudut pandang asisten.
- Membangun aksi buka/tutup sesi beserta perubahan status dan feedback.
- Membangun rekap praktikan hadir dan waktu presensi.

**Area file yang disarankan**

- `src/features/assistant/` untuk screen, komponen khusus asisten, dan ViewModel hook.

**Selesai bila**

- Transisi demo dari terjadwal, ke terbuka, lalu tertutup berjalan.
- Aksi yang tidak sesuai status tidak tersedia atau dinonaktifkan.
- Rekap memperlihatkan nama praktikan dan waktu presensi, termasuk keadaan kosong.

## Orang 4 — Model lokal, fixture, dan aturan state

**Tanggung jawab**

- Menetapkan tipe `Session`, `Attendance`, dan role demo yang dipakai bersama.
- Menyediakan fixture jadwal/kehadiran untuk masing-masing role; fixture boleh berbeda dan tidak tersinkron.
- Menyediakan fungsi atau reducer kecil untuk aturan bersama: buka/tutup sesi dan pencatatan presensi tanpa duplikasi.
- Menulis contoh pemakaian kontrak data untuk Orang 2 dan 3 sebelum mereka menghubungkan layar.

**Area file yang disarankan**

- `src/domain/` untuk tipe dan aturan domain sederhana.
- `src/data/fixtures/` untuk fixture lokal.
- `src/state/` hanya jika reducer/state bersama memang diperlukan.

**Selesai bila**

- Kedua alur role dapat memakai bentuk tipe yang disepakati tanpa memaksa dataset yang sama.
- Aturan buka/tutup dan presensi ganda berada di satu tempat yang jelas.
- Tidak ada client Supabase, auth, API, atau penyimpanan backend.

## Kontrak integrasi

- Pemilik produk mengisi dan memelihara [`shared-contract.md`](shared-contract.md); file itu menjadi satu-satunya sumber identifier final.
- Orang 4 mengimplementasikan tipe, fixture, dan signature aksi sesuai kontrak; ia tidak menetapkan nama pengganti.
- Orang 1 memakai nama route dari kontrak saat membuat navigator.
- Orang 2 dan 3 memakai tipe, field, kondisi, dan signature aksi dari kontrak untuk screen/ViewModel masing-masing.
- Masing-masing pemilik mengubah area file miliknya. Perubahan komponen bersama dikoordinasikan dengan Orang 1.
- Orang 2 memakai `useStudentAttendanceViewModel`; Orang 3 memakai `useAssistantSessionsViewModel` sesuai kontrak bersama.
- Jangan membuat integrasi sinkron antara state asisten dan praktikan.
- Integrasi akhir: Orang 1 menyambungkan seluruh route; Orang 2 dan 3 memastikan layar memakai kontrak; Orang 4 membantu resolusi konflik pada model/fixture.

## Urutan kerja yang disarankan

1. **Kickoff singkat:** sepakati route, tipe data, status sesi, dan kontrak ViewModel/action.
2. **Paralel:** Orang 1 membangun shell UI; Orang 4 menyiapkan tipe dan fixture; Orang 2 dan 3 membangun layar dengan kontrak tersebut atau data sementara.
3. **Integrasi:** hubungkan screen ke fixture/state lokal, lalu sambungkan navigator.
4. **Review silang:** cek checklist acceptance criteria PRD dan pastikan tidak ada Supabase/auth/backend.

## Catatan pola MVVM

MVVM digunakan ringan pada level fitur. View tidak memiliki aturan bisnis; ViewModel hook memegang state presentasi dan memanggil aksi domain; Model/fixture menyimpan bentuk data dan aturan lokal. Hindari membuat satu ViewModel global untuk seluruh aplikasi.
