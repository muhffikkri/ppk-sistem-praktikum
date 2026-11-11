# Pembagian Kerja Sprint 2 — 4 Developer Paralel + PM/Lead Developer

Dokumen ini memisahkan area kode dan tanggung jawab agar 4 developer dapat mengerjakan **Sprint 2 — Data Dinamis dengan Firebase** secara bersamaan, lalu digabungkan oleh **PM/Lead Developer** tanpa konflik besar.

Acuan kontrak tunggal:
- Kebutuhan & acceptance criteria: [`sprint-2-prd.md`](sprint-2-prd.md)
- Skema Firestore, Security Rules, & API AI: [`sprint-2-firebase-and-ai.md`](sprint-2-firebase-and-ai.md)
- Route, tipe TypeScript, aturan domain, & ViewModel hooks: [`sprint-2-shared-contract.md`](sprint-2-shared-contract.md)

> **Prinsip utama:** Kerjakan **hanya** fitur yang memenuhi SRS Sprint 2. Gunakan token desain (`src/theme/tokens.ts`) dan primitif UI bersama (`src/shared/ui/`) yang sudah ada.

---

## Ringkasan Pembagian Kebutuhan SRS ke Tiap Developer (Siap Laporan Awal)

Agar tidak terjadi tumpang tindih pada kebutuhan SRS yang lintas peran (seperti SRS 2, 3, 4, dan 8), batas tanggung jawab SRS tiap anggota tim ditetapkan sebagai berikut:

### 1. Ringkasan per Anggota Tim

| Peran | Fokus Modul / Fitur | Butir SRS yang Dikerjakan | Batasan Ruang Lingkup Spesifik |
| --- | --- | --- | --- |
| **Developer 1** | **Autentikasi, Peran Akun, & Auth Navigation Gate** | **SRS 1** (penuh), **SRS 4** (persistensi sesi login), **SRS 8** (kondisi belum login & error auth) | Mengelola Firebase Auth (register, login, logout), penyimpanan profil & role (`student`/`assistant`) di `users/{uid}`, penguncian navigasi/tindakan sesuai peran, serta tampilan loading & error autentikasi. |
| **Developer 2** | **CRUD Data Praktikum (Asisten), Sesi Real-Time, & Security Rules** | **SRS 2** (sisi Asisten), **SRS 3** (rekap Asisten & rules server), **SRS 4** (`onSnapshot` Asisten), **SRS 8** (`firestore.rules` & validasi CRUD) | Mengelola CRUD kelas, peserta kelas, jadwal, dan sesi di Firestore; kontrol buka/tutup sesi & rekap kehadiran real-time untuk asisten; validasi input form CRUD; serta penegakan pembatasan akses & anti-duplikasi di `firestore.rules`. |
| **Developer 3** | **Jadwal Terkait & Presensi Terintegrasi (Praktikan)** | **SRS 2** (sisi Praktikan), **SRS 3** (sisi Praktikan), **SRS 4** (`onSnapshot` Praktikan), **SRS 8** (validasi, loading, empty, error Praktikan) | Menampilkan jadwal & detail sesi yang terfilter khusus kelas yang diikuti praktikan; mencatat presensi saat sesi `open`; mencegah presensi ganda di UI/ViewModel; menampilkan riwayat kehadiran real-time & persisten; serta menyediakan tombol menuju form izin. |
| **Developer 4** | **Pengajuan Izin, Integrasi API AI Pengajar, & Pemeriksaan Izin** | **SRS 5** (penuh), **SRS 6** (penuh), **SRS 7** (penuh), **SRS 4** (`onSnapshot` izin), **SRS 8** (error API AI & validasi izin) | Membangun form pengajuan izin praktikan & pemantauan statusnya; memanggil API model AI pengajar untuk klasifikasi alasan (hanya sebagai info pendukung, tidak boleh auto-approve/reject, dan tetap aman bila AI tidak merespons); serta membangun daftar pemeriksaan & keputusan (`approved`/`rejected`) oleh asisten secara real-time. |
| **PM / Lead Developer** | **Kontrak Bersama, Persiapan Fondasi, Integrasi, & Uji End-to-End** | **Seluruh SRS 1–8** (koordinasi, merge, & verifikasi Alur Demo 1 & 2) | Mengunci kontrak tipe & route (`Tahap 0`), memasang dependensi & konfigurasi `.env.example`, menggabungkan PR dari 4 developer tanpa konflik, serta memverifikasi 2 alur demo utama dan seluruh kondisi error/offline/AI-down. |

### 2. Matriks Peta SRS (1–8) & Batas Kepemilikan

| No. SRS | Kebutuhan di SRS | Pemilik Utama | Pembagian Detail Antar-Developer |
| --- | --- | --- | --- |
| **1** | **Autentikasi pengguna** | **Developer 1** | **Dev 1:** Register, login, logout Firebase Auth, simpan/baca `role` (`student`/`assistant`), tampilkan aksi sesuai role. |
| **2** | **Pengelolaan data praktikum** | **Developer 2** & **Developer 3** | **Dev 2:** CRUD kelas, peserta, jadwal, dan sesi untuk Asisten di Firestore.<br>**Dev 3:** Lihat jadwal & info sesi Praktikan (terfilter hanya kelas yang diikuti). |
| **3** | **Presensi terintegrasi** | **Developer 3** & **Developer 2** | **Dev 3:** Aksi presensi Praktikan saat sesi `open`, simpan per `uid` + `sessionId`, cegah check-in ganda.<br>**Dev 2:** Aturan server `firestore.rules` (hanya `open`, peserta sah, ID deterministik `{sessionId}_{studentId}`) + rekap Asisten. |
| **4** | **Sinkronisasi data real-time** | **Dev 1, 2, 3, 4** (sesuai modul) | **Dev 1:** Persistensi sesi login setelah tutup/buka aplikasi.<br>**Dev 2:** Listener `onSnapshot` sesi & rekap Asisten.<br>**Dev 3:** Listener `onSnapshot` status sesi, presensi, & riwayat Praktikan.<br>**Dev 4:** Listener `onSnapshot` daftar & status pengajuan izin. |
| **5** | **Pengajuan izin** | **Developer 4** | **Dev 4:** Form pengajuan izin sesi tertentu + alasan ketidakhadiran, simpan ke Firestore, dan daftar pantau status izin Praktikan.<br>**Dev 3:** Menyediakan tombol masuk dari `StudentSessionDetail`. |
| **6** | **Integrasi AI** | **Developer 4** | **Dev 4:** Kirim alasan ke API AI pengajar, tampil & simpan hasil prediksi kategori sebagai info pendukung (status wajib tetap `pending`, tanpa keputusan otomatis). |
| **7** | **Pemeriksaan izin** | **Developer 4** | **Dev 4:** Daftar pengajuan izin untuk Asisten (menampilkan alasan + prediksi AI) + aksi Terima/Tolak yang tersinkron ke Praktikan. |
| **8** | **Validasi, keamanan, & kondisi khusus** | **Semua Developer** + **PM** | **Dev 1:** Kondisi belum login, error auth, loading profil.<br>**Dev 2:** `firestore.rules` pembatasan role & identitas, validasi form CRUD, loading/empty/error Asisten.<br>**Dev 3:** Validasi check-in, loading/empty/error jadwal & riwayat Praktikan.<br>**Dev 4:** Validasi alasan izin & penanganan layanan AI tidak merespons / error Firestore.<br>**PM:** Verifikasi akhir seluruh kondisi & Alur Demo 1–2. |

### 3. Pemetaan ke 2 Alur Demo Akhir SRS

- **Alur Demo 1** (*Asisten login → buka sesi → praktikan login & presensi → tersimpan di Firestore → asisten lihat rekap real-time → asisten tutup sesi*): melibatkan **Developer 1** (auth/role), **Developer 2** (buka/tutup sesi & rekap real-time), dan **Developer 3** (jadwal & presensi praktikan real-time).
- **Alur Demo 2** (*Praktikan login → ajukan izin → AI klasifikasikan alasan → asisten periksa & beri keputusan → praktikan lihat status*): melibatkan **Developer 1** (auth/role) dan **Developer 4** (pengajuan izin, API AI pengajar, pemeriksaan asisten, & pembaruan status real-time).

---

## Pra-syarat Kickoff (PM / Lead Developer — Sebelum Kerja Paralel)

Sebelum 4 branch fitur dibuat dari `main`:
1. Pasang dependensi `firebase` dan `@react-native-async-storage/async-storage`, lalu buat `.env.example` dan konfigurasi proyek Firebase + endpoint API AI pengajar.
2. Buat kerangka tipe di `src/domain/types.ts` dan `src/app/navigation.ts` sesuai [`sprint-2-shared-contract.md`](sprint-2-shared-contract.md) agar keempat developer langsung mengimpor identifier yang sama.
3. Siapkan `src/services/firebase.ts` (atau serahkan ke Developer 1 di fase awal sebelum dev lain menyambungkan query).

---

## Developer 1 — Autentikasi, Profil Peran, & Auth Navigation Gate

**Mencakup SRS:** R1 (Autentikasi & peran), R4 (persistensi sesi auth), R8 (kondisi belum login & error autentikasi).

**Tanggung jawab**
- Mengimplementasikan inisialisasi Firebase (`src/services/firebase.ts`) dengan persistensi Auth agar pengguna tetap login saat aplikasi ditutup dan dibuka kembali.
- Membangun `AuthContext` (`useAuth`) yang mengelola registrasi (`displayName`, `email`, `password`, `role: 'student' | 'assistant'`), login, logout, sinkronisasi profil dari `users/{uid}`, serta validasi input & mapping pesan error Firebase Auth yang ramah pengguna.
- Membangun layar `LoginScreen` dan `RegisterScreen` di `src/features/auth/`.
- Menggantikan `PovProvider` (mode demo Sprint 1) dengan `AuthGate` pada `App.tsx`, `AppNavigator.tsx`, `HomeScreen.tsx`, `CalendarScreen.tsx`, `ProfileScreen.tsx`, dan `ProfileEditScreen.tsx`:
  - Belum login → hanya tampilkan `Login` / `Register`.
  - Sudah login → kunci UI dan navigasi sesuai `user.role` (`student` atau `assistant`), tampilkan identitas akun nyata, dan sediakan tombol **Logout**.
- Menambahkan indikator loading autentikasi dan banner error koneksi pada level shell/profil.

**Area file yang dimiliki**
- `src/services/firebase.ts`
- `src/features/auth/` (`LoginScreen.tsx`, `RegisterScreen.tsx`, `index.ts`)
- `src/state/AuthContext.tsx`
- `App.tsx`, `src/app/AppNavigator.tsx`, `src/app/HomeScreen.tsx`, `src/app/CalendarScreen.tsx`, `src/app/ProfileScreen.tsx`, `src/app/ProfileEditScreen.tsx`

**Selesai bila**
- Registrasi praktikan/asisten berhasil membuat akun Firebase Auth + dokumen `users/{uid}` di Firestore.
- Login, logout, dan persistensi sesi setelah aplikasi ditutup/dibuka kembali berfungsi.
- Pengguna yang belum login tidak bisa mengakses layar praktikum.
- Error input kosong, format email salah, password salah/lemah, dan email sudah terdaftar tertangani dengan pesan jelas.
- Tidak ada lagi tombol switch role demo lokal Sprint 1.

---

## Developer 2 — Pengelolaan Data Praktikum (CRUD Asisten), Sesi Real-Time, & Security Rules

**Mencakup SRS:** R2 (CRUD kelas, peserta, jadwal, sesi), R4 (sinkronisasi real-time sesi & rekap asisten), R8 (validasi form CRUD & Firebase Security Rules).

**Tanggung jawab**
- Mengimplementasikan service Firestore untuk pengelolaan praktikum (`src/services/firestore/assistantService.ts`):
  - **CRUD Kelas:** tambah, lihat, ubah, hapus dokumen `classes`.
  - **CRUD Peserta Kelas:** mencari/memilih akun `student` dari `users`, menambah/menghapus peserta pada `classes/{classId}` sekaligus menyinkronkan `participantIds` ke `sessions` milik kelas via `writeBatch`.
  - **CRUD Jadwal & Sesi:** tambah, lihat, ubah, hapus dokumen `sessions` (validasi waktu `endsAt > startsAt` dan field wajib).
  - **Kontrol Sesi & Rekap:** `openSession` (`scheduled` → `open`), `closeSession` (`open` → `closed`), serta real-time listener `onSnapshot` untuk daftar sesi dan rekap kehadiran (`attendance`).
- Mengimplementasikan `AssistantSessionsContext` / `useAssistantSessionsViewModel` sesuai kontrak menggantikan `AssistantDemoContext`.
- Membangun layar baru CRUD Asisten di `src/features/assistant/`:
  - `AssistantClassListScreen` (daftar kelas + tombol tambah/edit/hapus).
  - `AssistantClassFormScreen` (form kelas + kelola daftar peserta kelas).
  - `AssistantSessionFormScreen` (form tambah/edit jadwal & sesi).
- Memperbarui layar asisten yang sudah ada (`AssistantScheduleScreen`, `AssistantSessionDetailScreen`, `AssistantAttendanceRosterScreen`, `AssistantAllSessionsScreen`, `AssistantAllAttendanceScreen`) agar memakai data real-time Firestore, state loading, empty state, dan banner error + tombol `retry`.
- Menyusun dan memvalidasi `firestore.rules` dan `firestore.indexes.json` sesuai [`sprint-2-firebase-and-ai.md`](sprint-2-firebase-and-ai.md).

**Area file yang dimiliki**
- `firestore.rules`, `firestore.indexes.json`
- `src/domain/sessionRules.ts` (penyesuaian validasi CRUD/status Sprint 2 bila diperlukan)
- `src/services/firestore/assistantService.ts`
- `src/state/AssistantSessionsContext.tsx`
- `src/features/assistant/` (screen CRUD baru & pembaruan screen asisten)

**Selesai bila**
- Asisten dapat melakukan CRUD penuh untuk kelas, peserta, jadwal, dan sesi di Firestore.
- Asisten dapat membuka dan menutup sesi serta melihat daftar hadir peserta secara real-time tanpa restart aplikasi.
- Seluruh operasi CRUD dan rekap menangani kondisi loading, data kosong, input tidak valid, dan gangguan koneksi.
- `firestore.rules` memblokir akses lintas peran (mis. praktikan tidak bisa membuat/mengubah kelas atau membuka sesi).

---

## Developer 3 — Alur Praktikan Real-Time & Presensi Terintegrasi

**Mencakup SRS:** R2 (praktikan melihat jadwal & sesi terkait dirinya), R3 (presensi terintegrasi & anti-duplikasi), R4 (sinkronisasi real-time praktikan), R8 (validasi, loading, empty, error).

**Tanggung jawab**
- Mengimplementasikan service Firestore untuk praktikan (`src/services/firestore/studentService.ts`):
  - Real-time listener (`onSnapshot`) untuk `classes` dan `sessions` yang hanya menyertakan `user.uid` di `participantIds` (hanya jadwal yang berkaitan dengan dirinya).
  - Real-time listener (`onSnapshot`) untuk riwayat `attendance` milik praktikan (`studentId == user.uid`).
  - Aksi `checkIn(sessionId)` yang menulis dokumen `attendance/{sessionId}_{studentId}` menggunakan `setDoc` + `runTransaction` atau cek keberadaan dokumen & status sesi `'open'` (ditambah proteksi Security Rules).
- Mengimplementasikan `StudentAttendanceContext` / `useStudentAttendanceViewModel` sesuai kontrak menggantikan `StudentDemoContext`.
- Memperbarui seluruh layar praktikan di `src/features/student/`:
  - `StudentScheduleScreen`, `StudentAllSessionsScreen` (jadwal terfilter untuk praktikan, loading, empty state jika belum terdaftar di kelas/sesi, error + `retry`).
  - `StudentSessionDetailScreen` (update status `scheduled`/`open`/`closed` real-time saat asisten mengubah status, tombol Presensi aktif hanya saat `open` dan belum presensi, pencegahan presensi ganda, serta tombol navigasi **Ajukan Izin** menuju `StudentLeaveRequestForm` milik Developer 4).
  - `StudentAttendanceHistoryScreen`, `StudentAllAttendanceScreen` (riwayat kehadiran persisten & real-time).

**Area file yang dimiliki**
- `src/domain/attendanceRules.ts` (penyesuaian aturan presensi Sprint 2 bila diperlukan)
- `src/services/firestore/studentService.ts`
- `src/state/StudentAttendanceContext.tsx`
- `src/features/student/` (`StudentScheduleScreen`, `StudentSessionDetailScreen`, `StudentAttendanceHistoryScreen`, `StudentAllSessionsScreen`, `StudentAllAttendanceScreen`, `index.ts`)

**Selesai bila**
- Praktikan hanya melihat jadwal dan sesi dari kelas yang mengikutsertakan dirinya.
- Perubahan status sesi oleh asisten (`scheduled` → `open` → `closed`) langsung terlihat di layar praktikan tanpa restart.
- Presensi pertama pada sesi `open` tersimpan di Firestore dan percobaan kedua dicegah dengan pesan jelas; data bertahan saat aplikasi dibuka ulang.
- Tersedia tombol masuk ke alur pengajuan izin untuk sesi terkait.

---

## Developer 4 — Pengajuan Izin, Integrasi API Model AI Pengajar, & Pemeriksaan Izin Asisten

**Mencakup SRS:** R5 (pengajuan izin praktikan), R6 (integrasi API AI pendukung tanpa keputusan otomatis), R7 (pemeriksaan & keputusan izin asisten), R4 & R8 (real-time status izin, validasi, AI unavailable handling).

**Tanggung jawab**
- Mengimplementasikan adapter API model AI pengajar (`src/services/ai/leaveClassifier.ts`):
  - Mengirim alasan izin ke `EXPO_PUBLIC_AI_CLASSIFIER_URL` dengan timeout (8 detik) dan parsing response terstandar.
  - Menangani kegagalan jaringan/timeout/response tidak valid dengan mengembalikan `{ status: 'unavailable', category: null, confidence: null }` agar pengajuan izin tetap berjalan aman tanpa keputusan otomatis.
- Mengimplementasikan service Firestore izin (`src/services/firestore/leaveService.ts`):
  - Submit pengajuan izin oleh praktikan (`status: 'pending'` wajib, menyimpan `aiPrediction` sebagai informasi pendukung).
  - Real-time listener (`onSnapshot`) daftar izin milik praktikan (`studentId == uid`) dan daftar izin untuk asisten.
  - Aksi keputusan asisten (`approveLeave`, `rejectLeave`) yang memperbarui `status`, `reviewedBy`, `reviewedAt`, dan `decisionNote` opsional.
- Membangun modul `src/features/leave/`:
  - Hook `useStudentLeaveViewModel` dan `useAssistantLeaveViewModel` (atau context bila dibagikan antar screen).
  - `StudentLeaveRequestFormScreen` (form alasan izin pada sesi tertentu, validasi alasan, pratinjau/tampilan hasil klasifikasi AI atau banner AI tidak tersedia, tombol kirim).
  - `StudentLeaveListScreen` (daftar status pengajuan izin praktikan: `Menunggu` / `Diterima` / `Ditolak` + hasil klasifikasi AI + catatan asisten).
  - `AssistantLeaveReviewListScreen` (daftar pengajuan izin masuk untuk asisten, tampilkan alasan & kategori AI sebagai info pendukung, tombol **Terima** dan **Tolak** dengan konfirmasi & feedback).

**Area file yang dimiliki**
- `src/services/ai/leaveClassifier.ts`
- `src/services/firestore/leaveService.ts`
- `src/features/leave/` (`StudentLeaveRequestFormScreen.tsx`, `StudentLeaveListScreen.tsx`, `AssistantLeaveReviewListScreen.tsx`, `useStudentLeaveViewModel.ts`, `useAssistantLeaveViewModel.ts`, `index.ts`)

**Selesai bila**
- Praktikan dapat mengajukan izin dengan alasan tervalidasi, hasil klasifikasi AI tampil & tersimpan di Firestore, dan status awal selalu `pending`.
- Saat API AI mati/timeout, pengajuan izin tetap bisa disimpan dengan informasi AI tidak tersedia dan **tidak pernah** otomatis diterima/ditolak.
- Asisten melihat daftar pengajuan beserta alasan + prediksi AI dan dapat menerima/menolak pengajuan.
- Praktikan melihat perubahan status keputusan asisten secara real-time.

---

## Matriks Kepemilikan File (Anti Konflik Merge)

| Area / Folder | Pemilik | Catatan |
| --- | --- | --- |
| `src/domain/types.ts`, `src/app/navigation.ts`, `.env.example`, `package.json` | **PM / Lead Developer** | Dikunci di awal; perubahan hanya melalui koordinasi PM. |
| `src/services/firebase.ts`, `src/features/auth/`, `src/state/AuthContext.tsx`, `App.tsx`, `src/app/*` | **Developer 1** | Menyambungkan screen Dev 2/3/4 ke `AppNavigator` saat integrasi. |
| `firestore.rules`, `firestore.indexes.json`, `src/services/firestore/assistantService.ts`, `src/state/AssistantSessionsContext.tsx`, `src/features/assistant/` | **Developer 2** | Fokus penuh CRUD & kontrol sesi asisten. |
| `src/services/firestore/studentService.ts`, `src/state/StudentAttendanceContext.tsx`, `src/features/student/` | **Developer 3** | Fokus penuh jadwal & presensi praktikan. |
| `src/services/ai/leaveClassifier.ts`, `src/services/firestore/leaveService.ts`, `src/features/leave/` | **Developer 4** | Terisolasi di folder `leave/` dan `services/ai/`. |
| `src/shared/ui/`, `src/theme/tokens.ts` | **Bersama (Read-only default)** | Tambahan primitif baru wajib dikoordinasikan ke PM agar tidak bentrok. |

---

## Urutan Kerja & Strategi Penggabungan (PM/Lead Developer)

### Tahap 0 — Persiapan (PM / Lead Developer)
- Commit setup `firebase`, `@react-native-async-storage/async-storage`, `.env.example`, `firestore.rules`, `firestore.indexes.json`, `src/domain/types.ts`, dan `src/app/navigation.ts` ke `main`.
- Selama masa transisi sebelum `AssistantDemoContext` dan `StudentDemoContext` dihapus oleh Dev 2 & Dev 3, `src/domain/types.ts` mengekspor tipe Sprint 2 dengan nama `AssistantSessionsViewModelV2` dan `StudentAttendanceViewModelV2` agar build Sprint 1 tetap hijau (`tsc --noEmit` lolos). Saat mengganti DemoContext masing-masing, Dev 2 dan Dev 3 dapat mengadopsi kontrak baru tersebut (lalu membersihkan tipe transisi Sprint 1 saat Tahap 2).
- Pastikan seluruh tim sepakat dengan kontrak di [`sprint-2-shared-contract.md`](sprint-2-shared-contract.md).

### Tahap 1 — Pengembangan Paralel (4 Branch Terpisah dari `main`)
- `feat/s2-auth-navigation` (Developer 1)
- `feat/s2-assistant-crud-rules` (Developer 2)
- `feat/s2-student-realtime-attendance` (Developer 3)
- `feat/s2-leave-ai-review` (Developer 4)

> Tips kerja paralel saat auth dari Developer 1 belum merge: Developer 2, 3, dan 4 cukup membaca `useAuth().user` sesuai kontrak `AuthContextValue` (atau memakai mock `AuthContext` sementara di branch lokal tanpa mengedit file milik Developer 1).

### Tahap 2 — Penggabungan Bertahap oleh PM/Lead Developer
1. **Merge PR Developer 1** (`auth-navigation` + `firebase.ts`) → uji register/login/logout & auth gate.
2. **Merge PR Developer 2** (`assistant-crud` + `firestore.rules`) → deploy rules/indexes ke Firebase project tim, uji CRUD kelas/peserta/sesi.
3. **Merge PR Developer 3** (`student-realtime-attendance`) → sambungkan provider praktikan di `App.tsx` dan uji **Alur Demo 1** end-to-end.
4. **Merge PR Developer 4** (`leave-ai-review`) → sambungkan route `StudentLeaveRequestForm`, `StudentLeaveList`, dan `AssistantLeaveReviewList` di `AppNavigator.tsx`, tambah shortcut navigasi di `HomeScreen` / `StudentSessionDetail` / `AssistantSchedule`, lalu uji **Alur Demo 2** end-to-end.

### Tahap 3 — Checklist Verifikasi Akhir Sebelum Rilis
- [ ] `npm run typecheck` (`tsc --noEmit`) lolos tanpa error.
- [ ] `npm run lint` (`eslint .`) lolos tanpa error.
- [ ] `firestore.rules` terpasang di Firebase Console / emulator dan teruji menolak aksi ilegal lintas peran serta presensi ganda.
- [ ] **Demo Alur 1** berjalan real-time antara akun Asisten dan Praktikan tanpa restart aplikasi.
- [ ] **Demo Alur 2** berjalan lengkap dengan API AI pengajar, keputusan manual asisten, dan pembaruan status real-time ke praktikan.
- [ ] Seluruh kondisi wajib terverifikasi: belum login, loading, daftar kosong, koneksi terganggu, dan layanan AI tidak merespons.
- [ ] Tutup dan buka kembali aplikasi → sesi login dan seluruh data Firestore tetap persisten.

