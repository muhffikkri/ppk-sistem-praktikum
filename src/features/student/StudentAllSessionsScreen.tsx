import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';

import type { RootStackParamList } from '../../app/navigation';
import type { Session } from '../../domain/types';
import {
  EmptyState,
  ErrorState,
  ListRow,
  Screen,
  ScreenList,
  SegmentedControl,
  SkeletonList,
  StatusBadge,
  BackButton,
  BadgeTone,
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
  { value: 'cancelled', label: 'Dibatalkan' },
];

const STATUS_LABEL: Record<Session['status'], string> = {
  open: 'Terbuka',
  scheduled: 'Terjadwal',
  closed: 'Tertutup',
  cancelled: 'Dibatalkan',
};

const STATUS_TONE: Record<Session['status'], BadgeTone> = {
  open: 'violet',
  scheduled: 'lime',
  closed: 'neutral',
  cancelled: 'danger',
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
        <BackButton onPress={() => navigation.goBack()} />
        <SkeletonList variant="row" count={5} label="Memuat sesi…" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <BackButton onPress={() => navigation.goBack()} />
        <ErrorState title="Gagal memuat sesi" message={error} onRetry={retry} />
      </Screen>
    );
  }

  return (
    <ScreenList
      data={visible}
      keyExtractor={(session) => session.id}
      header={
        <>
          <BackButton onPress={() => navigation.goBack()} />

          <SegmentedControl
            options={FILTER_OPTIONS}
            value={filter}
            onChange={setFilter}
            accessibilityLabel="Filter status sesi"
          />
        </>
      }
      empty={
        <EmptyState
          icon="calendar-outline"
          title="Tidak ada sesi"
          description={
            filter === 'all'
              ? 'Jadwal praktikum akan muncul di sini setelah asisten menambahkanmu ke kelas.'
              : 'Tidak ada sesi dengan status ini.'
          }
        />
      }
      renderItem={({ item: session }) => (
        <ListRow
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
      )}
    />
  );
}
