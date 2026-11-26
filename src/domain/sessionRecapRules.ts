import {
  evaluateAttendancePunctuality,
  DEFAULT_TOLERANCE_MINUTES,
} from './lateToleranceRules';
import type {
  AttendanceRecord,
  LeaveRequest,
  PunctualityStatus,
} from './types';

export type StudentAttendanceStatus = 'present' | 'excused' | 'absent';

export type SessionRosterEntry = {
  studentId: string;
  studentName: string;
  studentNim?: string;
  status: StudentAttendanceStatus;
  checkedInAt?: string;
  punctuality?: PunctualityStatus;
  minutesLate?: number;
  leaveStatus?: 'pending' | 'approved' | 'rejected';
  leaveReason?: string;
};

export type SessionRosterSummary = {
  total: number;
  presentCount: number;
  ontimeCount: number;
  lateCount: number;
  excusedCount: number;
  absentCount: number;
};

export type SessionRecapResult = {
  entries: SessionRosterEntry[];
  summary: SessionRosterSummary;
};

/** Teks identitas di roster; UID Firebase tidak pernah ditampilkan sebagai NIM. */
export function studentIdentityMeta(entry: { studentNim?: string }): string {
  return entry.studentNim ? `NIM ${entry.studentNim}` : '';
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
 * Membangun rekap kehadiran menyeluruh untuk satu sesi (SRS-4.09 & SRS-4.10).
 * Menggabungkan seluruh ID praktikan yang terdaftar pada sesi, catatan presensi yang masuk,
 * permohonan izin yang disetujui, dan penilaian ketepatan waktu (ontime vs late).
 */
export function buildSessionRosterRecap(params: {
  participantIds: string[];
  attendees: AttendanceRecord[];
  leaves: LeaveRequest[];
  studentNamesById?: Record<string, string>;
  sessionStartsAt?: string;
  toleranceMinutes?: number;
}): SessionRecapResult {
  const {
    participantIds,
    attendees,
    leaves,
    studentNamesById = {},
    sessionStartsAt,
    toleranceMinutes = DEFAULT_TOLERANCE_MINUTES,
  } = params;

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

    let punctuality: PunctualityStatus | undefined;
    let minutesLate: number | undefined;

    if (status === 'present' && attendee?.checkedInAt && sessionStartsAt) {
      const punctualityEval = evaluateAttendancePunctuality(
        { startsAt: sessionStartsAt, toleranceMinutes },
        attendee.checkedInAt,
      );
      punctuality = punctualityEval.status;
      minutesLate = punctualityEval.minutesLate;
    }

    return {
      studentId,
      studentName,
      studentNim: attendee?.studentNim ?? leave?.studentNim,
      status,
      checkedInAt: attendee?.checkedInAt,
      punctuality,
      minutesLate,
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
  const ontimeCount = entries.filter((e) => e.punctuality === 'ontime').length;
  const lateCount = entries.filter((e) => e.punctuality === 'late').length;
  const excusedCount = entries.filter((e) => e.status === 'excused').length;
  const absentCount = entries.filter((e) => e.status === 'absent').length;

  return {
    entries,
    summary: {
      total: entries.length,
      presentCount,
      ontimeCount,
      lateCount,
      excusedCount,
      absentCount,
    },
  };
}
