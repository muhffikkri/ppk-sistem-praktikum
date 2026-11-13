import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import type { Session } from '../../domain/types';
import {
  EmptyState,
  ErrorState,
  Header,
  ListRow,
  LoadingState,
  Screen,
  SegmentedControl,
  spacing,
  StatusBadge,
  TopBar,
  type BadgeTone,
} from '../../shared/ui';
import { useStudentAttendanceViewModel } from '../../state';
import { formatSessionDate, formatTimeRange } from './formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentAllSessions'>;

type StatusFilter = 'all' | Session['status'];

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'open', label: 'Terbuka' },
  { value: 'scheduled', label: 'Terjadwal' },
  { value: 'closed', label: 'Tertutup' },
];

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

export function StudentAllSessionsScreen({ navigation }: Props) {
  const { sessions, loading, error, retry } = useStudentAttendanceViewModel();
  const [filter, setFilter] = useState<StatusFilter>('all');

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
  const visible =
    filter === 'all'
      ? sorted
      : sorted.filter((session) => session.status === filter);

  if (loading) {
    return (
      <Screen>
        <TopBar title="Semua sesi" onBack={() => navigation.goBack()} />
        <LoadingState label="Memuat sesi…" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <TopBar title="Semua sesi" onBack={() => navigation.goBack()} />
        <ErrorState title="Gagal memuat sesi" message={error} onRetry={retry} />
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Semua sesi" onBack={() => navigation.goBack()} />
      <Header
        title="Semua sesi"
        description={`${sorted.length} sesi praktikum terdaftar`}
      />

      <SegmentedControl
        options={FILTER_OPTIONS}
        value={filter}
        onChange={setFilter}
        accessibilityLabel="Filter status sesi"
      />

      {visible.length === 0 ? (
        <EmptyState
          title="Tidak ada sesi"
          description={
            filter === 'all'
              ? 'Jadwal praktikum akan muncul di sini setelah asisten menambahkanmu ke kelas.'
              : 'Tidak ada sesi dengan status ini.'
          }
        />
      ) : (
        <View style={styles.list}>
          {visible.map((session) => (
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
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
});
