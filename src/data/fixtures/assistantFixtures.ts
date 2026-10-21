import { AttendanceRecord, Session } from '../../domain/types';

/**
 * Fixture data sesi praktikum untuk demonstrasi role Asisten.
 * Memuat sesi dengan berbagai status: scheduled, open, dan closed.
 */
export const assistantSessions: Session[] = [
  {
    id: 'session-ast-01',
    courseName: 'Pengembangan Perangkat Bergerak',
    groupName: 'Kelas 3SE1 - Kelompok A',
    startsAt: '2026-10-21T08:00:00.000Z',
    endsAt: '2026-10-21T10:00:00.000Z',
    status: 'scheduled',
    openedAt: null,
    closedAt: null,
  },
  {
    id: 'session-ast-02',
    courseName: 'Praktikum Basis Data Lanjut',
    groupName: 'Kelas 3SE2 - Kelompok B',
    startsAt: '2026-10-21T10:30:00.000Z',
    endsAt: '2026-10-21T12:30:00.000Z',
    status: 'open',
    openedAt: '2026-10-21T10:30:15.000Z',
    closedAt: null,
  },
  {
    id: 'session-ast-03',
    courseName: 'Praktikum Sistem Terdistribusi',
    groupName: 'Kelas 3SE3 - Kelompok C',
    startsAt: '2026-10-20T13:00:00.000Z',
    endsAt: '2026-10-20T15:00:00.000Z',
    status: 'closed',
    openedAt: '2026-10-20T13:01:00.000Z',
    closedAt: '2026-10-20T15:05:00.000Z',
  },
  {
    id: 'session-ast-04',
    courseName: 'Praktikum Keamanan Siber',
    groupName: 'Kelas 3SE1 - Kelompok D',
    startsAt: '2026-10-22T08:00:00.000Z',
    endsAt: '2026-10-22T10:00:00.000Z',
    status: 'scheduled',
    openedAt: null,
    closedAt: null,
  },
];

/**
 * Fixture rekap kehadiran praktikan per sesi untuk Asisten.
 * Disusun sebagai Record<sessionId, AttendanceRecord[]>.
 */
export const assistantAttendance: Record<string, AttendanceRecord[]> = {
  'session-ast-01': [], // Keadaan kosong untuk pengujian empty state
  'session-ast-02': [
    {
      id: 'att-ast-02-1',
      sessionId: 'session-ast-02',
      studentId: 'std-101',
      studentName: 'Budi Santoso',
      checkedInAt: '2026-10-21T10:32:10.000Z',
    },
    {
      id: 'att-ast-02-2',
      sessionId: 'session-ast-02',
      studentId: 'std-102',
      studentName: 'Siti Rahma',
      checkedInAt: '2026-10-21T10:34:45.000Z',
    },
    {
      id: 'att-ast-02-3',
      sessionId: 'session-ast-02',
      studentId: 'std-103',
      studentName: 'Dimas Prasetyo',
      checkedInAt: '2026-10-21T10:36:20.000Z',
    },
  ],
  'session-ast-03': [
    {
      id: 'att-ast-03-1',
      sessionId: 'session-ast-03',
      studentId: 'std-104',
      studentName: 'Fajar Nugraha',
      checkedInAt: '2026-10-20T13:03:00.000Z',
    },
    {
      id: 'att-ast-03-2',
      sessionId: 'session-ast-03',
      studentId: 'std-105',
      studentName: 'Anisa Putri',
      checkedInAt: '2026-10-20T13:05:12.000Z',
    },
    {
      id: 'att-ast-03-3',
      sessionId: 'session-ast-03',
      studentId: 'std-106',
      studentName: 'Rizky Maulana',
      checkedInAt: '2026-10-20T13:10:50.000Z',
    },
  ],
  'session-ast-04': [],
};
