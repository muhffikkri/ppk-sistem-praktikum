import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';

import type { RootStackParamList } from '../../app/navigation';
import { colors } from '../../theme/tokens';
import {
  Avatar,
  EmptyState,
  ErrorState,
  Header,
  IconButton,
  LoadingState,
  Screen,
  ScreenList,
  SectionHeader,
  SegmentedControl,
  type AvatarTone,
  type SegmentedOption,
} from '../../shared/ui';
import { AttendanceRecordCard } from '../attendance/AttendanceRecordCard';
import { AttendanceSummary } from '../attendance/AttendanceSummary';
import {
  isCurrentMonth,
  punctualityCounts,
  punctualityOf,
} from '../attendance/punctuality';
import { useAssistantSessionsViewModel } from '../../state';
import { RootTopBar } from '../shell/RootTopBar';
import { formatClock, formatSessionDate } from './formatters';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'AssistantAllAttendance'
>;
type Filter = 'all' | 'onTime' | 'late' | 'month';

const FILTERS: SegmentedOption<Filter>[] = [
  { value: 'all', label: 'Semua' },
  { value: 'onTime', label: 'Tepat waktu' },
  { value: 'late', label: 'Terlambat' },
  { value: 'month', label: 'Bulan ini' },
];

export function AssistantAllAttendanceScreen({ navigation }: Props) {
  const { sessions, getAttendanceForSession, loading, error, retry } =
    useAssistantSessionsViewModel();
  const [filter, setFilter] = useState<Filter>('all');
  const [newestFirst, setNewestFirst] = useState(true);

  if (loading) {
    return (
      <Screen>
        <RootTopBar />
        <LoadingState label="Memuat rekap presensi…" />
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

  // Semua catatan presensi dari setiap sesi, dengan sesi yang bersangkutan.
  const records = sessions.flatMap((session) =>
    getAttendanceForSession(session.id).map((record) => ({
      ...record,
      session,
    })),
  );
  const counts = punctualityCounts(records, (record) => record.session);
  const total = records.length;
  const attendedSessions = new Set(records.map((record) => record.sessionId))
    .size;
  const monthCount = records.filter((record) =>
    isCurrentMonth(record.checkedInAt),
  ).length;

  const sorted = [...records].sort((a, b) => {
    const diff = Date.parse(b.checkedInAt) - Date.parse(a.checkedInAt);
    return newestFirst ? diff : -diff;
  });

  const options: SegmentedOption<Filter>[] = FILTERS.map((option) => ({
    ...option,
    label:
      option.value === 'all'
        ? `Semua (${total})`
        : option.value === 'onTime'
          ? `Tepat waktu (${counts.onTime})`
          : option.value === 'late'
            ? `Terlambat (${counts.late})`
            : `Bulan ini (${monthCount})`,
  }));

  const visible = sorted.filter((record) => {
    if (filter === 'all') return true;
    if (filter === 'month') return isCurrentMonth(record.checkedInAt);
    return punctualityOf(record, record.session) === filter;
  });

  return (
    <ScreenList
      data={visible}
      keyExtractor={(record) => record.id}
      header={
        <>
          <RootTopBar />
          <Header
            eyebrow="LabPresensi · Asprak"
            title="Rekap"
            accent="presensi"
            description="Semua catatan hadir dari sesi Anda"
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
                badge: `${total} catatan`,
                caption: 'Sesi praktikum yang diampu',
              },
              {
                key: 'records',
                label: 'Persentase',
                value:
                  sessions.length > 0
                    ? `${Math.round((attendedSessions / sessions.length) * 100)}%`
                    : '–',
                caption: 'Sesi dengan catatan presensi',
                captionTone: 'violet',
                dotColor: colors.violet,
              },
            ]}
            breakdown={[
              {
                key: 'onTime',
                label: 'Tepat waktu',
                value: counts.onTime,
                dotColor: colors.success,
              },
              {
                key: 'late',
                label: 'Terlambat',
                value: counts.late,
                dotColor: colors.pink,
              },
              {
                key: 'unknown',
                label: 'Tanpa jadwal',
                value: counts.unknown,
                dotColor: colors.inkSubtle,
              },
            ]}
          />
          <SegmentedControl
            options={options}
            value={filter}
            onChange={setFilter}
            accessibilityLabel="Filter catatan presensi"
            scrollable
          />
        </>
      }
      sectionHeader={
        <SectionHeader
          title="Terbaru"
          actionLabel={`Urutkan: ${newestFirst ? 'Terbaru' : 'Terlama'}`}
          onAction={() => setNewestFirst((value) => !value)}
        />
      }
      empty={
        <EmptyState
          icon="checkmark-done-outline"
          title="Belum ada presensi"
          description="Catatan kehadiran akan muncul setelah praktikan presensi."
        />
      }
      renderItem={({ item: record }) => {
        const punctual = punctualityOf(record, record.session);
        const avatarTone: AvatarTone =
          punctual === 'onTime'
            ? 'lime'
            : punctual === 'late'
              ? 'pink'
              : 'lavender';
        return (
          <AttendanceRecordCard
            leading={<Avatar name={record.studentName} tone={avatarTone} />}
            title={record.studentName}
            meta={`${record.session.courseName} · ${formatSessionDate(record.session.startsAt)}`}
            detail={record.session.lab ?? record.session.groupName}
            detailIcon="location-outline"
            status={{
              label:
                punctual === 'late'
                  ? 'Terlambat'
                  : punctual === 'onTime'
                    ? 'Tepat waktu'
                    : 'Tanpa jadwal',
              tone:
                punctual === 'late'
                  ? 'pink'
                  : punctual === 'onTime'
                    ? 'success'
                    : 'neutral',
            }}
            time={formatClock(record.checkedInAt)}
            timeLabel="Hadir"
            onPress={() =>
              navigation.navigate('AssistantAttendanceRoster', {
                sessionId: record.sessionId,
              })
            }
          />
        );
      }}
    />
  );
}
