import { useState } from 'react';
import { PracticalSession, AttendanceRecord } from './types';
import { initialSessions } from './dummyData';

export function useStudentViewModel() {
  const [sessions, setSessions] = useState<PracticalSession[]>(initialSessions);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [selectedSession, setSelectedSession] = useState<PracticalSession | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Fungsi untuk memilih sesi dan membuka detail/modal
  const handleSelectSession = (session: PracticalSession) => {
    setSelectedSession(session);
    setModalVisible(true);
    setFeedbackMessage(null);
  };

  // Fungsi untuk melakukan presensi dengan validasi
  const handleCheckIn = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    
    // Validasi 1: Sesi harus terbuka
    if (!session || session.status !== 'terbuka') {
      setFeedbackMessage('Gagal: Presensi hanya dapat dilakukan pada sesi yang sedang dibuka oleh Asisten.');
      return;
    }

    // Validasi 2: Cek presensi ganda (apakah sudah pernah presensi di sesi ini)
    const alreadyAttended = attendanceHistory.some((item) => item.sessionId === sessionId);
    if (alreadyAttended) {
      setFeedbackMessage('Peringatan: Anda sudah melakukan presensi pada sesi ini sebelumnya.');
      return;
    }

    // Catat waktu lokal saat ini
    const currentTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const newRecord: AttendanceRecord = {
      sessionId: session.id,
      courseName: session.courseName,
      timestamp: currentTime,
      status: 'Hadir',
    };

    setAttendanceHistory((prev) => [newRecord, ...prev]);
    setFeedbackMessage(`Berhasil! Presensi tercatat pada pukul ${currentTime}.`);
  };

  return {
    sessions,
    attendanceHistory,
    selectedSession,
    modalVisible,
    feedbackMessage,
    setModalVisible,
    handleSelectSession,
    handleCheckIn,
  };
}