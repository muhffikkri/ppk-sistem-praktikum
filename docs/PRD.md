# PRD — Sprint 1: Antarmuka dan Alur Praktikum

## Ringkasan

Aplikasi React Native untuk mendemonstrasikan alur pencatatan kehadiran praktikum dari dua sudut pandang: praktikan dan asisten. Sprint ini membangun antarmuka responsif, navigasi, state lokal, dan data dummy. Semua interaksi berjalan di perangkat tanpa layanan jarak jauh.

## Tujuan

- Praktikan dapat memahami jadwal, status sesi, melakukan presensi saat sesi dibuka, dan melihat riwayat kehadirannya.
- Asisten dapat meninjau jadwal, membuka/menutup sesi, dan melihat rekap kehadiran.
- Alur demo dapat diperagakan dengan jelas walaupun data antar-role tidak tersinkron.

## Persona dan alur utama

### Praktikan

1. Membuka tab Jadwal dan meninjau sesi beserta praktikum, kelas, waktu, dan status.
2. Membuka detail sesi.
3. Jika sesi berstatus terbuka, menekan tombol Presensi dan menerima konfirmasi beserta waktu.
4. Melihat catatan kehadirannya sendiri.

### Asisten

1. Membuka daftar jadwal dan memilih sesi.
2. Membuka sesi yang belum dimulai, lalu melihat perubahan status menjadi terbuka.
3. Memantau daftar praktikan yang hadir serta waktu presensinya.
4. Menutup sesi, lalu melihat status tertutup dan aksi presensi tidak lagi tersedia.

Pemilihan role adalah kontrol demonstrasi lokal, bukan autentikasi atau otorisasi keamanan.

## Batas Sprint

### Termasuk

- UI responsif untuk ukuran layar ponsel yang umum.
- Navigasi antara pemilihan role, jadwal, detail sesi, rekap asisten, dan riwayat praktikan.
- State lokal untuk aksi buka/tutup sesi dan presensi.
- Data dummy/fixture lokal untuk jadwal, sesi, dan kehadiran.
- Rancangan skema database Supabase sebagai dokumentasi saja.

### Tidak termasuk

- Koneksi Supabase, query database, migrasi, atau sinkronisasi data.
- Login, autentikasi, manajemen akun, dan otorisasi backend.
- API/backend, notifikasi, QR code, geolokasi, ekspor laporan, atau operasi offline tersinkron.
- Sinkronisasi antara fixture atau state asisten dan praktikan. Kedua role boleh menampilkan dataset demo masing-masing.

## Checklist fitur dan acceptance criteria

### F1 — Pemilihan sudut pandang

- [ ] Tersedia cara yang jelas untuk masuk sebagai Praktikan atau Asisten.
- [ ] Role aktif terlihat pada antarmuka dan dapat diganti untuk demonstrasi.
- [ ] Pergantian role tidak mengklaim bahwa pengguna telah login.

**Diterima bila:** pengguna dapat mengakses alur masing-masing role dari perangkat yang sama dan memahami role yang sedang didemonstrasikan.

### F2 — Jadwal dan detail sesi

- [ ] Daftar jadwal menampilkan nama praktikum, kelas, tanggal/waktu, dan status.
- [ ] Pengguna dapat membuka detail sesi dari daftar.
- [ ] Detail menampilkan informasi jadwal dan status yang sama dengan daftar.
- [ ] Status memiliki label teks yang terbaca, bukan hanya perbedaan warna.
- [ ] Tampilan tetap dapat digunakan pada layar sempit tanpa konten penting terpotong.

**Diterima bila:** praktikan dan asisten dapat menemukan sesi dan memahami kapan sesi berlangsung serta statusnya.

### F3 — Pengelolaan sesi oleh asisten

- [ ] Asisten dapat membuka sesi yang belum terbuka.
- [ ] Asisten dapat menutup sesi yang sedang terbuka.
- [ ] Status berubah segera di tampilan terkait setelah aksi berhasil.
- [ ] Aksi yang tidak sesuai status (membuka sesi terbuka atau menutup sesi tertutup) tidak ditawarkan atau dinonaktifkan.
- [ ] Praktikan melihat status berdasarkan fixture role praktikan; tidak wajib mengikuti perubahan lokal asisten.

**Diterima bila:** alur asisten menunjukkan status terjadwal → terbuka → tertutup dengan feedback yang jelas.

### F4 — Pencatatan presensi

- [ ] Presensi hanya dapat dilakukan ketika sesi pada fixture praktikan berstatus terbuka.
- [ ] Presensi mencatat waktu lokal saat aksi dilakukan.
- [ ] Setelah berhasil, UI memberi konfirmasi dan memperbarui catatan praktikan.
- [ ] Praktikan yang sama tidak dapat melakukan presensi kedua kali pada sesi yang sama dalam state lokal demo.
- [ ] Presensi tidak dapat dilakukan saat sesi terjadwal atau tertutup.

**Diterima bila:** satu aksi pada sesi terbuka menghasilkan satu catatan dengan waktu, konfirmasi terlihat, dan tombol tidak memungkinkan duplikasi.

### F5 — Rekap dan riwayat

- [ ] Asisten dapat melihat daftar praktikan yang hadir pada sesi serta waktu presensi masing-masing.
- [ ] Praktikan dapat melihat catatan kehadiran miliknya sendiri.
- [ ] Keadaan tanpa data menampilkan pesan kosong yang membantu.
- [ ] Data rekap asisten dan riwayat praktikan boleh berasal dari fixture terpisah.

**Diterima bila:** tiap role hanya perlu menampilkan sudut pandang demo yang relevan, tanpa klaim sinkronisasi.

### F6 — Kualitas interaksi

- [ ] Aksi utama memiliki label yang jelas dan feedback sukses/gagal yang terlihat.
- [ ] Tombol aksi memiliki status aktif/nonaktif sesuai konteks sesi.
- [ ] Navigasi menyediakan cara yang konsisten untuk kembali ke daftar.
- [ ] Layout tetap terbaca saat konten panjang atau daftar kosong.

**Diterima bila:** alur inti dapat diselesaikan tanpa menebak fungsi kontrol.

## Skenario demo minimum

1. Sebagai asisten, buka sesi terjadwal dan tunjukkan perubahan status serta rekap.
2. Tutup sesi dan tunjukkan perubahan status.
3. Beralih ke praktikan, buka fixture sesi yang berstatus terbuka, lakukan presensi, lalu tampilkan waktu dan konfirmasi.
4. Coba presensi ulang pada sesi yang sama dan tunjukkan bahwa aksi dicegah.
5. Tunjukkan sesi tertutup/terjadwal yang tidak mengizinkan presensi.

Karena dataset antar-role dapat terpisah, skenario ini adalah rangkaian demonstrasi dan bukan simulasi kolaborasi real-time.

## Asumsi terbuka

- Zona waktu tampilan mengikuti zona waktu lokal perangkat; penyimpanan backend kelak menggunakan `timestamptz`.
- Detail visual, nama komponen, dan library navigasi mengikuti proyek ketika kode aplikasi tersedia.
- Identitas demo praktikan bersifat tetap selama sesi demo lokal agar pencegahan presensi ganda dapat diperlihatkan.
