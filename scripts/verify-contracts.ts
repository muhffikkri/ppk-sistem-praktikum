import { openSessionRule, closeSessionRule } from '../src/domain/sessionRules';
import { checkInRule } from '../src/domain/attendanceRules';
import {
  assistantSessions,
  assistantAttendance,
} from '../src/data/fixtures/assistantFixtures';
import {
  studentSessions,
  currentStudent,
  studentAttendance,
} from '../src/data/fixtures/studentFixtures';
import { Session } from '../src/domain/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('--- Testing Domain Rules & Fixtures ---\n');

// 1. Session Open Rules
const scheduledSession: Session = {
  id: 'test-1',
  courseName: 'Test Course',
  groupName: 'Group A',
  startsAt: '2026-10-21T08:00:00.000Z',
  endsAt: '2026-10-21T10:00:00.000Z',
  status: 'scheduled',
  openedAt: null,
  closedAt: null,
};

const openRes = openSessionRule(scheduledSession, '2026-10-21T08:00:01.000Z');
assert(
  openRes.ok === true && openRes.updatedSession.status === 'open',
  'scheduled -> open succeeds',
);
assert(
  openRes.ok === true &&
    openRes.updatedSession.openedAt === '2026-10-21T08:00:01.000Z',
  'openedAt populated correctly',
);

const invalidOpenRes = openSessionRule(
  openRes.ok ? openRes.updatedSession : undefined,
);
assert(
  invalidOpenRes.ok === false && invalidOpenRes.reason === 'invalid_status',
  'open -> open fails with invalid_status',
);

// 2. Session Close Rules
const closeRes = closeSessionRule(
  openRes.ok ? openRes.updatedSession : undefined,
  '2026-10-21T10:00:00.000Z',
);
assert(
  closeRes.ok === true && closeRes.updatedSession.status === 'closed',
  'open -> close succeeds',
);
assert(
  closeRes.ok === true &&
    closeRes.updatedSession.closedAt === '2026-10-21T10:00:00.000Z',
  'closedAt populated correctly',
);

const invalidCloseRes = closeSessionRule(
  closeRes.ok ? closeRes.updatedSession : undefined,
);
assert(
  invalidCloseRes.ok === false && invalidCloseRes.reason === 'invalid_status',
  'closed -> close fails with invalid_status (terminal)',
);

const notFoundRes = openSessionRule(undefined);
assert(
  notFoundRes.ok === false && notFoundRes.reason === 'session_not_found',
  'undefined session -> session_not_found',
);

// 3. Attendance Check-in Rules
const openStudentSession = studentSessions.find(
  (s) => s.id === 'session-std-01',
)!;
assert(
  openStudentSession !== undefined,
  'Found open student session in fixture',
);

const checkInSuccess = checkInRule(
  openStudentSession,
  currentStudent,
  studentAttendance,
  '2026-10-21T08:05:00.000Z',
);
assert(checkInSuccess.ok === true, 'First checkIn on open session succeeds');
if (checkInSuccess.ok) {
  assert(
    checkInSuccess.record.sessionId === openStudentSession.id,
    'Record sessionId matches',
  );
  assert(
    checkInSuccess.record.studentId === currentStudent.id,
    'Record studentId matches',
  );
  assert(
    checkInSuccess.record.checkedInAt === '2026-10-21T08:05:00.000Z',
    'Record timestamp matches',
  );

  // Check duplicate prevention
  const updatedRecords = [checkInSuccess.record, ...studentAttendance];
  const duplicateCheck = checkInRule(
    openStudentSession,
    currentStudent,
    updatedRecords,
  );
  assert(
    duplicateCheck.ok === false &&
      duplicateCheck.reason === 'already_checked_in',
    'Second checkIn prevented with already_checked_in',
  );
}

// Check on scheduled session
const scheduledStudentSession = studentSessions.find(
  (s) => s.id === 'session-std-03',
)!;
const scheduledCheck = checkInRule(
  scheduledStudentSession,
  currentStudent,
  studentAttendance,
);
assert(
  scheduledCheck.ok === false && scheduledCheck.reason === 'invalid_status',
  'CheckIn on scheduled session fails with invalid_status',
);

// Check on closed session
const closedStudentSession = studentSessions.find(
  (s) => s.id === 'session-std-04',
)!;
const closedCheck = checkInRule(
  closedStudentSession,
  currentStudent,
  studentAttendance,
);
assert(
  closedCheck.ok === false && closedCheck.reason === 'invalid_status',
  'CheckIn on closed session fails with invalid_status',
);

// 4. Fixtures sanity check
assert(assistantSessions.length > 0, 'Assistant sessions fixture is populated');
assert(
  Object.keys(assistantAttendance).length > 0,
  'Assistant attendance fixture is populated',
);
assert(studentSessions.length > 0, 'Student sessions fixture is populated');
assert(
  studentAttendance.length > 0,
  'Student attendance history fixture is populated',
);
assert(
  studentSessions.some((s) => s.status === 'open'),
  'Student sessions has at least one open session for live demo',
);
assert(
  assistantSessions.some((s) => s.status === 'scheduled'),
  'Assistant sessions has at least one scheduled session for live demo',
);

console.log('\n🎉 ALL DOMAIN & FIXTURE ASSERTIONS PASSED SUCCESSFULLY!');
