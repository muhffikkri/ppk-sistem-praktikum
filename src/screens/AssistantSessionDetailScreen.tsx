import React from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import { useAssistantSessionsViewModel } from '../state/AssistantSessionsViewModel';

export function AssistantSessionDetailScreen({ route, navigation }: any) {
  const { sessionId } = route.params;
  const { getSessionById, getAttendanceForSession, openSession, closeSession } = useAssistantSessionsViewModel();

  const session = getSessionById(sessionId);
  const attendees = getAttendanceForSession(sessionId);

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Sesi tidak ditemukan</Text>
      </View>
    );
  }

  const handleOpen = () => {
    const res = openSession(sessionId);
    if (res.ok) {
      Alert.alert('Berhasil', 'Sesi praktikum telah dibuka.');
    } else {
      Alert.alert('Gagal', `Tidak dapat membuka sesi (${res.reason}).`);
    }
  };

  const handleClose = () => {
    const res = closeSession(sessionId);
    if (res.ok) {
      Alert.alert('Berhasil', 'Sesi praktikum telah ditutup.');
    } else {
      Alert.alert('Gagal', `Tidak dapat menutup sesi (${res.reason}).`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{session.courseName}</Text>
      <Text style={styles.info}>Status: <Text style={styles.bold}>{session.status.toUpperCase()}</Text></Text>
      <Text style={styles.info}>Jumlah Hadir: {attendees.length} Praktikan</Text>

      <View style={styles.buttonContainer}>
        {session.status === 'scheduled' && (
          <Button title="Buka Sesi" onPress={handleOpen} />
        )}
        {session.status === 'open' && (
          <Button title="Tutup Sesi" color="red" onPress={handleClose} />
        )}
        <Button
          title="Lihat Rekap Presensi"
          onPress={() => navigation.navigate('AssistantAttendanceRoster', { sessionId })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: 'red' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  info: { fontSize: 15, marginBottom: 6, color: '#333' },
  bold: { fontWeight: 'bold', color: '#007AFF' },
  buttonContainer: { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' }
});