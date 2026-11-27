import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  canRequestLeave,
  isLeaveBlockingCheckIn,
} from '../../domain/leaveRules';
import {
  Banner,
  Button,
  Card,
  CardContent,
  EmptyState,
  LoadingState,
  Header,
  Screen,
  spacing,
  Text,
  BackButton,
} from '../../shared/ui';
import { useStudentAttendanceViewModel } from '../../state/StudentAttendanceContext';
import { useStudentLeaveViewModel } from '../leave';
import { formatClock, formatSessionDate, formatTimeRange } from './formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentSessionDetail'>;

const STATUS_LABEL: Record<string, string> = {
  open: 'Dibuka',
  scheduled: 'Terjadwal',
  closed: 'Ditutup',
};

export function StudentSessionDetailScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const { getSessionById, getAttendanceForSession, loading } =
    useStudentAttendanceViewModel();
  const { getLeaveForSession } = useStudentLeaveViewModel();

  const session = getSessionById(sessionId);
  const attendance = getAttendanceForSession(sessionId);

  if (loading && !session) {
    return (
      <Screen withDock={false}>
        <BackButton onPress={() => navigation.goBack()} />
        <LoadingState label="Memuat detail sesi…" />
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen withDock={false}>
        <BackButton onPress={() => navigation.goBack()} />
        <EmptyState
          title="Sesi tidak ditemukan"
          description="Sesi praktikum tidak tersedia atau telah dihapus."
        />
      </Screen>
    );
  }

  const isAlreadyCheckedIn = attendance !== undefined;
  const isOpen = session.status === 'open';
  const leave = getLeaveForSession(sessionId);
  const leaveApproved = isLeaveBlockingCheckIn(leave);
  const canLeave = canRequestLeave(session, attendance, leave);

  return (
    <Screen withDock={false}>
      <BackButton onPress={() => navigation.goBack()} />

      <View style={styles.section}>
        <Header title="Detail Sesi" description="Informasi Sesi" />
        {/* <SectionHeader title="Informasi Sesi" /> */}
        <Card interactive={false}>
          <CardContent>
            <View style={styles.detailGrid}>
              <View style={styles.infoRow}>
                <Text variant="caption" tone="muted">
                  Mata Kuliah
                </Text>
                <Text variant="captionStrong">{session.courseName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="caption" tone="muted">
                  Kelas
                </Text>
                <Text variant="captionStrong">{session.groupName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="caption" tone="muted">
                  Waktu
                </Text>
                <Text variant="captionStrong">
                  {formatSessionDate(session.startsAt)} ·{' '}
                  {formatTimeRange(session.startsAt, session.endsAt)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="caption" tone="muted">
                  Laboratorium
                </Text>
                <Text variant="captionStrong">
                  {session.lab ?? 'Tidak ditentukan'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="caption" tone="muted">
                  Status
                </Text>
                <Text
                  variant="captionStrong"
                  tone={isOpen ? 'violet' : 'muted'}
                >
                  {STATUS_LABEL[session.status] ?? session.status}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {isAlreadyCheckedIn ? (
        <Banner
          tone="success"
          title="Presensi Tercatat"
          message={
            attendance?.checkedInAt
              ? `Anda sudah hadir pada ${formatClock(attendance.checkedInAt)}.`
              : 'Kehadiran Anda sudah tercatat.'
          }
        />
      ) : null}

      {leaveApproved && !isAlreadyCheckedIn ? (
        <Banner
          tone="warning"
          title="Izin sudah disetujui"
          message="Presensi untuk sesi ini tidak diperlukan. Hubungi asisten bila ada perubahan status izin."
        />
      ) : null}

      <View style={styles.actions}>
        {!isAlreadyCheckedIn ? (
          <Button
            label={
              leaveApproved
                ? 'Izin Disetujui'
                : isOpen
                  ? 'Scan QR Presensi'
                  : `Sesi ${STATUS_LABEL[session.status] ?? session.status}`
            }
            variant="primary"
            disabled={!isOpen || leaveApproved}
            onPress={() => navigation.navigate('BarcodeScan')}
          />
        ) : null}
        <Button
          label={
            isAlreadyCheckedIn
              ? 'Sudah Hadir, Tidak Bisa Izin'
              : leave && leave.status !== 'rejected'
                ? 'Izin Sudah Diajukan'
                : 'Ajukan Izin Ketidakhadiran'
          }
          variant="outline"
          disabled={!canLeave}
          onPress={() =>
            navigation.navigate('StudentLeaveRequestForm', { sessionId })
          }
        />
      </View>
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
    gap: spacing.sm,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
});
