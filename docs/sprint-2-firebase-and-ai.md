# Arsitektur Firebase, Skema Firestore, Security Rules, & API AI — Sprint 2

Dokumen ini menjadi acuan teknis tunggal untuk integrasi **Firebase Authentication**, **Cloud Firestore**, **Firebase Security Rules**, dan **API Model AI Pengajar** pada aplikasi Expo React Native (`ppk-mobile`).

> Catatan transisi: [`database.md`](database.md) adalah rancangan Supabase yang tidak dipakai pada Sprint 2. Seluruh backend Sprint 2 menggunakan Firebase sesuai SRS.

---

## 1. Setup Firebase pada Expo React Native

Gunakan **Firebase JS SDK modular** (`firebase`) agar berjalan konsisten di Android, iOS (termasuk Expo Go), dan Web (`expo start --web`) tanpa memutus workflow Expo saat ini.

### Dependensi & Environment Variables

- Paket inti: `firebase` dan `@react-native-async-storage/async-storage` (untuk persistensi sesi login di native agar pengguna tetap login saat aplikasi ditutup dan dibuka kembali).
- Konfigurasi disimpan di `.env` (jangan commit kredensial rahasia pribadi ke git; sediakan `.env.example`):

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_AI_CLASSIFIER_URL=
```

### Inisialisasi (`src/services/firebase.ts`)

- Inisialisasi `app` sekali (`getApps().length ? getApp() : initializeApp(config)`).
- Untuk `auth`:
  - Di native (`Platform.OS !== 'web'`): gunakan `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })` (fallback ke `getAuth(app)` bila sudah terinisialisasi saat fast refresh).
  - Di web: gunakan `getAuth(app)` (persistensi lokal browser aktif secara default).
- Untuk `db`: gunakan `getFirestore(app)`.

---

## 2. Skema Cloud Firestore

Semua timestamp disimpan sebagai **string ISO 8601 UTC** atau **Firestore Timestamp** yang dikonversi konsisten di layer service menjadi string ISO 8601 UTC agar kompatibel dengan formatter Sprint 1 dan mudah ditest. Rekomendasi: simpan field waktu bisnis (`startsAt`, `endsAt`, `openedAt`, `closedAt`, `checkedInAt`, `createdAt`, `reviewedAt`) sebagai **string ISO 8601 UTC** (seragam dengan kontrak Sprint 1) dan gunakan `serverTimestamp()` hanya bila perlu metadata audit tambahan.

### Diagram Relasi Koleksi

```text
users (uid)
  ├──< classes (assistantIds[], participantIds[])
  │       └──< sessions (classId, participantIds[], status)
  │               ├──< attendance (id: "{sessionId}_{studentId}")
  │               └──< leave_requests (sessionId, studentId, status, aiPrediction)
```

### Detail Koleksi & Dokumen

#### A. `users/{uid}`

Menyimpan identitas dan peran akun yang dibuat saat registrasi.

| Field | Tipe | Wajib | Keterangan |
| --- | --- | --- | --- |
| `uid` | `string` | Ya | Sama dengan `FirebaseAuth.User.uid` dan document ID. |
| `displayName` | `string` | Ya | Nama lengkap pengguna. |
| `email` | `string` | Ya | Email lowercase untuk login dan pencarian peserta oleh asisten. |
| `role` | `'student' \| 'assistant'` | Ya | Peran akun (ditentukan saat registrasi, tidak dapat diubah sendiri oleh user). |
| `createdAt` | `string` | Ya | ISO 8601 UTC saat registrasi. |

#### B. `classes/{classId}`

Menyimpan kelas praktikum dan daftar peserta (`participantIds`) yang dikelola oleh asisten.

| Field | Tipe | Wajib | Keterangan |
| --- | --- | --- | --- |
| `id` | `string` | Ya | Document ID Firestore. |
| `courseCode` | `string` | Ya | Kode mata praktikum (mis. `PPK-101`). |
| `courseName` | `string` | Ya | Nama mata praktikum (mis. `Pemrograman Perangkat Bergerak`). |
| `groupName` | `string` | Ya | Nama kelas/kelompok (mis. `Kelas A`). |
| `assistantIds` | `string[]` | Ya | Daftar `uid` asisten pengelola (minimal berisi pembuat kelas). |
| `participantIds` | `string[]` | Ya | Daftar `uid` praktikan yang terdaftar di kelas ini. |
| `createdBy` | `string` | Ya | `uid` asisten pembuat kelas. |
| `createdAt` | `string` | Ya | ISO 8601 UTC. |
| `updatedAt` | `string` | Ya | ISO 8601 UTC. |

> **Manajemen peserta:** Saat asisten menambah/menghapus peserta berdasarkan akun `student` terdaftar (query `users` where `role == 'student'` atau cari by `email`), service memperbarui `classes/{classId}.participantIds` dan menyinkronkan `participantIds` pada seluruh `sessions` milik `classId` tersebut menggunakan `writeBatch` atomik. Dengan cara ini, real-time query praktikan dan Security Rules pada `sessions` bekerja tanpa perlu `get()` berulang saat `list`.

#### C. `sessions/{sessionId}`

Menyimpan jadwal dan status sesi praktikum.

| Field | Tipe | Wajib | Keterangan |
| --- | --- | --- | --- |
| `id` | `string` | Ya | Document ID Firestore. |
| `classId` | `string` | Ya | Referensi ke `classes/{classId}`. |
| `courseName` | `string` | Ya | Denormalisasi dari kelas untuk tampilan langsung. |
| `groupName` | `string` | Ya | Denormalisasi dari kelas (mis. `Kelas A`). |
| `title` | `string` | Opsional | Judul pertemuan/modul (mis. `Pertemuan 3: Firestore`). |
| `lab` | `string` | Opsional | Lokasi lab/ruang praktikum. |
| `participantIds` | `string[]` | Ya | Salinan `participantIds` dari kelas agar query `array-contains` & Security Rules berjalan langsung. |
| `assistantIds` | `string[]` | Ya | Salinan `assistantIds` dari kelas. |
| `startsAt` | `string` | Ya | ISO 8601 UTC jadwal mulai. |
| `endsAt` | `string` | Ya | ISO 8601 UTC jadwal selesai (`endsAt > startsAt`). |
| `status` | `'scheduled' \| 'open' \| 'closed'` | Ya | Status sesi. Awal wajib `'scheduled'`. |
| `openedAt` | `string \| null` | Ya | Diisi saat transisi `scheduled` → `open`. |
| `closedAt` | `string \| null` | Ya | Diisi saat transisi `open` → `closed`. |
| `createdBy` | `string` | Ya | `uid` asisten pembuat sesi. |
| `createdAt` | `string` | Ya | ISO 8601 UTC. |

> **Catatan penghapusan kelas/sesi:** Saat asisten menghapus kelas, hapus juga sesi terkait melalui batch (atau cegah penghapusan jika kebijakan memilih validasi; disarankan batch delete sesi milik kelas agar tidak ada sesi yatim).

#### D. `attendance/{attendanceId}`

Menyimpan catatan presensi praktikan.

- **Format Document ID Wajib:** `{sessionId}_{studentId}` (deterministik).
- Manfaat ID deterministik: mencegah duplikasi presensi secara struktural di Firestore dan memudahkan pengecekan keberadaan dokumen di Security Rules (`allow create` otomatis menolak jika ID sudah ada, dan `allow update, delete: if false`).

| Field | Tipe | Wajib | Keterangan |
| --- | --- | --- | --- |
| `id` | `string` | Ya | Sama dengan `{sessionId}_{studentId}`. |
| `sessionId` | `string` | Ya | ID sesi terkait. |
| `classId` | `string` | Ya | ID kelas terkait. |
| `studentId` | `string` | Ya | `uid` praktikan. |
| `studentName` | `string` | Ya | Nama tampilan praktikan saat check-in. |
| `checkedInAt` | `string` | Ya | ISO 8601 UTC waktu presensi. |

#### E. `leave_requests/{leaveId}`

Menyimpan pengajuan izin praktikan, hasil klasifikasi AI (pendukung), dan keputusan asisten.

| Field | Tipe | Wajib | Keterangan |
| --- | --- | --- | --- |
| `id` | `string` | Ya | Auto ID Firestore. |
| `sessionId` | `string` | Ya | ID sesi yang dimintakan izin. |
| `classId` | `string` | Ya | ID kelas sesi terkait. |
| `courseName` | `string` | Ya | Snapshot nama praktikum untuk tampilan daftar. |
| `groupName` | `string` | Ya | Snapshot nama kelas. |
| `sessionStartsAt` | `string` | Ya | Snapshot waktu mulai sesi (ISO 8601 UTC). |
| `studentId` | `string` | Ya | `uid` praktikan pengaju. |
| `studentName` | `string` | Ya | Nama praktikan pengaju. |
| `reason` | `string` | Ya | Alasan ketidakhadiran yang diisi praktikan. |
| `aiPrediction` | `object` | Ya | `{ category: string \| null, confidence: number \| null, status: 'classified' \| 'unavailable', errorMessage?: string \| null }`. |
| `status` | `'pending' \| 'approved' \| 'rejected'` | Ya | Status pengajuan. **Saat dibuat praktikan wajib `'pending'`.** |
| `decisionNote` | `string \| null` | Ya | Catatan opsional dari asisten saat memeriksa (default `null`). |
| `reviewedBy` | `string \| null` | Ya | `uid` asisten pemeriksa (default `null`). |
| `reviewedAt` | `string \| null` | Ya | ISO 8601 UTC waktu keputusan (default `null`). |
| `createdAt` | `string` | Ya | ISO 8601 UTC waktu pengajuan. |

---

## 3. Query Utama & Indeks Firestore (`firestore.indexes.json`)

Query yang menggabungkan filter (`where`) dan pengurutan (`orderBy`) pada field berbeda memerlukan composite index:

1. **Jadwal sesi praktikan:** `sessions` where `participantIds array-contains uid` + `orderBy startsAt asc`.
2. **Riwayat presensi praktikan:** `attendance` where `studentId == uid` + `orderBy checkedInAt desc`.
3. **Rekap presensi per sesi:** `attendance` where `sessionId == sid` + `orderBy checkedInAt asc`.
4. **Daftar izin praktikan:** `leave_requests` where `studentId == uid` + `orderBy createdAt desc`.
5. **Daftar izin asisten per status / waktu:** `leave_requests` order by `createdAt desc` (atau filter `sessionId == sid` + `orderBy createdAt desc`).

Sertakan `firestore.indexes.json` di root repo agar tim dapat deploy indeks sekaligus (`firebase deploy --only firestore:indexes`), atau buat dari link error console saat pengujian awal.

---

## 4. Firebase Security Rules (`firestore.rules`)

Aturan di bawah ini menegakkan seluruh kewenangan peran, pencegahan presensi ganda, dan larangan persetujuan otomatis izin di sisi server:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function userDoc() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid));
    }

    function hasRole(role) {
      return isSignedIn()
        && exists(/databases/$(database)/documents/users/$(request.auth.uid))
        && userDoc().data.role == role;
    }

    function isAssistant() {
      return hasRole('assistant');
    }

    function isStudent() {
      return hasRole('student');
    }

    // 1. Profil Pengguna
    match /users/{uid} {
      // Pemilik bisa baca profilnya; asisten bisa baca daftar praktikan untuk manajemen peserta kelas.
      allow read: if isSignedIn() && (request.auth.uid == uid || isAssistant());

      // Pengguna hanya boleh membuat dokumen profil miliknya sendiri saat registrasi.
      allow create: if isSignedIn()
        && request.auth.uid == uid
        && request.resource.data.uid == uid
        && request.resource.data.role in ['student', 'assistant']
        && request.resource.data.displayName is string
        && request.resource.data.displayName.size() > 0;

      // Pengguna hanya boleh mengubah nama tampilan, tidak boleh mengubah role/uid.
      allow update: if isSignedIn()
        && request.auth.uid == uid
        && request.resource.data.uid == resource.data.uid
        && request.resource.data.role == resource.data.role
        && request.resource.data.email == resource.data.email;

      allow delete: if false;
    }

    // 2. Kelas & Peserta
    match /classes/{classId} {
      allow read: if isAssistant()
        || (isStudent() && request.auth.uid in resource.data.participantIds);

      allow create: if isAssistant()
        && request.resource.data.createdBy == request.auth.uid
        && request.auth.uid in request.resource.data.assistantIds
        && request.resource.data.courseName is string
        && request.resource.data.courseName.size() > 0
        && request.resource.data.groupName is string
        && request.resource.data.groupName.size() > 0;

      allow update, delete: if isAssistant();
    }

    // 3. Jadwal & Sesi Praktikum
    match /sessions/{sessionId} {
      allow read: if isAssistant()
        || (isStudent() && request.auth.uid in resource.data.participantIds);

      allow create: if isAssistant()
        && request.resource.data.createdBy == request.auth.uid
        && request.resource.data.status == 'scheduled'
        && request.resource.data.openedAt == null
        && request.resource.data.closedAt == null
        && request.resource.data.startsAt is string
        && request.resource.data.endsAt is string;

      allow update: if isAssistant()
        && request.resource.data.status in ['scheduled', 'open', 'closed'];

      allow delete: if isAssistant();
    }

    // 4. Presensi Terintegrasi (ID deterministik: {sessionId}_{studentId})
    match /attendance/{attendanceId} {
      allow read: if isAssistant()
        || (isStudent() && resource.data.studentId == request.auth.uid);

      allow create: if isStudent()
        && request.resource.data.studentId == request.auth.uid
        && attendanceId == (request.resource.data.sessionId + '_' + request.auth.uid)
        && exists(/databases/$(database)/documents/sessions/$(request.resource.data.sessionId))
        && get(/databases/$(database)/documents/sessions/$(request.resource.data.sessionId)).data.status == 'open'
        && request.auth.uid in get(/databases/$(database)/documents/sessions/$(request.resource.data.sessionId)).data.participantIds;

      // Presensi bersifat final: tidak bisa diubah atau dihapus oleh klien.
      allow update, delete: if false;
    }

    // 5. Pengajuan Izin & Pemeriksaan Asisten
    match /leave_requests/{leaveId} {
      allow read: if isAssistant()
        || (isStudent() && resource.data.studentId == request.auth.uid);

      // Praktikan membuat izin: status WAJIB 'pending', belum direview, alasan tidak kosong,
      // dan praktikan adalah peserta dari sesi terkait.
      allow create: if isStudent()
        && request.resource.data.studentId == request.auth.uid
        && request.resource.data.status == 'pending'
        && request.resource.data.reviewedBy == null
        && request.resource.data.reviewedAt == null
        && request.resource.data.reason is string
        && request.resource.data.reason.size() > 0
        && exists(/databases/$(database)/documents/sessions/$(request.resource.data.sessionId))
        && request.auth.uid in get(/databases/$(database)/documents/sessions/$(request.resource.data.sessionId)).data.participantIds;

      // Asisten hanya memeriksa pengajuan 'pending' -> 'approved' | 'rejected',
      // tanpa mengubah alasan, pengaju, sesi, atau prediksi AI awal.
      allow update: if isAssistant()
        && resource.data.status == 'pending'
        && request.resource.data.status in ['approved', 'rejected']
        && request.resource.data.reviewedBy == request.auth.uid
        && request.resource.data.studentId == resource.data.studentId
        && request.resource.data.sessionId == resource.data.sessionId
        && request.resource.data.reason == resource.data.reason
        && request.resource.data.aiPrediction == resource.data.aiPrediction;

      allow delete: if false;
    }
  }
}
```

> **Catatan keamanan:** Jangan biarkan praktikan mengirim pengajuan izin dengan `status != 'pending'`. Rule `create` di atas menjamin hasil klasifikasi AI tidak pernah bisa dipakai klien untuk menyetujui izin sendiri.

---

## 5. Integrasi API Model AI Pengajar

### Prinsip Desain

1. **Adapter terisolasi (`src/services/ai/leaveClassifier.ts`)**: Semua detail URL, header, body request, dan parsing response dari API model AI pengajar berada di satu modul. Jika pengajar memberikan format field response spesifik (misalnya `{ category, confidence }` atau `{ label, score }` atau `{ prediction }`), cukup sesuaikan mapper di modul ini.
2. **Non-blocking & Non-authoritative**:
   - Pemanggilan AI terjadi saat praktikan mengirim (atau mempratinjau) alasan izin.
   - Gunakan `AbortController` dengan timeout yang wajar (mis. **8.000 ms**) agar form tidak menggantung jika server AI lambat atau mati.
   - Jika endpoint AI gagal, timeout, belum dikonfigurasi, atau mengembalikan format tidak valid:
     - Kembalikan `{ status: 'unavailable', category: null, confidence: null, errorMessage: 'Layanan AI tidak merespons. Pengajuan tetap disimpan tanpa klasifikasi otomatis.' }`.
     - **Tetap lanjutkan penyimpanan pengajuan izin ke Firestore dengan `status: 'pending'`** (atau tawarkan tombol coba klasifikasi ulang sebelum kirim, sesuai UX di kontrak bersama, tetapi keputusan tidak pernah terblokir dan tidak pernah otomatis diterima/ditolak).
3. **Larangan Keras**:
   - Dilarang memetakan kategori AI (mis. `"Sakit"` → `approved`) secara otomatis di frontend maupun backend.
   - Keputusan akhir hanya datang dari aksi eksplisit asisten (`approved` / `rejected`).

### Kontrak Adapter AI (`classifyLeaveReason`)

```ts
export type AiClassificationResult = {
  category: string | null;
  confidence: number | null;
  status: 'classified' | 'unavailable';
  errorMessage?: string | null;
};

export async function classifyLeaveReason(reason: string): Promise<AiClassificationResult>;
```

- **Input:** `reason` (string alasan ketidakhadiran yang sudah di-trim).
- **HTTP Request default:** `POST ${EXPO_PUBLIC_AI_CLASSIFIER_URL}` dengan header `Content-Type: application/json` dan body `{ text: reason, reason }` (kirim sesuai spesifikasi endpoint pengajar).
- **Normalisasi response:** baca `data.category ?? data.label ?? data.prediction ?? null` dan `data.confidence ?? data.score ?? null`. Bila tidak ada kategori valid, perlakukan sebagai `'unavailable'`.

