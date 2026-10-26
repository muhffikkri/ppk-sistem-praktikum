/**
 * Domain types for Sprint 1
 * Sesuai dengan spesifikasi docs/shared-contract.md
 */

export type DemoRole = 'student' | 'assistant';

export type SessionStatus = 'scheduled' | 'open' | 'closed';

export type Session = {
  id: string;
  courseName: string;
  groupName: string;
  startsAt: string; // ISO 8601 UTC
  endsAt: string; // ISO 8601 UTC
  status: SessionStatus;
  openedAt: string | null; // ISO 8601 UTC
  closedAt: string | null; // ISO 8601 UTC
  /** Label lokasi lab untuk tampilan kalender. */
  lab?: string;
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
  checkedInAt: string; // ISO 8601 UTC
};

export type SessionActionFailure =
  'session_not_found' | 'invalid_status' | 'already_checked_in';

export type SessionActionResult =
  { ok: true } | { ok: false; reason: SessionActionFailure };

export type AssistantDemoState = {
  sessions: Session[];
  attendanceBySession: Record<string, AttendanceRecord[]>;
};

export type StudentDemoState = {
  sessions: Session[];
  currentStudent: DemoStudent;
  attendanceHistory: AttendanceRecord[];
};

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
