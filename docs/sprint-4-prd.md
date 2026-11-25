# PRD Sprint 4: Pengelolaan Lab, Presensi, dan Pembayaran Denda

**Produk:** PPK Mobile

**Sumber kebutuhan:** Pertemuan 9, bagian Sprint 4, halaman 1–3.

**Status:** Usulan untuk review tim. Bagian *Catatan komunikasi* menandai keputusan yang perlu disepakati sebelum integrasi.

## Tujuan dan ruang lingkup

Sprint 4 memisahkan kewenangan Aslab dan Asprak, menambahkan pengelolaan serta pemantauan lab per mata kuliah, dan menghubungkan keterlambatan dengan tagihan denda yang bisa dibayar melalui Midtrans Sandbox. Tampilan seluruh peran difinalisasi dengan komponen dan pola UI PPK Mobile yang sudah ada.

| Peran | Akses di Sprint 4 |
| --- | --- |
| **Aslab** | Mengelola lab dan penempatan praktikan serta Asprak untuk mata kuliah dalam tanggung jawabnya. Mengatur lokasi, radius presensi, dan toleransi keterlambatan. Melihat dashboard aktivitas dan riwayat pendapatan denda dalam cakupannya. |
| **Asprak** | Melihat kelas, jadwal, dan sesi yang ditugaskan. Membuka/menutup sesi, memantau serta mengelola presensi, dan memutuskan pengajuan izin. Konfigurasi master lab dan distribusi orang menjadi kewenangan Aslab. |
| **Praktikan** | Mengikuti jadwal, presensi, dan mengajukan izin seperti alur sebelumnya. Melihat serta membayar tagihan sendiri, membuka riwayat transaksi, dan menerima pemberitahuan yang relevan. |

Di luar ruang lingkup: pembayaran dengan uang sungguhan, pemindahan jadwal sebagai bagian dari pemindahan orang, denda progresif, dan denda baru untuk absen tanpa izin. Refund otomatis belum ditetapkan dalam materi. Jika kasus pembayaran yang sudah berhasil perlu direkonsiliasi, tim harus menyepakati kebijakannya sebelum membuka checkout.

## Fondasi yang dipakai kembali

Baseline yang diperiksa adalah `main` pada commit `5bf557e`. Daftar ini menjelaskan kode yang tersedia untuk dipakai kembali. Ketersediaan kode tidak menggantikan uji integrasi atau deployment.

| Fondasi di repo | Pemakaian Sprint 4 |
| --- | --- |
| Firebase Auth dan profil `users/{uid}`, dengan role kode `student` dan `assistant` | Tambahkan role Aslab dan hubungan penugasan per mata kuliah. Gunakan `assistant` sebagai Asprak untuk menjaga kompatibilitas akun yang ada. PRD Sprint 2 juga menyebut admin, tetapi tipe role dan Rules baseline belum memuatnya. |
| Master `labs`, geofence, peta, dan `sessions.labId` | Gunakan ulang form, validasi koordinat/radius, pemilih lokasi, dan identitas lab. Tambahkan cakupan mata kuliah serta kebijakan presensi. |
| `classes` dan `sessions` dengan `assistantIds` dan `participantIds` | Pertahankan kontrak daftar akses dan listener saat penempatan orang berubah. Gunakan data kelas/sesi yang sama untuk dashboard. |
| Presensi geofence/QR, rekap, dan dokumen deterministik `attendance/{sessionId}_{studentId}` | Pertahankan validasi presensi dan anti-duplikasi. `checkedInAt` saat ini berasal dari jam perangkat di jalur geofence, sehingga sumber waktu untuk keputusan denda perlu ditetapkan di backend. |
| `leave_requests` dengan `pending`, `approved`, dan `rejected` | Pakai keputusan Asprak untuk menentukan status izin serta pengecualian denda. Klasifikasi AI tetap menjadi informasi pendukung. |
| Inbox notifikasi, token, dan antrean push Firebase Functions | Tambahkan kejadian pembayaran ke jalur yang sudah ada dan arahkan pengguna ke rincian tagihan/riwayat. |
| `src/shared/ui/` dan `src/theme/` | Gunakan kembali token, komponen form, status, daftar, dan pola penanganan error untuk semua layar. |

## Urutan SRS dan pembagian programmer

Nomor SRS unik dan berurutan. Urutan ini memetakan kepemilikan. Implementasi UI, pengujian logika, dan pengembangan backend dapat berjalan paralel setelah kontrak inti disepakati.

| Programmer | Urutan SRS | Tanggung jawab | Bagian yang menjadi miliknya |
| --- | --- | --- | --- |
| **1** | **4.01–4.06** | Aslab, master lab, dan distribusi pengguna | Auth/role Aslab, layanan lab dan penempatan, tiga alur impor beserta template dan pratinjau |
| **2** | **4.07–4.11** | Operasional Asprak, presensi, izin, dan aturan denda | Alur sesi/rekap Asprak, aturan waktu, pencatatan status kehadiran, dan penerbit tagihan |
| **3** | **4.12–4.15** | Dashboard aktivitas dan keuangan Aslab serta finalisasi UI | Modul dashboard Aslab, filter periode, agregasi, dan koordinasi konsistensi tampilan |
| **4** | **4.16–4.20** | Tagihan praktikan, Midtrans Sandbox, riwayat, dan notifikasi | Modul tagihan/pembayaran di aplikasi, layanan checkout dan webhook, serta kejadian notifikasi finansial |

### Programmer 1 — Aslab, lab, dan distribusi

| ID | Kebutuhan | Kriteria penerimaan |
| --- | --- | --- |
| **SRS-4.01** | Role Aslab dan akses berdasarkan mata kuliah | Akun Aslab masuk ke area Aslab dan hanya bisa mengelola mata kuliah yang ditugaskan. Praktikan dan Asprak yang mencoba memanggil operasi khusus Aslab ditolak di server. Role khusus ditetapkan melalui mekanisme yang disetujui tim dan tidak dapat dipilih sendiri saat registrasi publik. |
| **SRS-4.02** | Pengelolaan lab dan kebijakan presensi | Aslab bisa membuat dan mengubah nama, lokasi, koordinat, status, radius presensi, serta durasi toleransi sesuai kebijakan praktikum. Nilai koordinat, radius, dan toleransi yang tidak valid ditolak. Peta dan presensi dapat memakai kembali `labId` dan data geofence. Lab yang masih dirujuk sesi historis dapat dinonaktifkan dengan riwayat tetap terbaca. |
| **SRS-4.03** | Tambah lab satuan dan impor lab untuk satu mata kuliah | Aslab memilih satu mata kuliah yang dikelola. Ia dapat membuat satu lab atau mengunduh template **Lab** dan membuat beberapa lab dari satu file. Baris tidak valid atau di luar cakupan ditolak. |
| **SRS-4.04** | Tambah praktikan satuan dan impor praktikan ke satu lab | Di lab tujuan yang dikelola, Aslab dapat menempatkan satu praktikan atau memakai template **Praktikan** untuk menempatkan beberapa. Akun dicocokkan dengan identitas proyek yang disepakati. Akun tidak ditemukan, role salah, dan duplikasi dapat diketahui sebelum konfirmasi. |
| **SRS-4.05** | Tambah Asprak satuan dan impor Asprak ke satu lab | Di lab tujuan yang dikelola, Aslab dapat menugaskan satu Asprak atau memakai template **Asprak** untuk menugaskan beberapa. Template dan prosesnya terpisah dari impor lab dan praktikan. Daftar sesi yang dapat dikelola Asprak mengikuti hasil penugasan. |
| **SRS-4.06** | Pratinjau impor dan pemindahan orang | Pada ketiga alur impor, setiap baris tampil dalam daftar yang bisa digulir. Aslab dapat menerima, menolak, mengedit, atau melengkapi data per baris sebelum menyimpan. Hanya baris pilihan yang valid diproses. Hasil menampilkan jumlah/baris berhasil dan gagal. Pengulangan impor tidak menggandakan relasi. Aslab dapat memindahkan praktikan antar lab yang berwenang tanpa mengubah jadwal sesi atau riwayat presensi. Cakupan perpindahan personel lain mengikuti catatan komunikasi K2. |

### Programmer 2 — Sesi, presensi, izin, dan denda

| ID | Kebutuhan | Kriteria penerimaan |
| --- | --- | --- |
| **SRS-4.07** | Daftar kelas, jadwal, dan sesi Asprak | Asprak hanya melihat kelas, jadwal, dan sesi yang ditugaskan. Pembatasan berlaku pada data dan operasi di server. Dashboard atau layar lama tidak memberikan akses distribusi praktikan atau konfigurasi master lab kepada Asprak. |
| **SRS-4.08** | Buka/tutup sesi secara real-time | Asprak yang berwenang dapat menjalankan `scheduled → open → closed`. Praktikan peserta melihat perubahan tanpa refresh manual. Sesi tertutup menolak presensi baru. |
| **SRS-4.09** | Pantau dan kelola presensi serta izin | Asprak melihat rekap peserta dan waktu hadir pada sesi yang ditugaskan, serta meninjau keputusan izin dengan alur yang ada. Jenis koreksi presensi yang diizinkan mengikuti K5. Presensi praktikan tetap mengikuti keanggotaan, sesi terbuka, validasi check-in yang sudah berlaku, dan batas satu presensi per sesi. |
| **SRS-4.10** | Tentukan keterlambatan berdasarkan toleransi | Batas toleransi = `startsAt` terjadwal + durasi toleransi yang berlaku pada sesi. Presensi sebelum atau tepat di batas diklasifikasikan tepat waktu. Presensi setelah batas diklasifikasikan terlambat. Keputusan menggunakan waktu yang dapat dipercaya di backend dan kebijakan yang konsisten sepanjang sesi. Jam perangkat atau `openedAt` tidak menentukan denda. |
| **SRS-4.11** | Terbitkan satu tagihan per keterlambatan dan terapkan pengecualian izin | Kejadian terlambat yang memenuhi syarat membuat maksimal satu tagihan bernominal tetap, dengan tautan ke UID praktikan, sesi, dan catatan presensi. Pengulangan pemicu tidak membuat tagihan kedua. Izin yang disetujui mencatat **tidak hadir dengan izin** dan membebaskan denda, termasuk ketika ada tagihan yang belum dibayar. Jejak presensi yang sudah tersimpan tetap tersedia untuk audit. Pembayaran tidak mengubah status kehadiran. Transisi izin/tagihan saat checkout mengikuti K6. |

### Programmer 3 — Dashboard Aslab dan finalisasi UI

| ID | Kebutuhan | Kriteria penerimaan |
| --- | --- | --- |
| **SRS-4.12** | Ringkasan lab dan peserta | Dashboard mengambil data Firebase untuk lab yang dikelola Aslab dan menampilkan jumlah lab serta praktikan. Satu praktikan dihitung sekali di ringkasan cakupan yang sama. Data mata kuliah lain tidak muncul. |
| **SRS-4.13** | Pantau status, lokasi, jadwal, dan riwayat kegiatan | Aslab melihat status aktivitas per lab, lokasi, waktu, sesi berlangsung, sesi berikutnya, dan riwayat kegiatan. Informasi berasal dari `labs` dan sesi Firestore. Aslab dapat memfilter aktivitas berdasarkan hari, minggu, dan bulan. Periode, jumlah lab/peserta aktif saat ini, dan keadaan tanpa sesi diberi label jelas. |
| **SRS-4.14** | Riwayat keuangan dari denda | Aslab melihat riwayat pembayaran denda untuk cakupannya dengan filter hari, minggu, dan bulan. Nominal dana diterima dihitung dari pembayaran sukses yang sudah diverifikasi, satu kali per tagihan. Tagihan belum lunas, gagal, atau dibebaskan tidak dihitung sebagai pemasukan. |
| **SRS-4.15** | Finalisasi tampilan lintas peran | Layar dan alur baru mengikuti token, komponen, label status, dan pola navigasi proyek. Kondisi memuat, kosong, gagal, dan coba lagi konsisten. Semua aksi utama terbaca di layar ponsel sempit dan memiliki umpan balik. Programmer 3 menjaga acuan dan meninjau hasilnya. Setiap pemilik modul menerapkan perbaikan pada layarnya sendiri. |

### Programmer 4 — Pembayaran, riwayat, dan notifikasi

| ID | Kebutuhan | Kriteria penerimaan |
| --- | --- | --- |
| **SRS-4.16** | Daftar dan rincian tagihan praktikan | Praktikan hanya melihat tagihan miliknya, termasuk sesi, tanggal tagihan, nominal denda, dan status. Aksi bayar hanya tersedia pada tagihan yang memenuhi syarat. |
| **SRS-4.17** | Checkout Midtrans Sandbox melalui backend | Backend mengautentikasi praktikan, memeriksa kepemilikan dan kelayakan tagihan, mengambil nominal dari Firestore, lalu membuat transaksi Sandbox. Praktikan diarahkan ke halaman pembayaran gateway. Permintaan ulang atau ketukan ganda tidak membuka beberapa transaksi aktif untuk tagihan yang sama. Server Key hanya disimpan di backend. |
| **SRS-4.18** | Verifikasi webhook dan sinkronisasi status | Backend memverifikasi notifikasi gateway, mencocokkan ID order dan nominal dengan catatan internal, lalu memproses status secara idempoten dan memeriksa status resmi gateway saat diperlukan. Praktikan melihat `pending`, `success`, atau `failed`. URL kembali dan data dari aplikasi tidak menetapkan status lunas. Pembaruan duplikat atau terlambat tidak menurunkan status transaksi yang sudah berhasil. |
| **SRS-4.19** | Riwayat transaksi dan pembayaran yang persisten | Praktikan dapat membuka riwayat miliknya yang memuat informasi sesi, tanggal tagihan, nominal, waktu transaksi, dan status. Percobaan pembayaran yang gagal tetap tercatat. Riwayat dan status terbaru tersedia setelah aplikasi dibuka kembali atau pengguna masuk di perangkat lain. |
| **SRS-4.20** | Notifikasi tagihan dan hasil pembayaran | Praktikan mendapat pemberitahuan saat tagihan baru dibuat, pembayaran berhasil, serta pembayaran gagal atau perlu tindakan lanjutan. Gunakan inbox dan antrean push Sprint 3 dengan ID kejadian unik. Ketukan membuka tagihan/riwayat milik akun yang aktif. Penolakan izin push tetap memungkinkan pengguna melihat status di aplikasi. |

## Kontrak integrasi yang diusulkan

| Kontrak | Produsen dan pengguna | Bentuk dan batas kewenangan |
| --- | --- | --- |
| **Role dan cakupan mata kuliah** | P1 → P2, P3, P4 | Tambah role kode `lab_assistant` sebagai usulan nama. Tetapkan sumber penugasan Aslab, tautan mata kuliah–lab, dan hubungan dengan kelas/sesi. P1 menjaga kontrak akses roster. Setiap layanan tetap memeriksa kewenangan di server. |
| **Kebijakan sesi** | P1 + P2 → P3, P4 | Sesi mengacu ke `labId`, `startsAt`, dan snapshot durasi toleransi serta nominal tetap yang berlaku. Usulan: bekukan kebijakan saat sesi dibuka agar perubahan pengaturan tidak menghitung ulang presensi lama. |
| **Kehadiran dan izin** | P2 → P3, P4 | Pertahankan ID presensi yang ada. Status kehadiran ditentukan oleh presensi dan izin. Status pembayaran dibaca dari tagihan/transaksi. Rekap menampilkan izin disetujui sebagai tidak hadir dengan izin meskipun ada bukti check-in lama. |
| **Tagihan denda** | P2 menerbitkan, P4 memproses pembayaran, P3 membaca | Usulan `fines/{fineId}` dengan ID deterministik per presensi terlambat, berisi `studentId`, `sessionId`, `attendanceId`, cakupan mata kuliah/lab, nominal rupiah integer, tanggal terbit, dan status `unpaid / paid / waived`. Penulisan nominal dan status dilakukan oleh layanan berwenang. |
| **Percobaan pembayaran** | P4 → P3 | Usulan `payment_transactions/{orderId}`, satu dokumen per percobaan, berisi `fineId`, `studentId`, nominal, waktu, dan status `pending / success / failed`. Pembayaran gagal dapat diulang setelah percobaan terdahulu terverifikasi terminal dan tagihan masih bisa dibayar. P3 membaca data finansial terverifikasi dalam cakupannya. |
| **Notifikasi** | P2 menyediakan kejadian tagihan, P4 menghubungkannya ke notifikasi | Kejadian baru berasal dari perubahan tagihan/transaksi yang sudah tercatat di backend. Gunakan pola ID deterministik dan `users/{uid}/notifications` yang ada. Pada layar kunci cukup tampilkan informasi umum; rincian dibaca setelah autentikasi. |

Alur client–server–payment gateway dimulai dari permintaan checkout aplikasi ke backend. Backend membuat order di Midtrans Sandbox dan mengembalikan URL checkout. Setelah gateway mengirim webhook, backend memverifikasi transaksi, menyimpan hasil di Firestore, dan aplikasi menampilkan status yang tersimpan. [Alur integrasi Snap](https://docs.midtrans.com/docs/snap-snap-integration-guide) · [Verifikasi HTTP notification Midtrans](https://docs.midtrans.com/docs/https-notification-webhooks)

### Kepemilikan file bersama

- **P1** memiliki perubahan role Aslab, layanan lab, impor, dan penempatan. **P2** memiliki operasional Asprak serta logika presensi, rekap, izin dan penerbit denda. Jika layanan asisten lama mencakup distribusi dan operasional sesi sekaligus, sepakati bagian yang dipindahkan sebelum diedit paralel.
- **P3** memiliki layar dashboard dan kueri baca agregasi. Perubahan komponen UI bersama dikoordinasikan P3, sedangkan pemilik modul mengubah layar masing-masing.
- **P4** memiliki checkout, webhook, transaksi dan penyesuaian notifikasi. P2 dapat membuat modul penerbit denda terpisah di `functions/`. PM menetapkan satu pemilik perubahan ekspor di `functions/index.cjs`.
- **PM** mengoordinasikan perubahan navigasi/app shell, `firestore.rules`, `firestore.indexes.json`, `firebase.json`, dan dependensi bersama. Programmer menyerahkan daftar route, kontrak, dan kebutuhan aturan aksesnya. Integrasi dan merge melalui PR setelah uji modul.

## Catatan komunikasi sebelum integrasi

| ID | Yang perlu disepakati | Pihak yang koordinasi |
| --- | --- | --- |
| **K1** | Tentukan sumber identitas mata kuliah yang stabil, cara menunjuk Aslab, dan sumber kebenaran penempatan per lab. Petakan akun `assistant`, kelas, dan lab lama tanpa membuka akses lintas mata kuliah. | P1 + P2 + P3 + PM |
| **K2** | Materi mewajibkan penugasan **Asprak**, tetapi satu catatan perpindahan menyebut **Aslab**. Untuk draf ini, perpindahan praktikan wajib, penugasan Asprak wajib, dan pemindahan Aslab/Asprak antar lab perlu dikonfirmasi. Sepakati juga kapan perpindahan mulai berlaku bagi roster sesi, terutama sesi yang sudah dibuka. Jadwal dan riwayat tetap utuh. | P1 + P2 + PM/pengajar |
| **K3** | Sepakati format ketiga template dan kolom identitas. Usulan awal adalah tiga CSV terpisah dengan email akun terdaftar untuk praktikan/Asprak. Konfirmasi bila diperlukan XLSX, NIM sebagai kunci, atau pembuatan akun baru dari file. | P1 + PM |
| **K4** | Sepakati sumber waktu backend, tempat konfigurasi toleransi dan nominal, satuan menit/rupiah, nilai awal untuk data lama, serta batas rentang kebijakan. Konfirmasi perlakuan saat jadwal diubah dan kapan kebijakan dibekukan untuk satu sesi. | P1 + P2 + P4 |
| **K5** | Rinci arti “mengelola presensi”: tindakan koreksi apa yang sah, siapa yang menyetujui, dan apa yang dicatat. Sepakati juga apakah Asprak tetap boleh mengubah jadwal. Usulan awal mempertahankan keputusan izin serta kontrol sesi, dan melindungi waktu, lokasi, dan bukti check-in dari perubahan bebas. | P1 + P2 + PM/pengajar |
| **K6** | Kunci penanganan izin yang disetujui ketika tagihan sudah ada, transaksi pending, atau pembayaran sukses. Usulan aman: tahan checkout saat izin masih pending dan sampai periode keputusan ditutup. Jika status gateway belum terminal, verifikasi terlebih dahulu. Kasus dana sudah diterima perlu rekonsiliasi dan kebijakan refund yang disahkan. Semua jalur tetap mencatat izin yang disetujui sebagai tidak hadir dengan izin. | P2 + P4 + P3 + PM/pengajar |
| **K7** | Sepakati peta status Midtrans ke `pending / success / failed`, kapan retry diizinkan, dan kapan pemasukan masuk periode dashboard. Usulan: pakai waktu pembayaran terverifikasi untuk keuangan serta zona waktu kampus yang sama pada semua filter. | P3 + P4 |
| **K8** | Tentukan pemilik akun/proyek uji dan penyiapan Midtrans Sandbox, endpoint HTTPS webhook, Firebase Functions/Rules, kredensial Expo/FCM, dan perangkat uji. Konfirmasi layar tujuan ketukan dan penanganan notifikasi yang meminta tindakan lanjutan. | P4 + PM/pengelola Firebase dan EAS |
| **K9** | Sepakati satu pemilik tiap file bersama dan kontrak route sebelum branch programmer digabung. Navigasi mengikuti keputusan arsitektur proyek dan aturan repo terbaru. | Semua programmer + PM |

## Skenario demo dan kriteria selesai

1. **Aslab mengelola lab.** Login sebagai Aslab, buat lab satuan, lanjutkan tiga impor terpisah. Lengkapi satu baris kosong, tolak satu baris, dan simpan baris valid. Pindahkan praktikan, periksa penugasan Asprak, lalu pastikan jadwal dan riwayat lama tetap sama. Coba akses lab mata kuliah lain dan pastikan ditolak.
2. **Asprak menjalankan sesi.** Buka sesi sebagai Asprak yang ditugaskan dan lihat status berubah di akun praktikan. Uji presensi dalam geofence, di luar radius, dan percobaan duplikat. Untuk data uji waktu, verifikasi satu presensi tepat di akhir toleransi dan satu sesudahnya. Tutup sesi dan pastikan presensi baru ditolak.
3. **Sistem menghitung denda dan izin.** Ulangi pemicu terlambat, lalu pastikan hanya ada satu tagihan dengan ID presensi yang sesuai. Setujui izin praktikan pada skenario yang layak dan verifikasi rekap **tidak hadir dengan izin** serta pembebasan denda. Uji izin ditolak tanpa pembebasan otomatis.
4. **Praktikan membayar di Sandbox.** Coba pembayaran pending, berhasil, dan gagal/perlu tindakan lanjutan. Uji webhook invalid, pengiriman ulang, urutan berbeda, dan nominal yang tidak cocok. Pastikan hanya verifikasi backend yang dapat membuat tagihan lunas, status kehadiran tetap sama, riwayat tersedia setelah aplikasi dibuka ulang, dan notifikasi menuju layar yang tepat.
5. **Aslab memantau kegiatan dan keuangan.** Coba filter hari, minggu, dan bulan pada data Firebase. Cocokkan lab, praktikan, aktivitas, dan pembayaran sukses dengan data uji. Pastikan transaksi gagal, belum dibayar, atau di luar cakupan tidak menambah pemasukan.

Setiap PR implementasi menyertakan lint, typecheck, dan pengujian yang relevan, termasuk uji pembatasan akses. PM menjalankan demo gabungan dengan akun Aslab, Asprak, dan praktikan yang terpisah. Pengiriman push serta checkout dan webhook Sandbox diperiksa dengan layanan uji yang sudah dikonfigurasi.
