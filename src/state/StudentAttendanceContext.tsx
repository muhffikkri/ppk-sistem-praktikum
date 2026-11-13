import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Session, 
  AttendanceRecord, 
  subscribeStudentSessions, 
  subscribeStudentAttendance, 
  checkInStudent 
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
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    const unsubscribeAttendance = subscribeStudentAttendance(
      currentStudentId,
      (data) => {
        setAttendanceHistory(data);
      },
      (err) => {
        setError(err.message);
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
    return await checkInStudent(sessionId, currentStudentId);
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