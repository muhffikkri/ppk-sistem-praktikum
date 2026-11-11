# Integrasi Developer 4 — Sprint 2

Modul menerima instance Firestore dan profil akun melalui provider. Pada branch `feature/sprint-2-leave-ai-review`, Auth Developer 1 diambil dari commit `6b2e478` (sebelum merge Developer 2). Kode Developer 2 tidak dimasukkan ke branch kerja ini; branch remote tidak dihapus.

## Sambungan Developer 1 / PM

Provider sudah disambungkan di AppNavigator setelah pemeriksaan AuthGate:

```tsx
<LeaveProvider db={db} user={user}>
  <AuthenticatedNavigator user={user} />
</LeaveProvider>
```

`db` berasal dari `src/services/firebase.ts` dan `user` berasal dari `useAuth()` sesuai tipe `UserProfile`. Jangan membuat instance Firestore terpisah. Provider mereset state anak saat akun berubah. Daftarkan ekspor screen dari `src/features/leave/index.ts` pada route yang sudah ada:

| Route | Screen |
| --- | --- |
| StudentLeaveRequestForm ({ sessionId }) | StudentLeaveRequestFormScreen |
| StudentLeaveList | StudentLeaveListScreen |
| AssistantLeaveReviewList | AssistantLeaveReviewListScreen |

Ketiga route sudah didaftarkan sesuai role. Beranda dan tombol tengah dock membuka daftar izin praktikan atau pemeriksaan asisten. Daftar izin praktikan menyediakan pilihan sesi nyata dari Firestore (`participantIds array-contains uid`), sehingga alur izin bisa diakses sebelum jadwal Developer 3 siap. Layar jadwal/presensi lama masih memakai fixture Sprint 1. Developer 3 nantinya dapat menambahkan tombol dari detail sesi dengan ID Firestore yang sama.

## API pengajar

Isi `EXPO_PUBLIC_AI_CLASSIFIER_URL`. Adapter mengirim POST JSON `{ text: reason, reason }`, menerima `category`/`label`/`prediction` dan `confidence`/`score` opsional (angka 0–1). Cocokkan mapper dengan spesifikasi pengajar saat diterima. Timeout 8 detik, kegagalan HTTP/jaringan/format/konfigurasi menjadi `unavailable`; penyimpanan izin tetap `pending`. Pratinjau tidak menyimpan data. Submit mengklasifikasikan ulang alasan terkini dan menyimpan hasil final.

## Koordinasi Developer 2 / PM

- Query asisten memakai sessions dengan `assistantIds array-contains uid`, lalu listener leave_requests per sessionId dan createdAt. Service juga memeriksa pengelola sesi dalam transaksi keputusan. Rules sekarang belum membatasi asisten berdasarkan kelas/sesi; penguatan server masih diperlukan.
- Auto ID mengikuti kontrak LeaveRequest. Service memeriksa izin pending/approved sebelum dan sesudah klasifikasi, dan ViewModel mencegah klik berulang. Ini belum menjamin keunikan saat dua perangkat mengirim bersamaan atau saat hasil write tidak diketahui karena jaringan. Perlu kesepakatan lock/deterministic ID dan rules untuk jaminan server; jangan mengklaim anti-duplikasi lintas perangkat sudah selesai.
- Pastikan rules/indexes diterapkan dan query asisten di atas diizinkan setelah rules diperketat.
- Review memakai transaksi: hanya pending dapat diputuskan dan sesi harus dikelola asisten. Data alasan/AI tidak ditulis ulang saat review.

## Verifikasi

Jalankan `npm run typecheck`, `npm run lint`, dan `npx tsx --test src/features/leave/leave.test.ts`.

Uji integrasi setelah auth, Firebase, dan route tersambung: kirim izin dari peserta sah; coba alasan pendek/duplikat; matikan API AI; cek hanya sesi kelolaan muncul untuk asisten; terima/tolak dan cek pembaruan di perangkat praktikan; coba dua asisten memutuskan bersamaan; logout/ganti akun; putuskan koneksi dan coba lagi. Uji rules dan duplikasi lintas perangkat harus menjadi bagian penguatan server Developer 2/PM.
