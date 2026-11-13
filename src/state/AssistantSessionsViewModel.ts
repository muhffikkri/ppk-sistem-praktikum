import { useState } from 'react';

export interface Session {
  id: string;
  courseName: string;
  status: 'scheduled' | 'open' | 'closed';
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentName: string;
  studentId: string;
  timestamp: string;
}

export function useAssistantSessionsViewModel() {
  // 1. Daftar sesi asisten (Session[])
  const [sessions, setSessions] = useState<Session[]>([
    { id: 'sess-1', courseName: 'Praktikum Manajemen Basis Data', status: 'scheduled' },
    { id: 'sess-2', courseName: 'Praktikum Analisis Strategi Algoritma', status: 'open' },
  ]);

  // Data dummy daftar kehadiran praktikan per sesi
  const [attendances] = useState<Record<string, AttendanceRecord[]>>({
    'sess-1': [],
    'sess-2': [
      { id: 'att-1', sessionId: 'sess-2', studentName: 'Kayla Febrina', studentId: '24060124120004', timestamp: '08:15' }
    ],
  });

  // 2. Mengambil detail satu sesi
  const getSessionById = (sessionId: string): Session | undefined => {
    return sessions.find(s => s.id === sessionId);
  };

  // 3. Mengambil daftar praktikan yang sudah hadir pada sesi (AttendanceRecord[])
  const getAttendanceForSession = (sessionId: string): AttendanceRecord[] => {
    return attendances[sessionId] || [];
  };

  // 4. Membuka sesi (scheduled -> open)
  const openSession = (sessionId: string): { ok: boolean; reason?: string } => {
    const session = getSessionById(sessionId);
    if (!session) {
      return { ok: false, reason: 'Sesi tidak ditemukan' };
    }
    if (session.status === 'open') {
      return { ok: false, reason: 'Sesi sudah terbuka' };
    }
    if (session.status === 'closed') {
      return { ok: false, reason: 'Sesi yang sudah ditutup tidak bisa dibuka kembali' };
    }

    setSessions(prev =>
      prev.map(s => (s.id === sessionId ? { ...s, status: 'open' } : s))
    );
    return { ok: true };
  };

  // 5. Menutup sesi (open -> closed)
  const closeSession = (sessionId: string): { ok: boolean; reason?: string } => {
    const session = getSessionById(sessionId);
    if (!session) {
      return { ok: false, reason: 'Sesi tidak ditemukan' };
    }
    if (session.status === 'closed') {
      return { ok: false, reason: 'Sesi sudah ditutup' };
    }
    if (session.status === 'scheduled') {
      return { ok: false, reason: 'Sesi belum dibuka' };
    }

    setSessions(prev =>
      prev.map(s => (s.id === sessionId ? { ...s, status: 'closed' } : s))
    );
    return { ok: true };
  };

  return {
    sessions,
    getSessionById,
    getAttendanceForSession,
    openSession,
    closeSession,
  };
}