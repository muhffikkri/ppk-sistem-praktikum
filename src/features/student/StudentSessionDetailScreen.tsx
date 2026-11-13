import React from 'react';
import { View, Text, Button, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useStudentAttendanceViewModel } from '../../state/StudentAttendanceContext';

export function StudentSessionDetailScreen({ route, navigation }: any) {
  const { sessionId } = route.params;
  const { getSessionById, getAttendanceForSession, checkIn, loading } = useStudentAttendanceViewModel();

  const session = getSessionById(sessionId);
  const attendance = getAttendanceForSession(sessionId);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Sesi praktikum tidak ditemukan.</Text>
      </View>
    );
  }

  const isAlreadyCheckedIn = attendance !== undefined;
  const isOpen = session.status === 'open';

  const handleCheckIn = async () => {
    const result = await checkIn(sessionId);
    if (result.ok) {
      Alert.alert('Sukses', 'Presensi berhasil dicatat secara real-time!');
    } else {
      if (result.reason === 'already_checked_in') {
        Alert.alert('Perhatian', 'Anda sudah melakukan presensi pada sesi ini.');
      } else if (result.reason === 'invalid_status') {
        Alert.alert('Gagal', 'Sesi belum dibuka atau sudah ditutup.');
      } else {
        Alert.alert('Gagal', `Terjadi kesalahan: ${result.reason}`);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{session.courseName}</Text>
      <Text style={styles.info}>Kelas: {session.groupName}</Text>
      <Text style={styles.info}>Status: <Text style={styles.bold}>{session.status.toUpperCase()}</Text></Text>

      {isAlreadyCheckedIn ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>✓ Anda Sudah Hadir</Text>
        </View>
      ) : (
        <View style={styles.actionContainer}>
          <Button
            title={isOpen ? "Presensi Sekarang" : `Sesi ${session.status}`}
            disabled={!isOpen}
            onPress={handleCheckIn}
          />
        </View>
      )}

      <View style={styles.leaveButtonContainer}>
        <Button
          title="Ajukan Izin Ketidakhadiran"
          color="#ff9800"
          onPress={() => navigation.navigate('StudentLeaveRequestForm', { sessionId })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: 'red' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  info: { fontSize: 16, marginBottom: 8, color: '#333' },
  bold: { fontWeight: 'bold', color: '#007AFF' },
  successBox: { marginTop: 20, backgroundColor: '#e6f4ea', padding: 16, borderRadius: 8 },
  successText: { color: '#137333', fontWeight: 'bold', fontSize: 16 },
  actionContainer: { marginTop: 20 },
  leaveButtonContainer: { marginTop: 12 }
});