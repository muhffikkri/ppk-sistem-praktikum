import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useStudentViewModel } from './StudentViewModel';
import { PracticalSession } from './types';

export default function StudentScreen() {
  const {
    sessions,
    attendanceHistory,
    selectedSession,
    modalVisible,
    feedbackMessage,
    setModalVisible,
    handleSelectSession,
    handleCheckIn,
  } = useStudentViewModel();

  // Helper warna badge status sesi
  const getStatusStyle = (status: PracticalSession['status']) => {
    switch (status) {
      case 'terbuka':
        return { bg: '#e6f4ea', text: '#137333', label: 'Sesi Dibuka' };
      case 'terjadwal':
        return { bg: '#fef7e0', text: '#b06000', label: 'Terjadwal' };
      case 'tertutup':
        return { bg: '#fce8e6', text: '#c5221f', label: 'Sesi Ditutup' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Portal Praktikan</Text>
        <Text style={styles.headerSubtitle}>Selamat datang, Praktikan Demo</Text>
      </View>

      {/* Bagian Daftar Jadwal Praktikum */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Jadwal & Sesi Praktikum</Text>
        {sessions.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada jadwal praktikum.</Text>
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const badge = getStatusStyle(item.status);
              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => handleSelectSession(item)}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.courseName}>{item.courseName}</Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.text }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardDetail}>
                    Kelas: {item.className} | Ruang: {item.room}
                  </Text>
                  <Text style={styles.cardDetail}>
                    Waktu: {item.time} ({item.date})
                  </Text>
                  <Text style={styles.cardAssistant}>
                    Asisten: {item.assistantName}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* Bagian Riwayat Presensi Pribadi */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Riwayat Kehadiran Saya</Text>
        {attendanceHistory.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada catatan kehadiran.</Text>
        ) : (
          <FlatList
            data={attendanceHistory}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.historyCard}>
                <View>
                  <Text style={styles.historyCourse}>{item.courseName}</Text>
                  <Text style={styles.historyTime}>Pukul: {item.timestamp}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Modal / Bottom Sheet untuk Detail Sesi & Aksi Presensi */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedSession && (
              <>
                <Text style={styles.modalTitle}>Detail Sesi Praktikum</Text>
                <Text style={styles.modalSubtitle}>{selectedSession.courseName}</Text>

                <View style={styles.modalInfoContainer}>
                  <Text style={styles.infoText}>Kelas: {selectedSession.className}</Text>
                  <Text style={styles.infoText}>Ruangan: {selectedSession.room}</Text>
                  <Text style={styles.infoText}>Waktu: {selectedSession.time}</Text>
                  <Text style={styles.infoText}>Asisten: {selectedSession.assistantName}</Text>
                  <Text style={styles.infoText}>
                    Status:{' '}
                    <Text style={{ fontWeight: 'bold' }}>
                      {selectedSession.status.toUpperCase()}
                    </Text>
                  </Text>
                </View>

                {feedbackMessage && (
                  <View style={styles.feedbackContainer}>
                    <Text style={styles.feedbackText}>{feedbackMessage}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.checkInButton,
                    selectedSession.status !== 'terbuka' && styles.disabledButton,
                  ]}
                  onPress={() => handleCheckIn(selectedSession.id)}
                >
                  <Text style={styles.checkInButtonText}>Lakukan Presensi</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Tutup</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#202124',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#5f6368',
  },
  section: {
    flex: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3c4043',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#80868b',
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  courseName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a73e8',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDetail: {
    fontSize: 13,
    color: '#5f6368',
  },
  cardAssistant: {
    fontSize: 12,
    color: '#80868b',
    marginTop: 4,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8eaed',
  },
  historyCourse: {
    fontSize: 13,
    fontWeight: '600',
    color: '#202124',
  },
  historyTime: {
    fontSize: 11,
    color: '#5f6368',
  },
  statusBadge: {
    backgroundColor: '#e6f4ea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    color: '#137333',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#202124',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#1a73e8',
    marginBottom: 12,
  },
  modalInfoContainer: {
    backgroundColor: '#f1f3f4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#3c4043',
    marginBottom: 4,
  },
  feedbackContainer: {
    backgroundColor: '#e8f0fe',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  feedbackText: {
    fontSize: 13,
    color: '#1967d2',
  },
  checkInButton: {
    backgroundColor: '#1a73e8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  disabledButton: {
    backgroundColor: '#bdc1c6',
  },
  checkInButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#5f6368',
    fontSize: 14,
  },
});