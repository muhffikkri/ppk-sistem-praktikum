# PRD — Sprint 2: Data Dinamis dengan Firebase

> Dokumen ini disusun **hanya** berdasarkan SRS Sprint 2 (*Data Dinamis dengan Firebase*). Jangan menambahkan fitur di luar kebutuhan yang ditetapkan di bawah ini.

## Ringkasan

Mengembangkan aplikasi React Native (`ppk-mobile`) dari Sprint 1 agar dapat digunakan oleh banyak pengguna dengan akun masing-masing secara real-time dan persisten. Aplikasi mengintegrasikan:

- **Firebase Authentication** sebagai sumber identitas dan autentikasi pengguna (`student` / `assistant`).
- **Cloud Firestore** sebagai penyimpanan utama dan sinkronisasi data real-time untuk kelas, peserta, jadwal, sesi praktikum, presensi, dan pengajuan izin.
- **API Model AI Pengajar** sebagai pemberi prediksi kategori alasan pada pengajuan izin (bersifat pendukung, bukan penentu keputusan).

## Tujuan

- Menggantikan mode demo lokal dan data dummy terpisah dari Sprint 1 dengan akun nyata dan data bersama yang konsisten antar pengguna secara real-time.
- Memungkinkan asisten mengelola data praktikum (kelas, peserta, jadwal, sesi), membuka/menutup sesi, memantau rekap kehadiran secara langsung, dan memeriksa pengajuan izin.
- Memungkinkan praktikan melihat jadwal dan sesi terkait dirinya, melakukan presensi satu kali saat sesi terbuka, serta mengajukan dan memantau status izin yang diperkaya klasifikasi AI.

## Persona & Peran Pengguna

| Peran | Nilai Kode | Kewenangan Inti |
| --- | --- | --- |
| **Praktikan** | `student` | Registrasi/login/logout, melihat jadwal & sesi kelas yang diikuti, melakukan presensi saat sesi `open` (maksimal 1 kali per sesi), mengajukan izin beserta alasan, dan memantau status pengajuan izinnya. |
| **Asisten** | `assistant` | Registrasi/login/logout, CRUD kelas, peserta, jadwal, dan sesi praktikum, membuka/menutup sesi, melihat rekap kehadiran real-time, serta memeriksa dan menerima/menolak pengajuan izin. |

> Mode pemilihan peran lokal (`PovContext` / demo switch) pada Sprint 1 dihapus dan digantikan oleh identitas serta peran dari akun yang terautentikasi.

## Kebutuhan Fungsional & Acceptance Criteria

### R1 — Autentikasi Pengguna

- [ ] Pengguna dapat melakukan **registrasi** dengan nama lengkap, email, password, dan pemilihan peran (`Praktikan` atau `Asisten`).
- [ ] Pengguna dapat melakukan **login** dengan email dan password.
- [ ] Pengguna dapat melakukan **logout** dari halaman profil/akun.
- [ ] Profil pengguna (`uid`, `displayName`, `email`, `role`, `createdAt`) tersimpan di Firestore saat registrasi dan dimuat saat login.
- [ ] Aplikasi menampilkan informasi dan menyediakan tindakan hanya sesuai peran pengguna yang sedang login.
- [ ] Pengguna yang belum login diarahkan ke alur autentikasi dan tidak dapat mengakses layar atau data praktikum.

**Diterima bila:** pengguna baru bisa mendaftar sebagai praktikan atau asisten, login/logout berjalan dengan persistensi sesi, dan antarmuka terkunci sesuai peran akun.

### R2 — Pengelolaan Data Praktikum (CRUD Asisten & Tampilan Praktikan)

- [ ] Data **kelas**, **peserta**, **jadwal**, dan **sesi praktikum** disimpan di Cloud Firestore.
- [ ] **Asisten** dapat melakukan operasi **Tambah, Lihat, Ubah, dan Hapus (CRUD)** untuk:
  - Kelas praktikum (mata praktikum, kode/nama kelas).
  - Peserta pada kelas (menambah dan menghapus praktikan terdaftar ke/dari kelas).
  - Jadwal dan sesi praktikum (kelas terkait, waktu mulai, waktu selesai, lokasi lab opsional).
- [ ] **Praktikan** hanya dapat melihat jadwal dan informasi sesi dari kelas yang mengikutsertakan dirinya sebagai peserta.

**Diterima bila:** asisten dapat membuat/mengubah/menghapus kelas, mengatur peserta, dan membuat/mengubah/menghapus jadwal sesi; praktikan yang terdaftar otomatis melihat jadwal sesi kelasnya.

### R3 — Presensi Terintegrasi

- [ ] Praktikan hanya dapat melakukan presensi ketika sesi berstatus `open`.
- [ ] Data kehadiran disimpan di Firestore dengan referensi identitas praktikan (`studentId` = `uid`) dan sesi (`sessionId`).
- [ ] Praktikan tidak dapat melakukan presensi lebih dari satu kali pada sesi yang sama (dicegah di UI, ViewModel, maupun struktur dokumen/Security Rules Firestore).
- [ ] Praktikan tidak dapat melakukan presensi pada sesi yang berstatus `scheduled` atau `closed`, maupun pada sesi dari kelas yang tidak diikutinya.

**Diterima bila:** presensi berhasil tercatat sekali saat sesi terbuka, tersimpan permanen di Firestore, dan percobaan kedua ditolak dengan pesan yang jelas.

### R4 — Sinkronisasi Data Real-Time & Persistensi

- [ ] Perubahan status sesi (dibuka/ditutup oleh asisten), pencatatan presensi oleh praktikan, dan rekap kehadiran asisten diperbarui otomatis melalui real-time listener (`onSnapshot`) tanpa perlu restart aplikasi atau refresh manual.
- [ ] Pengajuan izin baru dan perubahan keputusan izin juga tersinkronisasi secara real-time antara praktikan dan asisten.
- [ ] Seluruh data dan sesi login tetap tersedia ketika aplikasi ditutup dan dibuka kembali.

**Diterima bila:** dua perangkat/sesi berbeda (asisten dan praktikan) melihat perubahan status sesi, presensi, dan status izin secara langsung, dan data tetap utuh setelah aplikasi dibuka ulang.

### R5 — Pengajuan Izin

- [ ] Praktikan dapat mengajukan izin untuk sesi tertentu (dari kelas yang diikutinya) dengan mengisi alasan ketidakhadiran.
- [ ] Validasi input memastikan alasan ketidakhadiran tidak kosong sebelum dikirim.
- [ ] Pengajuan disimpan di Firestore dengan status awal wajib `pending`.
- [ ] Praktikan dapat melihat daftar pengajuan izin miliknya beserta status terkini (`Menunggu`, `Diterima`, atau `Ditolak`).

**Diterima bila:** praktikan dapat mengirim pengajuan izin pada suatu sesi, pengajuan tersimpan di Firestore berstatus `pending`, dan muncul di riwayat/daftar izin praktikan.

### R6 — Integrasi AI (Klasifikasi Alasan Izin)

- [ ] Saat praktikan mengajukan izin, aplikasi mengirimkan teks alasan ke API model AI yang disediakan pengajar untuk memperoleh prediksi kategori alasan.
- [ ] Hasil klasifikasi AI (misalnya kategori dan informasi pendukung) ditampilkan kepada pengguna dan disimpan bersama dokumen pengajuan izin di Firestore.
- [ ] **Model AI tidak menentukan apakah izin diterima atau ditolak.** Status awal pengajuan tetap `pending` apa pun hasil prediksi AI.
- [ ] Jika layanan AI tidak merespons, timeout, atau mengembalikan error, aplikasi menampilkan pemberitahuan bahwa klasifikasi AI tidak tersedia dan tetap memungkinkan pengajuan disimpan dengan penanda klasifikasi tidak tersedia (atau retry tanpa memblokir alur utama), tanpa keputusan otomatis.

**Diterima bila:** hasil klasifikasi model AI tersimpan dan tampil sebagai info pendukung, status izin tetap `pending`, dan kegagalan API AI tidak merusak alur pengajuan maupun membuat keputusan otomatis.

### R7 — Pemeriksaan Izin oleh Asisten

- [ ] Asisten dapat melihat daftar pengajuan izin untuk sesi/kelas yang dikelolanya.
- [ ] Setiap item menampilkan identitas praktikan, sesi terkait, alasan ketidakhadiran, hasil klasifikasi AI (atau status jika AI tidak tersedia), dan status pengajuan.
- [ ] Asisten dapat memilih **Terima** (`approved`) atau **Tolak** (`rejected`) pada pengajuan yang masih berstatus `pending`.
- [ ] Keputusan beserta waktu dan identitas asisten pemeriksa tersimpan di Firestore dan langsung terlihat oleh praktikan.

**Diterima bila:** asisten dapat meninjau alasan + prediksi AI lalu menyimpan keputusan terima/tolak, dan praktikan melihat pembaruan status tersebut secara real-time.

### R8 — Validasi, Penanganan Kondisi Khusus, dan Keamanan Data

- [ ] Validasi input diterapkan di sisi UI/ViewModel untuk seluruh formulir (auth, CRUD praktikum, dan pengajuan izin).
- [ ] Pesan kesalahan yang mudah dipahami ditampilkan saat terjadi kegagalan autentikasi, kesalahan komunikasi Firestore, maupun gangguan layanan AI.
- [ ] Akses baca dan tulis ke Firestore dibatasi di server melalui **Firebase Security Rules** sesuai identitas (`request.auth.uid`) dan peran (`student` / `assistant`).
- [ ] Seluruh kondisi antarmuka wajib berikut ditangani dengan jelas:

| Kondisi | Perilaku yang Diharapkan |
| --- | --- |
| **Belum login** | Mengarahkan pengguna ke layar Login/Register; tidak memuat atau menampilkan data praktikum. |
| **Data masih dimuat (`loading`)** | Menampilkan indikator pemuatan (`ActivityIndicator` / status memuat) dan menonaktifkan aksi duplikat saat proses berlangsung. |
| **Daftar data kosong (`empty`)** | Menampilkan `EmptyState` yang informatif (mis. belum ada kelas, sesi, kehadiran, atau pengajuan izin). |
| **Koneksi terganggu / gagal Firestore** | Menampilkan banner/pesan error non-destruktif serta opsi coba lagi tanpa membuat aplikasi crash. |
| **Layanan AI tidak merespons** | Menampilkan informasi bahwa prediksi AI gagal/tidak tersedia; izin tetap tersimpan berstatus `pending` tanpa keputusan otomatis. |

## Batas Ruang Lingkup (Anti Scope Creep)

### Termasuk di Sprint 2

- Firebase Authentication (register, login, logout, role `student`/`assistant`, persistensi sesi).
- Cloud Firestore CRUD (kelas, peserta, jadwal/sesi) dan real-time listener.
- Presensi terintegrasi + pencegahan presensi ganda.
- Pengajuan izin, pemanggilan API model AI pengajar untuk klasifikasi alasan, dan pemeriksaan izin oleh asisten.
- Firebase Security Rules & validasi input/error/loading/empty/offline.

### Tidak Termasuk (Jangan Dikerjakan Kecuali Diminta SRS Baru)

- Scan QR code kamera, geofencing/GPS check-in, atau notifikasi push (FCM).
- Upload file/lampiran surat dokter ke Firebase Storage (SRS hanya meminta pengisian **alasan ketidakhadiran**).
- Ekspor PDF/CSV/Excel, analitik lanjutan, atau fitur chat.
- Pengambilan keputusan izin otomatis oleh AI.
- Manajemen modul materi atau pengaturan notifikasi fungsional (layar dummy Sprint 1 tidak perlu dikembangkan menjadi backend baru).

## Skenario Demo Akhir (Wajib Berjalan End-to-End)

### Alur 1 — Presensi Terintegrasi Real-Time

1. Asisten login menggunakan akun ber-role `assistant` (dan memastikan kelas/peserta/sesi tersedia atau dibuat melalui fitur CRUD).
2. Asisten membuka sesi berstatus `scheduled` → status berubah menjadi `open` di Firestore.
3. Praktikan (yang terdaftar sebagai peserta kelas tersebut) login menggunakan akun ber-role `student`.
4. Praktikan melihat sesi tersebut berubah menjadi `open` secara real-time, lalu melakukan presensi.
5. Data presensi tersimpan di Firestore (percobaan presensi kedua dicegah).
6. Asisten melihat praktikan tersebut langsung muncul di rekap kehadiran secara real-time tanpa restart aplikasi.
7. Asisten menutup sesi → status menjadi `closed` secara real-time dan tombol presensi tidak lagi aktif.

### Alur 2 — Pengajuan Izin, Klasifikasi AI, dan Keputusan Asisten

1. Praktikan login menggunakan akun ber-role `student`.
2. Praktikan memilih sesi terkait dan mengisi alasan ketidakhadiran pada form pengajuan izin.
3. Aplikasi mengirim alasan ke API model AI pengajar, menampilkan kategori prediksi sebagai informasi pendukung, dan menyimpan pengajuan beserta hasil klasifikasi ke Firestore dengan status `pending`.
4. Asisten login menggunakan akun ber-role `assistant`, membuka daftar pengajuan izin, meninjau alasan serta hasil klasifikasi AI, lalu memberikan keputusan **Terima** atau **Tolak**.
5. Keputusan tersimpan di Firestore dan status pengajuan pada sisi praktikan langsung berubah sesuai keputusan asisten secara real-time.

