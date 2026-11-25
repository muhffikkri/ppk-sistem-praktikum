import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import { formatHourMinute } from '../../shared/format/date';
import {
  Banner,
  Button,
  Card,
  CardContent,
  ConfirmSheet,
  EmptyState,
  Header,
  LoadingState,
  Screen,
  SectionHeader,
  spacing,
  Text,
  TopBar,
} from '../../shared/ui';
import { GeofenceStatusCard } from './GeofenceStatusCard';
import { useStudentCheckIn } from './useStudentCheckIn';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentCheckIn'>;

export function StudentCheckInScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const {
    session,
    lab,
    attendance,
    geofence,
    loading,
    checkingLocation,
    submitting,
    error,
    isAlreadyCheckedIn,
    isOpen,
    refreshLocation,
    performCheckIn,
    clearError,
  } = useStudentCheckIn(sessionId);

  const [confirmModal, setConfirmModal] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);

  if (loading && !session) {
    return (
      <Screen withDock={false}>
        <TopBar onBack={() => navigation.goBack()} />
        <LoadingState label="Memuat sesi praktikum…" />
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen withDock={false}>
        <TopBar onBack={() => navigation.goBack()} />
        <EmptyState
          title="Sesi tidak ditemukan"
          description="Sesi praktikum tidak tersedia atau telah dihapus."
        />
      </Screen>
    );
  }

  const handleConfirmSubmit = async () => {
    setConfirmModal(false);
    const result = await performCheckIn();
    if (result.ok) {
      setSuccessBanner(true);
    }
  };

  const canCheckIn = isOpen && !isAlreadyCheckedIn && geofence?.status === 'inside';

  return (
    <Screen withDock={false}>
      <TopBar onBack={() => navigation.goBack()} />
      <Header
        title="Presensi Lokasi"
        description={`${session.courseName} — ${session.groupName}`}
      />

      {error ? (
        <Banner
          tone="danger"
          title="Presensi Terkendala"
          message={error}
          onDismiss={clearError}
        />
      ) : null}

      {successBanner || isAlreadyCheckedIn ? (
        <Banner
          tone="success"
          title="Presensi Berhasil"
          message={
            attendance?.checkedInAt
              ? `Tercatat pada ${formatHourMinute(new Date(attendance.checkedInAt))}.`
              : 'Kehadiran Anda berhasil dicatat.'
          }
        />
      ) : null}

      {/* Informasi Sesi */}
      <View style={styles.section}>
        <SectionHeader title="Detail Sesi" />
        <Card interactive={false}>
          <CardContent>
            <View style={styles.detailGrid}>
              <View style={styles.infoRow}>
                <Text variant="caption" tone="muted">Mata Kuliah</Text>
                <Text variant="captionStrong">{session.courseName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="caption" tone="muted">Kelas & Jadwal</Text>
                <Text variant="captionStrong">
                  {session.groupName} • {session.startsAt.slice(11, 16)}–{session.endsAt.slice(11, 16)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="caption" tone="muted">Laboratorium</Text>
                <Text variant="captionStrong">
                  {lab ? `${lab.name} (${lab.building})` : (session.lab ?? 'Tidak ditentukan')}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="caption" tone="muted">Status Sesi</Text>
                <Text
                  variant="captionStrong"
                  tone={isOpen ? 'violet' : 'muted'}
                >
                  {isOpen ? 'Dibuka (Presensi Aktif)' : `Ditutup (${session.status})`}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* Status Geofence */}
      <View style={styles.section}>
        <SectionHeader
          title="Status Lokasi & Geofence"
          actionLabel={checkingLocation ? 'Memeriksa…' : 'Periksa Lokasi'}
          onAction={refreshLocation}
        />
        <GeofenceStatusCard
          geofence={geofence}
          checkingLocation={checkingLocation}
        />
      </View>

      {/* Aksi Presensi */}
      <View style={styles.actionSection}>
        {isAlreadyCheckedIn ? (
          <Button
            label="✓ Anda Sudah Hadir"
            variant="outline"
            disabled
            onPress={() => {}}
          />
        ) : (
          <Button
            label={submitting ? 'Memproses Presensi…' : 'Presensi Sekarang'}
            variant="primary"
            loading={submitting}
            disabled={!canCheckIn || submitting}
            onPress={() => setConfirmModal(true)}
          />
        )}

        {!isAlreadyCheckedIn && !isOpen && (
          <Text variant="caption" tone="muted" style={styles.helperText}>
            Presensi hanya dapat dilakukan saat sesi praktikum dalam status dibuka.
          </Text>
        )}

        {!isAlreadyCheckedIn && isOpen && geofence?.status !== 'inside' && (
          <Text variant="caption" tone="danger" style={styles.helperText}>
            Dekati lokasi laboratorium hingga berada dalam batas radius untuk mengaktifkan tombol presensi.
          </Text>
        )}
      </View>

      <ConfirmSheet
        visible={confirmModal}
        title="Konfirmasi Presensi"
        description={`Anda akan melakukan presensi untuk ${session.courseName} di ${lab?.name ?? 'laboratorium'}.`}
        confirmLabel="Ya, Presensi"
        cancelLabel="Batal"
        loading={submitting}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setConfirmModal(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  detailGrid: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionSection: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  helperText: {
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});
