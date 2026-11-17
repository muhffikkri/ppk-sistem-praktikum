import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AttendanceRecord,
  checkInStudent,
  Session,
  subscribeStudentAttendance,
  subscribeStudentSessions
} from '../services/firestore/studentService';

interface StudentContextType {
  sessions: Session[];
  attendanceHistory: AttendanceRecord[];
  loading: boolean;
  error: string | null;
  getSessionById: (sessionId: string) => Session | undefined;
  getAttendanceForSession: (sessionId: string) => AttendanceRecord | undefined;
  checkIn: (sessionId: string) => Promise<{ ok: boolean; reason?: string }>;
  refetch: () => void;
}

const StudentAttendanceContext = createContext<StudentContextType | undefined>(undefined);

export const StudentAttendanceProvider: React.FC<{ children: React.ReactNode; currentStudentId: string }> = ({ 
  children, 
  currentStudentId 
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribeSessions = subscribeStudentSessions(
      currentStudentId,
      (data) => {
        setSessions(data);
        setLoading(false);
      },
      (err: any) => {
        setError(typeof err === 'string' ? err : err?.message || 'Terjadi kesalahan pada sesi');
        setLoading(false);
      }
    );

    const unsubscribeAttendance = subscribeStudentAttendance(
      currentStudentId,
      (data) => {
        setAttendanceHistory(data);
      },
      (err: any) => {
        setError(typeof err === 'string' ? err : err?.message || 'Terjadi kesalahan pada absensi');
      }
    );

    return () => {
      unsubscribeSessions();
      unsubscribeAttendance();
    };
  }, [currentStudentId]);

  const getSessionById = (sessionId: string) => {
    return sessions.find(s => s.id === sessionId);
  };

  const getAttendanceForSession = (sessionId: string) => {
    return attendanceHistory.find(att => att.sessionId === sessionId);
  };

  const checkIn = async (sessionId: string) => {
    const targetSession = getSessionById(sessionId);
    if (!targetSession) {
      return { ok: false, reason: 'Sesi tidak ditemukan' };
    }
    
    return await checkInStudent({
      session: targetSession,
      student: { id: currentStudentId } as any,
      existing: attendanceHistory.filter(att => att.sessionId === sessionId),
    });
  };

  return (
    <StudentAttendanceContext.Provider value={{
      sessions,
      attendanceHistory,
      loading,
      error,
      getSessionById,
      getAttendanceForSession,
      checkIn,
      refetch: () => {}
    }}>
      {children}
    </StudentAttendanceContext.Provider>
  );
};

export const useStudentAttendanceViewModel = () => {
  const context = useContext(StudentAttendanceContext);
  if (!context) {
    throw new Error('useStudentAttendanceViewModel harus digunakan di dalam StudentAttendanceProvider');
  }
  return context;
};