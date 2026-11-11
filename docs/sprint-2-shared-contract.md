# Kontrak Bersama Implementasi — Sprint 2

Dokumen ini menjadi **sumber tunggal (single source of truth)** untuk nama route, tipe domain, kontrak service, state, dan ViewModel hook lintas fitur pada Sprint 2 agar 4 developer dapat bekerja paralel tanpa konflik identifier.

> **Status: Siap Kickoff Sprint 2.** PM/Lead Developer mengunci dokumen ini sebelum pekerjaan paralel dimulai. Setiap perubahan identifier lintas fitur wajib memperbarui file ini terlebih dahulu.

---

## 1. Konvensi Umum

- **Bahasa & Tipe:** TypeScript strict (`npx tsc --noEmit` harus lolos tanpa error).
- **Penamaan:** Tipe memakai `PascalCase`; variabel, fungsi, service, dan hook memakai `camelCase`.
- **Waktu:** Disimpan di Firestore dan tipe domain sebagai **string ISO 8601 UTC** (`new Date().toISOString()`). UI memformat ke zona waktu lokal perangkat memakai helper di `src/app/formatters.ts`.
- **Operasi Asinkron:** Semua aksi Firebase/AI mengembalikan `Promise<AsyncActionResult<T>>` agar UI selalu mendapat status sukses/gagal yang seragam tanpa unhandled promise rejection.

---

## 2. Route & Navigasi (`src/app/navigation.ts`)

Aplikasi menggunakan **Auth Gate** di level navigator:
1. Saat `authStatus === 'loading'`: tampilkan loading screen penuh.
2. Saat `authStatus === 'unauthenticated'`: hanya stack autentikasi (`Login`, `Register`) yang dirender.
3. Saat `authStatus === 'authenticated'`:
   - Role `'student'`: hanya rute milik praktikan + rute umum (`Home`, `Calendar`, `Profile`, `ProfileEdit`).
   - Role `'assistant'`: hanya rute milik asisten + rute umum (`Home`, `Calendar`, `Profile`, `ProfileEdit`).

```ts
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type RootStackParamList = {
  // Rute bersama (setelah login)
  Home: undefined;
  Calendar: undefined;
  Profile: undefined;
  ProfileEdit: undefined;

  // Rute Praktikan (role === 'student')
  StudentSchedule: undefined;
  StudentSessionDetail: { sessionId: string };
  StudentAttendanceHistory: undefined;
  StudentAllSessions: undefined;
  StudentAllAttendance: undefined;
  StudentLeaveRequestForm: { sessionId: string };
  StudentLeaveList: undefined;

  // Rute Asisten (role === 'assistant')
  AssistantSchedule: undefined;
  AssistantSessionDetail: { sessionId: string };
  AssistantAttendanceRoster: { sessionId?: string };
  AssistantAllSessions: undefined;
  AssistantAllAttendance: undefined;
  AssistantClassList: undefined;
  AssistantClassForm: { classId?: string };
  AssistantSessionForm: { classId?: string; sessionId?: string };
  AssistantLeaveReviewList: undefined;
};
```

> Catatan: Tombol tengah QR Scanner (`BottomDock` FAB) pada Sprint 1 hanyalah placeholder no-op; pada Sprint 2 jangan menampilkan aksi QR palsu karena QR tidak termasuk requirement SRS Sprint 2 (dapat diarahkan ke shortcut sesuai peran, misalnya `StudentLeaveList` / `AssistantLeaveReviewList`, atau dihilangkan dari `BottomDock`).

---

## 3. Tipe Domain (`src/domain/types.ts`)

```ts
export type UserRole = 'student' | 'assistant';

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  createdAt: string; // ISO 8601 UTC
};

export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated';

export type PracticalClass = {
  id: string;
  courseCode: string;
  courseName: string;
  groupName: string;
  assistantIds: string[];
  participantIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type SessionStatus = 'scheduled' | 'open' | 'closed';

export type Session = {
  id: string;
  classId: string;
  courseName: string;
  groupName: string;
  title?: string;
  lab?: string;
  participantIds: string[];
  assistantIds: string[];
  startsAt: string; // ISO 8601 UTC
  endsAt: string;   // ISO 8601 UTC
  status: SessionStatus;
  openedAt: string | null;
  closedAt: string | null;
  createdBy: string;
  createdAt: string;
};

export type AttendanceRecord = {
  id: string; // "{sessionId}_{studentId}"
  sessionId: string;
  classId: string;
  studentId: string;
  studentName: string;
  checkedInAt: string; // ISO 8601 UTC
};

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export type AiClassificationResult = {
  category: string | null;
  confidence: number | null;
  status: 'classified' | 'unavailable';
  errorMessage?: string | null;
};

export type LeaveRequest = {
  id: string;
  sessionId: string;
  classId: string;
  courseName: string;
  groupName: string;
  sessionStartsAt: string;
  studentId: string;
  studentName: string;
  reason: string;
  aiPrediction: AiClassificationResult;
  status: LeaveStatus;
  decisionNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type ActionFailureReason =
  | 'unauthenticated'
  | 'forbidden'
  | 'validation_error'
  | 'session_not_found'
  | 'class_not_found'
  | 'leave_not_found'
  | 'invalid_status'
  | 'already_checked_in'
  | 'duplicate_leave_request'
  | 'user_not_found'
  | 'network_error'
  | 'unknown_error';

export type AsyncActionResult<T = void> =
  | (T extends void ? { ok: true } : { ok: true; data: T })
  | { ok: false; reason: ActionFailureReason; message: string };
```

---

## 4. Aturan Transisi & Validasi Domain (`src/domain/`)

| Domain | Aksi | Prasyarat Valid | Hasil Sukses | Kegagalan |
| --- | --- | --- | --- | --- |
| **Auth** | `register` | Nama tidak kosong, email valid, password >= 6 karakter, role valid | Akun Firebase Auth + dokumen `users/{uid}` terbuat | `validation_error` / `network_error` / `unknown_error` |
| **Kelas** | `createClass` / `updateClass` | Role `assistant`, `courseCode`, `courseName`, `groupName` tidak kosong | Dokumen `classes` tersimpan (`updatedAt` diperbarui) | `forbidden` / `validation_error` |
| **Peserta** | `addParticipant` / `removeParticipant` | Role `assistant`, target user ber-role `student` ditemukan | `participantIds` pada `classes` & semua `sessions` kelas tersebut diperbarui via `writeBatch` | `user_not_found` / `forbidden` |
| **Sesi** | `createSession` / `updateSession` | Role `assistant`, `classId` valid, `endsAt > startsAt` | Dokumen `sessions` tersimpan dengan `participantIds` kelas | `validation_error` / `class_not_found` |
| **Sesi** | `openSession` | Role `assistant`, `session.status === 'scheduled'` | `status = 'open'`, `openedAt = now` | `invalid_status` / `session_not_found` |
| **Sesi** | `closeSession` | Role `assistant`, `session.status === 'open'` | `status = 'closed'`, `closedAt = now` | `invalid_status` / `session_not_found` |
| **Presensi** | `checkIn` | Role `student`, terdaftar di `session.participantIds`, `session.status === 'open'`, belum ada `attendance/{sessionId}_{studentId}` | Dokumen `attendance/{sessionId}_{studentId}` terbuat | `invalid_status` / `already_checked_in` / `forbidden` |
| **Izin** | `submitLeaveRequest` | Role `student`, terdaftar di sesi, alasan non-kosong (min. 5 karakter), belum ada izin `pending`/`approved` untuk sesi sama | Panggil `classifyLeaveReason(reason)` (fallback `'unavailable'` jika gagal) → simpan ke `leave_requests` dengan `status: 'pending'` | `validation_error` / `duplicate_leave_request` |
| **Izin** | `reviewLeaveRequest` | Role `assistant`, `leave.status === 'pending'`, keputusan `'approved' \| 'rejected'` | Update `status`, `reviewedBy`, `reviewedAt`, `decisionNote` | `invalid_status` / `leave_not_found` / `forbidden` |

---

## 5. Kontrak Context & ViewModel Hooks

Setiap ViewModel wajib menyediakan state **loading**, **error**, dan **action/retry** agar seluruh kondisi SRS R8 tertangani seragam di UI.

### A. Auth (`src/state/AuthContext.tsx` — Developer 1)

```ts
export type AuthContextValue = {
  authStatus: AuthStatus;
  user: UserProfile | null;
  error: string | null;
  login: (email: string, password: string) => Promise<AsyncActionResult>;
  register: (input: {
    displayName: string;
    email: string;
    password: string;
    role: UserRole;
  }) => Promise<AsyncActionResult>;
  logout: () => Promise<AsyncActionResult>;
  updateDisplayName: (displayName: string) => Promise<AsyncActionResult>;
  clearError: () => void;
};

export function useAuth(): AuthContextValue;
```

### B. Asisten CRUD & Sesi (`src/features/assistant/` / `src/state/AssistantSessionsContext.tsx` — Developer 2)

```ts
export type ClassInput = {
  courseCode: string;
  courseName: string;
  groupName: string;
};

export type SessionInput = {
  classId: string;
  title?: string;
  lab?: string;
  startsAt: string;
  endsAt: string;
};

export type AssistantSessionsViewModel = {
  classes: PracticalClass[];
  sessions: Session[];
  studentsDirectory: UserProfile[];
  loading: boolean;
  error: string | null;
  getClassById: (classId: string) => PracticalClass | undefined;
  getSessionById: (sessionId: string) => Session | undefined;
  subscribeAttendanceForSession: (
    sessionId: string,
    onData: (records: AttendanceRecord[]) => void,
    onError: (msg: string) => void,
  ) => () => void;
  createClass: (input: ClassInput) => Promise<AsyncActionResult<string>>;
  updateClass: (classId: string, input: ClassInput) => Promise<AsyncActionResult>;
  deleteClass: (classId: string) => Promise<AsyncActionResult>;
  addParticipantByEmail: (classId: string, email: string) => Promise<AsyncActionResult>;
  removeParticipant: (classId: string, studentUid: string) => Promise<AsyncActionResult>;
  createSession: (input: SessionInput) => Promise<AsyncActionResult<string>>;
  updateSession: (sessionId: string, input: SessionInput) => Promise<AsyncActionResult>;
  deleteSession: (sessionId: string) => Promise<AsyncActionResult>;
  openSession: (sessionId: string) => Promise<AsyncActionResult>;
  closeSession: (sessionId: string) => Promise<AsyncActionResult>;
  retry: () => void;
};

export function useAssistantSessionsViewModel(): AssistantSessionsViewModel;
```

### C. Praktikan Jadwal & Presensi (`src/features/student/` / `src/state/StudentAttendanceContext.tsx` — Developer 3)

```ts
export type StudentAttendanceViewModel = {
  classes: PracticalClass[];
  sessions: Session[];
  currentStudent: UserProfile | null;
  attendanceHistory: AttendanceRecord[];
  loading: boolean;
  submittingSessionId: string | null;
  error: string | null;
  getSessionById: (sessionId: string) => Session | undefined;
  getAttendanceForSession: (sessionId: string) => AttendanceRecord | undefined;
  checkIn: (sessionId: string) => Promise<AsyncActionResult>;
  retry: () => void;
};

export function useStudentAttendanceViewModel(): StudentAttendanceViewModel;
```

### D. Pengajuan & Pemeriksaan Izin (`src/features/leave/` — Developer 4)

```ts
export type StudentLeaveViewModel = {
  leaveRequests: LeaveRequest[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  getLeaveForSession: (sessionId: string) => LeaveRequest | undefined;
  previewAiClassification: (reason: string) => Promise<AiClassificationResult>;
  submitLeaveRequest: (input: {
    session: Session;
    reason: string;
  }) => Promise<AsyncActionResult<LeaveRequest>>;
  retry: () => void;
};

export type AssistantLeaveViewModel = {
  leaveRequests: LeaveRequest[];
  loading: boolean;
  reviewingId: string | null;
  error: string | null;
  approveLeave: (leaveId: string, decisionNote?: string) => Promise<AsyncActionResult>;
  rejectLeave: (leaveId: string, decisionNote?: string) => Promise<AsyncActionResult>;
  retry: () => void;
};

export function useStudentLeaveViewModel(): StudentLeaveViewModel;
export function useAssistantLeaveViewModel(): AssistantLeaveViewModel;
```

---

## 6. Pemetaan Kondisi UI Wajib

Semua screen fitur dari Developer 1–4 wajib mengikuti pola komponen bersama (`src/shared/ui/`):
- **Loading:** tampilkan indikator memuat (`ActivityIndicator` + label singkat) saat `loading === true` dan `data.length === 0`.
- **Error / Koneksi Terganggu:** tampilkan `Banner` (`tone="danger"`) berisi pesan yang ramah pengguna + tombol aksi `Coba Lagi` (`retry`).
- **Kosong (`Empty`):** tampilkan `EmptyState` dengan judul dan deskripsi kontekstual.
- **Layanan AI Tidak Merespons:** tampilkan `Banner` (`tone="warning"`) di form/detail izin: *"Klasifikasi AI tidak tersedia saat ini. Pengajuan tetap tersimpan untuk diperiksa asisten."*

