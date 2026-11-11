# Kontrak Bersama Implementasi

Dokumen ini memusatkan identifier dan aturan yang dipakai lintas fitur agar pekerjaan dapat berjalan paralel tanpa perbedaan nama.

> **Status: Usulan untuk ditinjau pemilik produk.** Setelah disetujui, ubah status menjadi **Disetujui**. Jangan mulai integrasi final sebelum kontrak disetujui.

## Konvensi

- TypeScript: tipe memakai `PascalCase`; variabel, properti, fungsi, dan hook memakai `camelCase`.
- Nama route memakai `PascalCase` dan parameter route bertipe eksplisit.
- Waktu disimpan sebagai string ISO 8601 UTC. UI menampilkannya dalam zona waktu lokal perangkat.
- `id` adalah string stabil pada fixture demo. Tidak perlu UUID atau koneksi database.
- Nilai di dokumen ini adalah identifier implementasi Sprint 1. Skema SQL Supabase di `database.md` adalah rancangan integrasi mendatang.

## Route

Gunakan nama route berikut terlepas dari library navigasi yang sudah dipakai proyek.

| Route                       | Parameter               | Kegunaan                                  |
| --------------------------- | ----------------------- | ----------------------------------------- |
| `RoleSelect`                | `undefined`             | Memilih mode demo Praktikan atau Asisten. |
| `StudentSchedule`           | `undefined`             | Daftar jadwal pada fixture praktikan.     |
| `StudentSessionDetail`      | `{ sessionId: string }` | Detail sesi dan aksi presensi praktikan.  |
| `StudentAttendanceHistory`  | `undefined`             | Riwayat kehadiran praktikan demo.         |
| `AssistantSchedule`         | `undefined`             | Daftar jadwal pada fixture asisten.       |
| `AssistantSessionDetail`    | `{ sessionId: string }` | Detail sesi dan kontrol buka/tutup.       |
| `AssistantAttendanceRoster` | `{ sessionId: string }` | Rekap praktikan untuk sesi asisten.       |

```ts
export type RootStackParamList = {
  RoleSelect: undefined;
  StudentSchedule: undefined;
  StudentSessionDetail: { sessionId: string };
  StudentAttendanceHistory: undefined;
  AssistantSchedule: undefined;
  AssistantSessionDetail: { sessionId: string };
  AssistantAttendanceRoster: { sessionId: string };
};
```

## Tipe domain

```ts
export type DemoRole = "student" | "assistant";
export type SessionStatus = "scheduled" | "open" | "closed";

export type Session = {
  id: string;
  courseName: string;
  groupName: string;
  startsAt: string;
  endsAt: string;
  status: SessionStatus;
  openedAt: string | null;
  closedAt: string | null;
};

export type DemoStudent = {
  id: string;
  displayName: string;
};

export type AttendanceRecord = {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  checkedInAt: string;
};

export type SessionActionFailure = "session_not_found" | "invalid_status" | "already_checked_in";

export type SessionActionResult = { ok: true } | { ok: false; reason: SessionActionFailure };
```

`studentName` pada `AttendanceRecord` adalah nilai tampilan fixture; saat integrasi database mendatang, nama dapat diambil melalui relasi ke profil. Catatan presensi yang sudah tercatat tidak diubah oleh percobaan duplikat.

## Fixture dan isolasi state

- Fixture asisten menyediakan `assistantSessions` dan `assistantAttendance`.
- Fixture praktikan menyediakan `studentSessions`, `currentStudent`, dan `studentAttendance`.
- Gunakan identitas praktikan stabil dalam `currentStudent` agar duplikasi bisa dicegah.
- Perubahan status sesi asisten hanya mengubah `assistantSessions`. `studentSessions` berdiri sendiri dan tidak mengikuti perubahan itu.
- State hanya dijamin selama aplikasi berjalan; tidak perlu bertahan setelah aplikasi dimulai ulang.

### Provider state per role

ViewModel antar-screen harus membaca state yang sama selama navigasi. Karena itu, state demo disimpan dalam provider berbasis React Context dan `useReducer`, bukan state lokal terpisah di setiap pemanggilan hook.

```ts
export type AssistantDemoState = {
  sessions: Session[];
  attendanceBySession: Record<string, AttendanceRecord[]>;
};

export type StudentDemoState = {
  sessions: Session[];
  currentStudent: DemoStudent;
  attendanceHistory: AttendanceRecord[];
};
```

Gunakan `AssistantDemoProvider` di atas seluruh navigator asisten dan `StudentDemoProvider` di atas seluruh navigator praktikan. Masing-masing provider menginisialisasi state dari fixture role-nya sendiri. Navigasi dari daftar ke detail atau riwayat tidak boleh mereset state. Saat pengguna berpindah role untuk demo, provider role yang dipilih menyediakan fixture dan state role tersebut; sinkronisasi lintas provider tidak dilakukan.

## Kondisi dan transisi

### Status sesi

| Kondisi saat ini | Aksi            | Kondisi setelah aksi                                        | Hasil jika tidak valid |
| ---------------- | --------------- | ----------------------------------------------------------- | ---------------------- |
| `scheduled`      | `openSession`   | `open`; isi `openedAt` dengan waktu saat ini.               | `invalid_status`       |
| `open`           | `closeSession`  | `closed`; isi `closedAt` dengan waktu saat ini.             | `invalid_status`       |
| `closed`         | Buka atau tutup | Tidak berubah; sesi tertutup bersifat terminal di Sprint 1. | `invalid_status`       |

Hanya role `assistant` yang mendapat aksi `openSession` dan `closeSession`.

### Presensi

- `checkIn` berhasil hanya bila sesi pada `studentSessions` berstatus `open`.
- Jika sesi tidak ada, hasilnya `session_not_found`.
- Jika sesi tidak terbuka, hasilnya `invalid_status`.
- Jika pasangan `sessionId` dan `currentStudent.id` sudah tercatat, hasilnya `already_checked_in`; catatan pertama tetap utuh.
- Jika berhasil, buat satu `AttendanceRecord` dengan waktu saat ini dan tampilkan konfirmasi di UI.
- Presensi hanya menambahkan catatan ke fixture praktikan; ia tidak mengubah fixture rekap asisten.

## ViewModel contract

Nama hook dan aksi berikut digunakan bersama oleh layar. Implementasi boleh menambah properti internal, tetapi tidak mengganti nama atau makna kontrak tanpa memperbarui dokumen ini.

```ts
export type AssistantSessionsViewModel = {
  sessions: Session[];
  getSessionById: (sessionId: string) => Session | undefined;
  getAttendanceForSession: (sessionId: string) => AttendanceRecord[];
  openSession: (sessionId: string) => SessionActionResult;
  closeSession: (sessionId: string) => SessionActionResult;
};

export type StudentAttendanceViewModel = {
  sessions: Session[];
  currentStudent: DemoStudent;
  attendanceHistory: AttendanceRecord[];
  getSessionById: (sessionId: string) => Session | undefined;
  getAttendanceForSession: (sessionId: string) => AttendanceRecord | undefined;
  checkIn: (sessionId: string) => SessionActionResult;
};

export function useAssistantSessionsViewModel(): AssistantSessionsViewModel;
export function useStudentAttendanceViewModel(): StudentAttendanceViewModel;
```

Kedua hook membaca provider role masing-masing. Tidak ada store sinkron lintas role pada Sprint 1.

## Kepemilikan dan perubahan

- Pemilik produk menyetujui atau mengubah kontrak ini.
- Orang 1 memakai `RootStackParamList` dan nama route untuk navigator.
- Orang 2 memakai `StudentAttendanceViewModel` dan hook praktikan.
- Orang 3 memakai `AssistantSessionsViewModel` dan hook asisten.
- Orang 4 menyediakan tipe, fixture, serta aturan state sesuai kontrak ini.
- Setelah disetujui, setiap perubahan identifier atau perilaku lintas fitur harus dimulai dengan memperbarui file ini dan memberi tahu semua pemilik area.
