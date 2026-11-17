import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import type { Session } from '../../domain/types';
import {
  Button,
  EmptyState,
  ErrorState,
  Header,
  ListRow,
  LoadingState,
  Screen,
  SectionHeader,
  spacing,
  StatusBadge,
  type BadgeTone,
} from '../../shared/ui';
import { useStudentAttendanceViewModel } from '../../state';
import { formatSessionDate, formatTimeRange } from './formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentSchedule'>;

const STATUS_ORDER: Session['status'][] = ['open', 'scheduled', 'closed'];

const STATUS_LABEL: Record<Session['status'], string> = {
  open: 'Terbuka',
  scheduled: 'Terjadwal',
  closed: 'Tertutup',
};

const STATUS_TONE: Record<Session['status'], BadgeTone> = {
  open: 'violet',
  scheduled: 'lavender',
  closed: 'neutral',
};

export function StudentScheduleScreen({ navigation }: Props) {
  const { sessions, loading, error, retry } = useStudentAttendanceViewModel();

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  if (loading) {
    return (
      <Screen>
        <LoadingState label="Memuat jadwal…" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState
          title="Gagal memuat jadwal"
          message={error}
          onRetry={retry}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title="Jadwal"
        description={`${sorted.length} sesi praktikum terdaftar`}
      />

      <Button
        label="Lihat kalender"
        variant="outline"
        icon="calendar-outline"
        onPress={() => navigation.navigate('Calendar')}
        accessibilityHint="Membuka kalender semua jadwal"
      />

      {sorted.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="Belum ada jadwal"
          description="Jadwal praktikum akan muncul di sini setelah asisten menambahkanmu ke kelas."
        />
      ) : (
        STATUS_ORDER.map((status) => {
          const group = sorted.filter((session) => session.status === status);
          if (group.length === 0) return null;
          return (
            <View key={status} style={styles.section}>
              <SectionHeader
                title={`${STATUS_LABEL[status]} (${group.length})`}
              />
              <View style={styles.list}>
                {group.map((session) => (
                  <ListRow
                    key={session.id}
                    title={session.courseName}
                    meta={`${formatSessionDate(session.startsAt)} · ${formatTimeRange(session.startsAt, session.endsAt)}`}
                    accessibilityHint="Membuka detail sesi"
                    onPress={() =>
                      navigation.navigate('StudentSessionDetail', {
                        sessionId: session.id,
                      })
                    }
                    trailing={
                      <StatusBadge
                        label={STATUS_LABEL[session.status]}
                        tone={STATUS_TONE[session.status]}
                      />
                    }
                  />
                ))}
              </View>
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  list: { gap: spacing.sm },
});
