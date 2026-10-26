import { AttendanceRecord, Session } from '../../domain/types';

/**
 * Fixture data sesi praktikum untuk demonstrasi role Asisten.
 * Memuat sesi dengan berbagai status: scheduled, open, dan closed.
 */
export const assistantSessions: Session[] = [
  {
    id: 'session-ast-01',
    courseName: 'Praktikum Sistem Terdistribusi',
    groupName: 'Kelas 3SE1 - Kelompok A',
    startsAt: '2026-10-19T08:00:00.000Z',
    endsAt: '2026-10-19T10:30:00.000Z',
    status: 'closed',
    openedAt: '2026-10-19T08:00:00.000Z',
    closedAt: '2026-10-19T10:30:00.000Z',
    lab: 'Lab 3.2 RPL · Ged B',
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
    lab: 'Lab Database · Ged C',
  },
  {
    id: 'session-ast-03',
    courseName: 'Praktikum Jaringan Komputer',
    groupName: 'Kelas 3SE3 - Kelompok C',
    startsAt: '2026-10-22T08:00:00.000Z',
    endsAt: '2026-10-22T10:30:00.000Z',
    status: 'scheduled',
    openedAt: null,
    closedAt: null,
    lab: 'Lab Jaringan · Ged B302',
  },
  {
    id: 'session-ast-04',
    courseName: 'Praktikum Keamanan Siber',
    groupName: 'Kelas 3SE1 - Kelompok D',
    startsAt: '2026-10-23T13:00:00.000Z',
    endsAt: '2026-10-23T16:00:00.000Z',
    status: 'scheduled',
    openedAt: null,
    closedAt: null,
    lab: 'Lab AI & Vision · Ged C',
  },
  {
    id: 'session-ast-05',
    courseName: 'Praktikum IoT & Sensor',
    groupName: 'Kelas 3SE4 - Kelompok E',
    startsAt: '2026-10-20T10:00:00.000Z',
    endsAt: '2026-10-20T12:00:00.000Z',
    status: 'closed',
    openedAt: '2026-10-20T10:00:00.000Z',
    closedAt: '2026-10-20T12:00:00.000Z',
    lab: 'Lab Sensor & IoT · Ged A',
  },
  {
    id: 'session-ast-06',
    courseName: 'Inventaris & Tutup Lab',
    groupName: 'Semua Kelompok',
    startsAt: '2026-10-23T14:00:00.000Z',
    endsAt: '2026-10-23T17:00:00.000Z',
    status: 'scheduled',
    openedAt: null,
    closedAt: null,
    lab: 'Gedung B & C',
  },
];

/**
 * Fixture rekap kehadiran praktikan per sesi untuk Asisten.
 * Disusun sebagai Record<sessionId, AttendanceRecord[]>.
 */
export const assistantAttendance: Record<string, AttendanceRecord[]> = {
  'session-ast-01': [
    {
      id: 'att-ast-01-1',
      sessionId: 'session-ast-01',
      studentId: 'std-101',
      studentName: 'Budi Santoso',
      checkedInAt: '2026-10-19T08:02:00.000Z',
    },
    {
      id: 'att-ast-01-2',
      sessionId: 'session-ast-01',
      studentId: 'std-102',
      studentName: 'Siti Rahma',
      checkedInAt: '2026-10-19T08:05:10.000Z',
    },
  ],
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
  'session-ast-05': [
    {
      id: 'att-ast-05-1',
      sessionId: 'session-ast-05',
      studentId: 'std-107',
      studentName: 'Gita Gutawa',
      checkedInAt: '2026-10-20T10:03:00.000Z',
    },
  ],
  'session-ast-06': [],
};
