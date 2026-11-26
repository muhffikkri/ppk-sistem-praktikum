import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import type {
  SessionRosterEntry,
  StudentAttendanceStatus,
} from '../../domain/sessionRecapRules';
import {
  Avatar,
  Banner,
  type AvatarTone,
  EmptyState,
  Header,
  ListRow,
  Screen,
  ScreenList,
  SectionHeader,
  SegmentedControl,
  type SegmentedOption,
  spacing,
  StatusBadge,
  type BadgeTone,
  Text,
  TopBar,
} from '../../shared/ui';
import { useAssistantSessionsViewModel } from '../../state';
import {
  sessionStatusLabel,
  sessionStatusTone,
} from './components/AssistantSessionCard';
import { formatClock, formatSessionDate, formatTimeRange } from './formatters';
import { useSessionRosterRecap } from './useAssistantSessionDetail';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'AssistantAttendanceRoster'
>;

type FilterType = 'all' | StudentAttendanceStatus;

type StatusPresentation = {
  badgeTone: BadgeTone;
  badgeLabel: string;
  avatarTone: AvatarTone;
};

const STATUS_PRESENTATION: Record<StudentAttendanceStatus, StatusPresentation> =
  {
    present: { badgeTone: 'lime', badgeLabel: 'Hadir', avatarTone: 'lime' },
    excused: { badgeTone: 'lavender', badgeLabel: 'Izin', avatarTone: 'pink' },
    absent: {
      badgeTone: 'neutral',
      badgeLabel: 'Belum hadir',
      avatarTone: 'lavender',
    },
  };

export function AssistantAttendanceRosterScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const { error } = useAssistantSessionsViewModel();
  const { session, recap } = useSessionRosterRecap(sessionId);

  const [filter, setFilter] = useState<FilterType>('all');

  const filterOptions = useMemo<SegmentedOption<FilterType>[]>(
    () => [
      { value: 'all', label: `Semua (${recap.summary.total})` },
      { value: 'present', label: `Hadir (${recap.summary.presentCount})` },
      { value: 'excused', label: `Izin (${recap.summary.excusedCount})` },
      { value: 'absent', label: `Belum (${recap.summary.absentCount})` },
    ],
    [recap.summary],
  );

  const displayedEntries = useMemo(() => {
    if (filter === 'all') return recap.entries;
    return recap.entries.filter((entry) => entry.status === filter);
  }, [recap.entries, filter]);

  if (!session) {
    return (
      <Screen withDock={false}>
        <TopBar onBack={() => navigation.goBack()} />
        <EmptyState
          icon="alert-circle-outline"
          title="Sesi tidak ditemukan"
          description="Rekap tidak dapat ditampilkan karena sesi tidak tersedia."
        />
      </Screen>
    );
  }

  return (
    <ScreenList
      withDock={false}
      data={displayedEntries}
      keyExtractor={(record: SessionRosterEntry) => record.studentId}
      header={
        <>
          <TopBar onBack={() => navigation.goBack()} />
          <Header
            title={session.courseName}
            description={`${session.groupName} · ${formatSessionDate(session.startsAt)} · ${formatTimeRange(session.startsAt, session.endsAt)}`}
          />
          {error ? (
            <Banner
              tone="danger"
              title="Gagal memuat rekap kehadiran"
              message={error}
            />
          ) : null}
          <View style={styles.summary}>
            <StatusBadge
              label={sessionStatusLabel[session.status]}
              tone={sessionStatusTone[session.status]}
            />
            <Text variant="bodyStrong">
              {recap.summary.presentCount} hadir · {recap.summary.excusedCount}{' '}
              izin · {recap.summary.absentCount} belum hadir
            </Text>
          </View>
          <View style={styles.filterBlock}>
            <SegmentedControl
              options={filterOptions}
              value={filter}
              onChange={setFilter}
              accessibilityLabel="Filter kehadiran"
            />
          </View>
        </>
      }
      sectionHeader={<SectionHeader title="Daftar kehadiran" />}
      empty={
        <EmptyState
          icon="people-outline"
          title="Tidak ada data"
          description="Tidak ada peserta pada kategori kehadiran ini."
        />
      }
      renderItem={({ item: record }: { item: SessionRosterEntry }) => {
        const { badgeTone, badgeLabel, avatarTone } =
          STATUS_PRESENTATION[record.status];

        const meta =
          record.status === 'excused'
            ? `NIM ${record.studentId} · ${record.leaveReason ?? 'Izin disetujui'}`
            : `NIM ${record.studentId}`;

        return (
          <ListRow
            title={record.studentName}
            meta={meta}
            leading={<Avatar name={record.studentName} tone={avatarTone} />}
            trailing={
              <View style={styles.trailing}>
                <StatusBadge label={badgeLabel} tone={badgeTone} />
                {record.checkedInAt ? (
                  <Text variant="caption">
                    {formatClock(record.checkedInAt)}
                  </Text>
                ) : null}
              </View>
            }
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  filterBlock: {
    marginTop: spacing.md,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
});
