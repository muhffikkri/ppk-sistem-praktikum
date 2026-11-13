import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useStudentAttendanceViewModel } from '../../state/StudentAttendanceContext';

export function StudentScheduleScreen({ navigation }: any) {
  const { sessions, loading, error } = useStudentAttendanceViewModel();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Terjadi kesalahan: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Jadwal Praktikum & Sesi Saya</Text>
      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Belum ada jadwal atau sesi praktikum yang terdaftar untuk Anda.</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => navigation.navigate('StudentSessionDetail', { sessionId: item.id })}
            >
              <Text style={styles.courseName}>{item.courseName}</Text>
              <Text style={styles.groupText}>Kelas: {item.groupName}</Text>
              <Text style={[styles.statusText, item.status === 'open' ? styles.open : styles.closed]}>
                Status: {item.status.toUpperCase()}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#dee2e6' },
  courseName: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  groupText: { fontSize: 14, color: '#6c757d', marginTop: 4 },
  statusText: { fontSize: 12, fontWeight: 'bold', marginTop: 8 },
  open: { color: '#28a745' },
  closed: { color: '#dc3545' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#6c757d', fontSize: 14 },
  errorText: { color: '#dc3545', textAlign: 'center' }
});