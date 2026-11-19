# Programmer 4 — SRS-3.4

Aplikasi mendaftarkan token setelah pengguna login dan memberi izin melalui **Notifikasi**, yang dibuka dari ikon lonceng di beranda. Channel Android bernama **Praktikum**. Jika izin sudah aktif, perangkat didaftarkan lagi saat aplikasi kembali aktif atau token native berubah. Pengguna dapat mencoba lagi ketika registrasi gagal. Token disimpan per akun dan instalasi di `users/{uid}/push_tokens/{installationId}`; setelah perangkat terdaftar, logout perlu mengonfirmasi penghapusan token di server. Jika perangkat offline, aplikasi menampilkan pesan untuk mencoba lagi saat terhubung.

| Kejadian | Penerima | Layar saat ditekan |
| --- | --- | --- |
| Status sesi berubah dari `scheduled` menjadi `open` | Praktikan di `participantIds` | Detail sesi |
| `startsAt`, `endsAt`, `lab`, atau `labId` berubah | Praktikan di `participantIds` terbaru | Detail sesi |
| Status izin berubah dari `pending` menjadi `approved` atau `rejected` | Praktikan dengan `studentId` pengajuan | Daftar pengajuan izin |

Push membawa tipe kejadian, UID penerima dan ID dokumen. Isi layar kunci bersifat umum. Aplikasi memeriksa UID sebelum membuka target dan menangani ketukan saat aplikasi aktif maupun baru dibuka. Handler Expo menampilkan notifikasi di foreground. Sistem operasi menampilkan pesan di background. SRS-3.4 tidak memerlukan lampiran media atau tombol balasan. Konsep izin, token, channel dan navigasi mengikuti panduan pengguna, dengan `expo-notifications` dan Expo Push Service sebagai implementasi di proyek ini.

## Sambungan lokasi untuk Programmer 2 dan 3

- Gunakan `usePermissionContext()` dari `src/features/permissions` untuk membaca `location` dan meminta izin melalui `check('location', true)`. Status dibaca ulang ketika aplikasi kembali aktif.
- Programmer 2 dapat membungkus bagian presensi yang membutuhkan koordinat dengan `LocationPermissionGate`. Pembacaan koordinat dan validasi radius tetap dilakukan service presensi.
- Programmer 3 dapat menampilkan peta lab tanpa izin, lalu memakai status izin bersama untuk tombol **Posisi saya**. Gunakan status `granted` sebelum mengambil koordinat.
- Jika prompt tidak dapat diulang atau lokasi perangkat mati, komponen menampilkan petunjuk pengaturan. Lokasi diminta hanya saat fitur digunakan.

## Backend dan penyiapan

Firebase Functions membaca perubahan dokumen `sessions` dan `leave_requests`, membuat antrean per kejadian dan instalasi, memeriksa ulang penerima, lalu mengirim ke Expo Push Service. Antrean memakai ID deterministik dan transaksi untuk membatasi pengiriman ulang dari pemicu ganda. Retry dan pemeriksaan receipt dikerjakan scheduler. Penerimaan receipt menandakan provider menerima pesan, dan perangkat belum tentu menampilkannya. Jika server berhenti setelah Expo menerima payload tetapi sebelum tiket tercatat, percobaan berikutnya masih dapat menghasilkan duplikat. Ketika Expo melaporkan `DeviceNotRegistered`, token dihapus hanya jika nilainya masih sama.

1. Pengelola EAS/Firebase menyiapkan FCM V1 untuk Android dan APNs jika iOS termasuk target. Gunakan development build baru setelah plugin Expo dipasang. Jika menguji iOS pada perangkat fisik, gunakan profil build untuk perangkat karena profil development yang sekarang memilih simulator.
2. Aktifkan keamanan push di EAS dan simpan access token Expo di Secret Manager Firebase. Jalankan `firebase functions:secrets:set EXPO_PUSH_ACCESS_TOKEN --project <project-uji>` dengan akun yang berwenang.
3. Verifikasi project target dan billing untuk Functions serta Cloud Scheduler. Dari root repo jalankan `firebase deploy --only firestore:rules,functions --project <project-uji>`. Atur TTL Firestore pada field `expireAt` koleksi `push_delivery` untuk membersihkan riwayat antrean. Deploy rules bersama perubahan tim saat integrasi.
4. Uji menggunakan akun asisten, dua praktikan (peserta dan bukan peserta), serta perangkat dengan development build. Aktifkan push di perangkat peserta. Buka sesi, ubah jadwal, lalu terima/tolak izin. Periksa target ketukan saat aplikasi terbuka, di background, dan dimulai dari notifikasi. Ulangi setelah izin ditolak, koneksi terputus, dan akun diganti.

Pemeriksaan lokal menggunakan `npm run typecheck`, `npm run lint`, `npm test`, dan `npm test --prefix functions`.
