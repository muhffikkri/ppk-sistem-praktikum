import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useStudentAttendanceViewModel } from '../../state/StudentAttendanceContext';

export function StudentAttendanceHistoryScreen() {
  const { attendanceHistory, sessions } = useStudentAttendanceViewModel();

  const getCourseName = (sessionId: string) => {
    const s = sessions.find(item => item.id === sessionId);
    return s ? s.courseName : 'Sesi Praktikum';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Riwayat Kehadiran Saya</Text>
      {attendanceHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Belum ada riwayat kehadiran yang tercatat.</Text>
        </View>
      ) : (
        <FlatList
          data={attendanceHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.courseName}>{getCourseName(item.sessionId)}</Text>
              <Text style={styles.dateText}>Status: Hadir (Tercatat di Firestore)</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#dee2e6' },
  courseName: { fontSize: 16, fontWeight: 'bold', color: '#28a745' },
  dateText: { fontSize: 14, color: '#6c757d', marginTop: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#6c757d', fontSize: 14 }
});