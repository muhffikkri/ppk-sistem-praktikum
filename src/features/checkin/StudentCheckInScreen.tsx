import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import { formatHourMinute, formatTimeRange } from '../../shared/format/date';
import {
  BackButton,
  Banner,
  Button,
  ConfirmSheet,
  EmptyState,
  Screen,
  SectionHeader,
  SkeletonList,
  spacing,
  StatusBadge,
  Text,
} from '../../shared/ui';
import { GeofenceStatusCard } from './GeofenceStatusCard';
import { useStudentCheckIn } from './useStudentCheckIn';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentCheckIn'>;

/**
 * Presensi setelah scan QR (#55). Pengguna datang untuk satu tugas, jadi
 * layar dibuka dengan ringkasan sesi satu baris, lalu langsung status lokasi
 * dan tombol presensi. Detail lengkap tetap ada di layar detail sesi.
 */
export function StudentCheckInScreen({ route, navigation }: Props) {
  const { sessionId, qrToken } = route.params;
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
    leaveApproved,
    refreshLocation,
    performCheckIn,
    clearError,
  } = useStudentCheckIn(sessionId, qrToken);

  const [confirmModal, setConfirmModal] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);
  const back = <BackButton onPress={() => navigation.goBack()} />;

  if (loading && !session) {
    return (
      <Screen withDock={false}>
        {back}
        <SkeletonList variant="card" count={2} label="Memuat sesi praktikum…" />
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen withDock={false}>
        {back}
        <EmptyState
          title="Sesi tidak ditemukan"
          description="Sesi praktikum tidak tersedia atau telah dihapus."
        />
      </Screen>
    );
  }

  if (!qrToken) {
    return (
      <Screen withDock={false}>
        {back}
        <EmptyState
          icon="qr-code-outline"
          title="Scan QR dulu"
          description="Presensi hanya tercatat setelah memindai kode berputar yang ditampilkan asisten."
          action={
            <Button
              label="Scan QR Presensi"
              onPress={() => navigation.replace('BarcodeScan')}
            />
          }
        />
      </Screen>
    );
  }

  const handleConfirmSubmit = async () => {
    setConfirmModal(false);
    const result = await performCheckIn();
    if (result.ok) setSuccessBanner(true);
  };

  const checkedIn = isAlreadyCheckedIn || successBanner;
  const canCheckIn =
    isOpen &&
    !checkedIn &&
    !leaveApproved &&
    !loading &&
    geofence?.status === 'inside';
  const labLabel = lab
    ? `${lab.name} · ${lab.building}`
    : (session.lab ?? 'Lab belum ditentukan');

  const helper = checkedIn
    ? null
    : !isOpen
      ? {
          tone: 'muted' as const,
          text: 'Presensi hanya bisa dilakukan saat sesi dibuka asisten.',
        }
      : geofence?.status !== 'inside'
        ? {
            tone: 'danger' as const,
            text: 'Dekati laboratorium hingga berada dalam radius untuk mengaktifkan tombol presensi.',
          }
        : null;

  return (
    <Screen withDock={false}>
      {back}

      <View style={styles.summary}>
        <View style={styles.summaryText}>
          <Text variant="title" numberOfLines={2}>
            {session.courseName}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {`${session.groupName} · ${formatTimeRange(session.startsAt, session.endsAt)} · ${labLabel}`}
          </Text>
        </View>
        <StatusBadge
          label={isOpen ? 'Terbuka' : 'Tertutup'}
          tone={isOpen ? 'success' : 'neutral'}
        />
      </View>

      {error ? (
        <Banner
          tone="danger"
          title="Presensi terkendala"
          message={error}
          onDismiss={clearError}
        />
      ) : null}

      {leaveApproved && !checkedIn ? (
        <Banner
          tone="warning"
          title="Izin sudah disetujui"
          message="Presensi untuk sesi ini tidak diperlukan. Hubungi asisten bila ada perubahan status izin."
        />
      ) : null}

      {checkedIn ? (
        <Banner
          tone="success"
          title="Presensi berhasil"
          message={
            attendance?.checkedInAt
              ? `Tercatat pada ${formatHourMinute(new Date(attendance.checkedInAt))}.`
              : 'Kehadiran Anda berhasil dicatat.'
          }
        />
      ) : null}

      <View style={styles.section}>
        <SectionHeader
          title="Lokasi kamu"
          actionLabel={checkingLocation ? 'Memeriksa…' : 'Periksa ulang'}
          onAction={refreshLocation}
        />
        <GeofenceStatusCard
          geofence={geofence}
          checkingLocation={checkingLocation}
        />
      </View>

      <View style={styles.actions}>
        {checkedIn ? (
          <Button
            label="Sudah hadir"
            variant="outline"
            icon="checkmark-circle-outline"
            disabled
            onPress={() => {}}
          />
        ) : (
          <Button
            label={
              submitting
                ? 'Memproses presensi…'
                : leaveApproved
                  ? 'Izin disetujui'
                  : 'Presensi sekarang'
            }
            variant="primary"
            loading={submitting}
            disabled={!canCheckIn || submitting}
            onPress={() => setConfirmModal(true)}
          />
        )}

        {helper ? (
          <Text variant="caption" tone={helper.tone} style={styles.helper}>
            {helper.text}
          </Text>
        ) : null}

        {error ? (
          <Button
            label="Scan ulang QR"
            variant="outline"
            onPress={() => navigation.replace('BarcodeScan')}
          />
        ) : null}
      </View>

      <ConfirmSheet
        visible={confirmModal}
        title="Konfirmasi presensi"
        description={`Anda akan melakukan presensi untuk ${session.courseName} di ${lab?.name ?? 'laboratorium'}.`}
        confirmLabel="Ya, presensi"
        cancelLabel="Batal"
        loading={submitting}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setConfirmModal(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  summaryText: { flex: 1, gap: spacing.xs, minWidth: 0 },
  section: { gap: spacing.sm },
  actions: { gap: spacing.sm },
  helper: { textAlign: 'center', paddingHorizontal: spacing.md },
});
