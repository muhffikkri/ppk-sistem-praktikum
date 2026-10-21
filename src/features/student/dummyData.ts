import { PracticalSession } from './types';

export const initialSessions: PracticalSession[] = [
  {
    id: '1',
    courseName: 'Pemrograman Perangkat Bergerak',
    className: 'IF-A',
    time: '08:00 - 10:30',
    date: '21 Oktober 2026',
    status: 'terbuka',
    assistantName: 'Budi Santoso, M.Kom.',
    room: 'Lab Komputer D1',
  },
  {
    id: '2',
    courseName: 'Penambangan Data',
    className: 'IF-A',
    time: '13:00 - 15:30',
    date: '21 Oktober 2026',
    status: 'terjadwal',
    assistantName: 'Siti Rahma, S.Kom.',
    room: 'Lab Komputer D2',
  },
  {
    id: '3',
    courseName: 'Visi Komputer',
    className: 'IF-A',
    time: '09:00 - 11:30',
    date: '22 Oktober 2026',
    status: 'tertutup',
    assistantName: 'Ahmad Fauzi, M.Cs.',
    room: 'Lab Komputer D3',
  },
];