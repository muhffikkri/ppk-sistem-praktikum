import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Banner,
  Button,
  Card,
  CardContent,
  EmptyState,
  Header,
  LoadingState,
  Screen,
  SectionHeader,
  spacing,
  Text,
  TopBar,
} from '../../shared/ui';
import { useStudentAttendanceViewModel } from '../../state/StudentAttendanceContext';
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

  const session = getSessionById(sessionId);
  const attendance = getAttendanceForSession(sessionId);

  if (loading && !session) {
    return (
      <Screen withDock={false}>
        <TopBar onBack={() => navigation.goBack()} />
        <LoadingState label="Memuat detail sesi…" />
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

  const isAlreadyCheckedIn = attendance !== undefined;
  const isOpen = session.status === 'open';

  return (
    <Screen withDock={false}>
      <TopBar onBack={() => navigation.goBack()} />
      <Header
        title="Detail Sesi"
        description={`${session.courseName} — ${session.groupName}`}
      />

      <View style={styles.section}>
        <SectionHeader title="Informasi Sesi" />
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

      <View style={styles.actions}>
        {!isAlreadyCheckedIn ? (
          <Button
            label={
              isOpen
                ? 'Scan QR Presensi'
                : `Sesi ${STATUS_LABEL[session.status] ?? session.status}`
            }
            variant="primary"
            disabled={!isOpen}
            onPress={() => navigation.navigate('BarcodeScan')}
          />
        ) : null}
        <Button
          label="Ajukan Izin Ketidakhadiran"
          variant="outline"
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
