export type SessionStatus = 'terjadwal' | 'terbuka' | 'tertutup';

export interface PracticalSession {
  id: string;
  courseName: string;
  className: string;
  time: string;
  date: string;
  status: SessionStatus;
  assistantName: string;
  room: string;
}

export interface AttendanceRecord {
  sessionId: string;
  courseName: string;
  timestamp: string;
  status: 'Hadir';
}