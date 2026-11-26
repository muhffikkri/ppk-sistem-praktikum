import type {
  AttendanceRecord,
  LeaveRequest,
  Session,
} from './types';

export type StudentAttendanceStatus = 'present' | 'excused' | 'absent';

export type SessionRosterEntry = {
  studentId: string;
  studentName: string;
  status: StudentAttendanceStatus;
  checkedInAt?: string;
  leaveStatus?: 'pending' | 'approved' | 'rejected';
  leaveReason?: string;
};

export type SessionRosterSummary = {
  total: number;
  presentCount: number;
  excusedCount: number;
  absentCount: number;
};

export type SessionRecapResult = {
  entries: SessionRosterEntry[];
  summary: SessionRosterSummary;
};

/**
 * Validasi apakah presensi diizinkan pada sesi tertentu (SRS-4.08).
 * Presensi hanya sah bila sesi berstatus 'open'.
 */
export function canCheckInToSession(session: Session | undefined): {
  allowed: boolean;
  reason?: 'session_not_found' | 'session_not_open' | 'session_closed';
} {
  if (!session) {
    return { allowed: false, reason: 'session_not_found' };
  }
  if (session.status === 'scheduled') {
    return { allowed: false, reason: 'session_not_open' };
  }
  if (session.status === 'closed') {
    return { allowed: false, reason: 'session_closed' };
  }
  return { allowed: true };
}

/**
 * Menentukan status kehadiran peserta perorangan (SRS-4.09 & Kontrak K6):
 * 1. Bila izin praktikan disetujui (status === 'approved') pada sesi ini,
 *    status ditetapkan sebagai 'excused' (tidak hadir dengan izin).
 * 2. Bila terdapat catatan presensi (dan tidak ada izin disetujui), status 'present'.
 * 3. Bila tidak ada presensi maupun izin disetujui, status 'absent'.
 */
export function determineParticipantStatus(
  studentId: string,
  attendees: AttendanceRecord[],
  leaves: LeaveRequest[],
): {
  status: StudentAttendanceStatus;
  attendance?: AttendanceRecord;
  approvedLeave?: LeaveRequest;
} {
  const approvedLeave = leaves.find(
    (l) => l.studentId === studentId && l.status === 'approved',
  );
  if (approvedLeave) {
    return { status: 'excused', approvedLeave };
  }

  const attendance = attendees.find((a) => a.studentId === studentId);
  if (attendance) {
    return { status: 'present', attendance };
  }

  return { status: 'absent' };
}

/**
 * Membangun rekap kehadiran menyeluruh untuk satu sesi (SRS-4.09).
 * Menggabungkan seluruh ID praktikan yang terdaftar pada sesi, catatan presensi yang masuk,
 * dan permohonan izin yang disetujui.
 */
export function buildSessionRosterRecap(params: {
  participantIds: string[];
  attendees: AttendanceRecord[];
  leaves: LeaveRequest[];
  studentNamesById?: Record<string, string>;
}): SessionRecapResult {
  const { participantIds, attendees, leaves, studentNamesById = {} } = params;

  // Himpun seluruh ID peserta dari roster sesi + peserta yang hadir bila ada di luar roster awal
  const allStudentIds = Array.from(
    new Set([...participantIds, ...attendees.map((a) => a.studentId)]),
  );

  const entries: SessionRosterEntry[] = allStudentIds.map((studentId) => {
    const attendee = attendees.find((a) => a.studentId === studentId);
    const leave = leaves.find((l) => l.studentId === studentId);

    const studentName =
      studentNamesById[studentId] ||
      attendee?.studentName ||
      leave?.studentName ||
      `Praktikan (${studentId})`;

    const { status } = determineParticipantStatus(studentId, attendees, leaves);

    return {
      studentId,
      studentName,
      status,
      checkedInAt: attendee?.checkedInAt,
      leaveStatus: leave?.status,
      leaveReason: leave?.reason,
    };
  });

  // Urutkan: Hadir pertama (berdasarkan waktu), lalu Izin, lalu Belum hadir
  entries.sort((a, b) => {
    const order: Record<StudentAttendanceStatus, number> = {
      present: 0,
      excused: 1,
      absent: 2,
    };
    if (order[a.status] !== order[b.status]) {
      return order[a.status] - order[b.status];
    }
    if (a.status === 'present' && b.status === 'present') {
      const timeA = a.checkedInAt ? new Date(a.checkedInAt).getTime() : 0;
      const timeB = b.checkedInAt ? new Date(b.checkedInAt).getTime() : 0;
      return timeA - timeB;
    }
    return a.studentName.localeCompare(b.studentName);
  });

  const presentCount = entries.filter((e) => e.status === 'present').length;
  const excusedCount = entries.filter((e) => e.status === 'excused').length;
  const absentCount = entries.filter((e) => e.status === 'absent').length;

  return {
    entries,
    summary: {
      total: entries.length,
      presentCount,
      excusedCount,
      absentCount,
    },
  };
}
