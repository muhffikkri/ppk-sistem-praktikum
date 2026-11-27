import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';

import type { RootStackParamList } from '../../app/navigation';
import {
  EmptyState,
  ErrorState,
  Header,
  IconButton,
  Screen,
  ScreenList,
  SkeletonList,
  SectionHeader,
  SegmentedControl,
  type SegmentedOption,
} from '../../shared/ui';
import { SessionAttendancePreviewCard } from '../attendance/SessionAttendancePreviewCard';
import { AttendanceSummary } from '../attendance/AttendanceSummary';
import {
  isCurrentMonth,
  isCurrentWeek,
  isToday,
} from '../attendance/punctuality';
import {
  buildSessionAttendanceGroup,
  type SessionAttendanceGroup,
} from '../attendance/sessionAttendanceGroups';
import { useAssistantSessionsViewModel } from '../../state';
import { RootTopBar } from '../shell/RootTopBar';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'AssistantAllAttendance'
>;
type Filter = 'all' | 'today' | 'week' | 'month';

const FILTERS: SegmentedOption<Filter>[] = [
  { value: 'all', label: 'Semua' },
  { value: 'today', label: 'Hari ini' },
  { value: 'week', label: 'Minggu ini' },
  { value: 'month', label: 'Bulan ini' },
];

const matchesFilter = (
  group: SessionAttendanceGroup,
  filter: Filter,
): boolean => {
  if (filter === 'all') return true;
  if (filter === 'today') return isToday(group.session.startsAt);
  if (filter === 'week') return isCurrentWeek(group.session.startsAt);
  return isCurrentMonth(group.session.startsAt);
};

export function AssistantAllAttendanceScreen({ navigation }: Props) {
  const { sessions, getAttendanceForSession, loading, error, retry } =
    useAssistantSessionsViewModel();
  const [filter, setFilter] = useState<Filter>('all');
  const [newestFirst, setNewestFirst] = useState(true);

  if (loading) {
    return (
      <Screen>
        <RootTopBar />
        <SkeletonList variant="card" count={4} label="Memuat rekap presensi…" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <RootTopBar />
        <ErrorState
          title="Gagal memuat rekap presensi"
          message={error}
          onRetry={retry}
        />
      </Screen>
    );
  }

  // Satu kartu per sesi: rekap lengkap dibuka saat kartu ditekan.
  const groups = sessions
    .map((session) =>
      buildSessionAttendanceGroup(session, getAttendanceForSession(session.id)),
    )
    .filter((group) => group.records.length > 0);

  const sorted = [...groups].sort((a, b) => {
    const diff =
      Date.parse(b.session.startsAt) - Date.parse(a.session.startsAt);
    return newestFirst ? diff : -diff;
  });
  const visible = sorted.filter((group) => matchesFilter(group, filter));

  const options = FILTERS.map((option) => ({
    ...option,
    label: `${option.label} (${groups.filter((group) => matchesFilter(group, option.value)).length})`,
  }));

  return (
    <ScreenList
      data={visible}
      keyExtractor={(group) => group.session.id}
      header={
        <>
          <RootTopBar />
          <Header
            title="Rekap"
            accent="presensi"
            description="Riwayat sesi dan kehadiran praktikan"
            trailing={
              <IconButton
                icon="calendar-outline"
                variant="ghost"
                accessibilityLabel="Buka kalender"
                onPress={() => navigation.navigate('Calendar')}
              />
            }
          />
          <AttendanceSummary
            metrics={[
              {
                key: 'sessions',
                label: 'Total sesi',
                value: sessions.length,
                caption: 'Sesi praktikum yang diampu',
              },
              {
                key: 'records',
                label: 'Persentase',
                value:
                  sessions.length > 0
                    ? `${Math.round((groups.length / sessions.length) * 100)}%`
                    : '-',
                caption: 'Sesi dengan catatan presensi',
                captionTone: 'violet',
              },
            ]}
          />
          <SegmentedControl
            options={options}
            value={filter}
            onChange={setFilter}
            accessibilityLabel="Filter riwayat presensi"
            scrollable
          />
        </>
      }
      sectionHeader={
        <SectionHeader
          title="Riwayat sesi"
          sortLabel={`Urutkan: ${newestFirst ? 'Terbaru' : 'Terlama'}`}
          sortDirection={newestFirst ? 'desc' : 'asc'}
          onSort={() => setNewestFirst((value) => !value)}
        />
      }
      empty={
        <EmptyState
          icon="checkmark-done-outline"
          title="Belum ada presensi"
          description="Catatan kehadiran akan muncul setelah praktikan presensi."
        />
      }
      renderItem={({ item: group }) => (
        <SessionAttendancePreviewCard
          session={group.session}
          presentCount={group.records.length}
          onTimeCount={group.onTime}
          lateCount={group.late}
          attendees={group.preview}
          onPress={() =>
            navigation.navigate('AssistantAttendanceRoster', {
              sessionId: group.session.id,
            })
          }
        />
      )}
    />
  );
}
