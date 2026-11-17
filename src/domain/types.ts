/**
 * Domain types — Sprint 1 (transisi) & Sprint 2 (Firebase + AI)
 * Sesuai dengan spesifikasi docs/sprint-2-shared-contract.md
 */

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
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
};

export type DemoRole = UserRole;

export type SessionStatus = 'scheduled' | 'open' | 'closed';

export type Session = {
  id: string;
  classId?: string;
  courseName: string;
  groupName: string;
  title?: string;
  /** Label lokasi lab untuk tampilan kalender & detail sesi. */
  lab?: string;
  participantIds?: string[];
  assistantIds?: string[];
  startsAt: string; // ISO 8601 UTC
  endsAt: string; // ISO 8601 UTC
  status: SessionStatus;
  openedAt: string | null; // ISO 8601 UTC
  closedAt: string | null; // ISO 8601 UTC
  createdBy?: string;
  createdAt?: string; // ISO 8601 UTC
};

export type DemoStudent = {
  id: string;
  displayName: string;
};

export type AttendanceRecord = {
  id: string; // "{sessionId}_{studentId}" pada Sprint 2
  sessionId: string;
  classId?: string;
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
  sessionStartsAt: string; // ISO 8601 UTC
  studentId: string;
  studentName: string;
  reason: string;
  aiPrediction: AiClassificationResult;
  status: LeaveStatus;
  decisionNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null; // ISO 8601 UTC
  createdAt: string; // ISO 8601 UTC
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
  | { ok: false; reason: string; message: string };

export type AuthContextValue = {
  authStatus: AuthStatus;
  user: UserProfile | null;
  error: string | null;
  needsRoleSelection: boolean;
  login: (email: string, password: string) => Promise<AsyncActionResult>;
  register: (input: {
    displayName: string;
    email: string;
    password: string;
    role: UserRole;
  }) => Promise<AsyncActionResult>;
  loginWithGoogle: () => Promise<AsyncActionResult>;
  setUserRole: (role: UserRole) => Promise<AsyncActionResult>;
  logout: () => Promise<AsyncActionResult>;
  updateDisplayName: (displayName: string) => Promise<AsyncActionResult>;
  clearError: () => void;
};

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
  approveLeave: (
    leaveId: string,
    decisionNote?: string,
  ) => Promise<AsyncActionResult>;
  rejectLeave: (
    leaveId: string,
    decisionNote?: string,
  ) => Promise<AsyncActionResult>;
  retry: () => void;
};

// --- Tipe transisi Sprint 1 yang masih dipakai domain rules & fixtures ---

export type SessionActionFailure =
  'session_not_found' | 'invalid_status' | 'already_checked_in';

export type SessionActionResult =
  { ok: true } | { ok: false; reason: SessionActionFailure };
