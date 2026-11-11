# System Spec — Sprint 1

## Tujuan sistem

Aplikasi React Native mendemonstrasikan alur jadwal, pembukaan/penutupan sesi praktikum, presensi, dan rekap dari dua mode lokal: Praktikan dan Asisten.

## Batas arsitektur

- UI dan navigasi berjalan dalam aplikasi mobile React Native.
- State interaksi disimpan secara lokal selama demo.
- Jadwal, sesi, profil demo, dan kehadiran berasal dari dummy data/fixture.
- Fixture asisten dan praktikan dapat dipisah; tidak ada jaminan konsistensi silang-role.
- Tidak ada Supabase, auth, API, backend, sinkronisasi, atau migrasi pada Sprint 1.
- Skema database masa depan dijelaskan di [`../docs/database.md`](../docs/database.md).
- Identifier implementasi lintas fitur ditetapkan hanya di [`../docs/shared-contract.md`](../docs/shared-contract.md); model dan nama konseptual di dokumen ini bukan kontrak nama kode.

## Pola implementasi

- Gunakan MVVM ringan per fitur: View berupa screen/component React Native, ViewModel berupa custom hook, dan Model berupa tipe domain, aturan, serta fixture.
- View membaca state dari ViewModel dan memanggil aksi; ViewModel memvalidasi aturan (sesi harus terbuka, presensi tidak boleh duplikat) dan memperbarui state lokal.
- Gunakan `useState` untuk state sederhana atau `useReducer` bila transisi sesi/presensi perlu dikelompokkan.
- Susun folder berdasarkan fitur/domain; struktur fitur dan MVVM saling melengkapi.
- Pisahkan fixture asisten dan praktikan jika diperlukan untuk menunjukkan bahwa demo kedua role tidak tersinkron.
- Hindari class ViewModel, state manager global, repository abstrak, dependency injection, atau lapisan use-case terpisah sebelum kebutuhan muncul.

## Model domain lokal

### Data sesi dan kehadiran

Model lokal perlu merepresentasikan identitas sesi, nama praktikum, kelas, waktu jadwal, status sesi, waktu buka/tutup bila tersedia, serta catatan kehadiran dengan identitas praktikan dan waktu presensi. Nama tipe, field, dan nilai kondisi yang dipakai kode hanya ditetapkan dalam [kontrak bersama](../docs/shared-contract.md). Fixture boleh memiliki kebutuhan presentasi tambahan selama maknanya konsisten dengan rancangan database masa depan.

## Aturan perilaku

1. Hanya mode asisten yang dapat mengubah status sesi.
2. Sesi demo bergerak dari terjadwal menjadi terbuka lalu tertutup. Tidak ada pembukaan kembali kecuali PRD diperbarui.
3. Hanya sesi yang sedang terbuka yang menerima presensi.
4. Praktikan yang sama hanya memiliki satu presensi pada sesi yang sama; aksi ulang harus ditolak/diabaikan dan UI mempertahankan catatan pertama.
5. Waktu presensi dibuat saat aksi berhasil dan ditampilkan kepada praktikan serta pada rekap fixture yang sama.
6. Perubahan status/rekap pada fixture satu role tidak wajib terlihat pada role lain.
7. UI harus memberi feedback atas keberhasilan atau alasan aksi tidak tersedia.

## Navigasi minimum

- Pemilihan mode role.
- Jadwal untuk role aktif.
- Detail sesi.
- Rekap sesi untuk asisten.
- Riwayat kehadiran untuk praktikan.

Susunan tab/stack dan library mengikuti proyek saat kode tersedia; jangan menambahkan dependensi navigasi hanya berdasarkan dokumen ini jika proyek telah memiliki pola.

## Kualitas non-fungsional

- Responsif pada lebar layar ponsel umum; informasi inti tidak terpotong.
- Status dibedakan oleh teks dan bukan warna saja.
- Kontrol memiliki label yang jelas dan target sentuh yang layak.
- Data kosong, daftar panjang, dan nama yang panjang ditangani dengan layout yang tetap terbaca.
- Tidak ada klaim keamanan atau persistensi server.

## Kontrak untuk integrasi mendatang

- Gunakan skema `docs/database.md` sebagai rancangan awal, bukan implementasi yang sudah tersedia.
- Integrasi kelak perlu menambahkan auth, RLS, aturan akses berbasis keanggotaan kelompok, serta penanganan konflik/duplikasi server-side sebelum dipakai dengan data nyata.
- Saat koneksi backend mulai dikerjakan, buat perubahan PRD/spec/database yang eksplisit agar sumber kebenaran tetap sejalan.

## Pengecekan dokumentasi

Tidak ada kode aplikasi dalam repo saat dokumen ini dibuat. Implementasi atau pengujian aplikasi bukan bagian dari perubahan dokumentasi ini.
