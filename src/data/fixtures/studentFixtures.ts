import { AttendanceRecord, DemoStudent, Session } from '../../domain/types';

/**
 * Identitas praktikan demo yang stabil.
 * Dipakai untuk validasi pencegahan presensi ganda.
 */
export const currentStudent: DemoStudent = {
  id: 'std-demo-202301',
  displayName: 'Saburo Ardiansyah',
};

/**
 * Fixture data sesi praktikum dari sudut pandang Praktikan.
 * Berdiri sendiri dan tidak tersinkron secara realtime dengan fixture asisten.
 */
export const studentSessions: Session[] = [
  {
    id: 'session-std-01',
    courseName: 'Pengembangan Perangkat Bergerak',
    groupName: 'Kelas 3SE1 - Lab Komputer 2',
    startsAt: '2026-10-21T08:00:00.000Z',
    endsAt: '2026-10-21T10:00:00.000Z',
    status: 'open', // Sesi terbuka: siap untuk didemokan presensi!
    openedAt: '2026-10-21T08:00:00.000Z',
    closedAt: null,
  },
  {
    id: 'session-std-02',
    courseName: 'Praktikum Basis Data Lanjut',
    groupName: 'Kelas 3SE1 - Lab Basis Data',
    startsAt: '2026-10-21T10:30:00.000Z',
    endsAt: '2026-10-21T12:30:00.000Z',
    status: 'open', // Sesi terbuka tetapi sudah ada presensi: untuk demo pencegahan duplikasi!
    openedAt: '2026-10-21T10:30:00.000Z',
    closedAt: null,
  },
  {
    id: 'session-std-03',
    courseName: 'Praktikum Sistem Terdistribusi',
    groupName: 'Kelas 3SE1 - Lab Jaringan',
    startsAt: '2026-10-22T08:00:00.000Z',
    endsAt: '2026-10-22T10:00:00.000Z',
    status: 'scheduled', // Sesi terjadwal: tombol presensi dinonaktifkan
    openedAt: null,
    closedAt: null,
  },
  {
    id: 'session-std-04',
    courseName: 'Praktikum Jaringan Komputer',
    groupName: 'Kelas 3SE1 - Lab Jaringan',
    startsAt: '2026-10-20T13:00:00.000Z',
    endsAt: '2026-10-20T15:00:00.000Z',
    status: 'closed', // Sesi tertutup: presensi ditutup secara terminal
    openedAt: '2026-10-20T13:00:00.000Z',
    closedAt: '2026-10-20T15:00:00.000Z',
  },
];

/**
 * Catatan riwayat presensi milik praktikan demo.
 * Memuat catatan awal untuk session-std-02 dan sesi terdahulu session-std-04.
 */
export const studentAttendance: AttendanceRecord[] = [
  {
    id: 'att-std-init-01',
    sessionId: 'session-std-02',
    studentId: currentStudent.id,
    studentName: currentStudent.displayName,
    checkedInAt: '2026-10-21T10:32:05.000Z',
  },
  {
    id: 'att-std-init-02',
    sessionId: 'session-std-04',
    studentId: currentStudent.id,
    studentName: currentStudent.displayName,
    checkedInAt: '2026-10-20T13:05:00.000Z',
  },
];
