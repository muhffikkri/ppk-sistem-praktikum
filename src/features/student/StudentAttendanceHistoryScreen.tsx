import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';

import type { RootStackParamList } from '../../app/navigation';
import {
  Button,
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
import { AttendanceRecordCard } from '../attendance/AttendanceRecordCard';
import { AttendanceSummary } from '../attendance/AttendanceSummary';
import {
  isCurrentMonth,
  punctualityCounts,
  punctualityOf,
} from '../attendance/punctuality';
import { useStudentAttendanceViewModel } from '../../state';
import { RootTopBar } from '../shell/RootTopBar';
import { formatClock, formatSessionDate, formatTimeRange } from './formatters';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'StudentAttendanceHistory'
>;
type Filter = 'all' | 'onTime' | 'late' | 'month';

const FILTERS: SegmentedOption<Filter>[] = [
  { value: 'all', label: 'Semua' },
  { value: 'onTime', label: 'Tepat waktu' },
  { value: 'late', label: 'Terlambat' },
  { value: 'month', label: 'Bulan ini' },
];

export function StudentAttendanceHistoryScreen({ navigation }: Props) {
  const { attendanceHistory, sessions, loading, error, retry, getSessionById } =
    useStudentAttendanceViewModel();
  const [filter, setFilter] = useState<Filter>('all');
  const [newestFirst, setNewestFirst] = useState(true);

  if (loading) {
    return (
      <Screen>
        <RootTopBar />
        <SkeletonList variant="row" count={5} label="Memuat riwayat…" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <RootTopBar />
        <ErrorState
          title="Gagal memuat riwayat"
          message={error}
          onRetry={retry}
        />
      </Screen>
    );
  }

  const counts = punctualityCounts(attendanceHistory, (record) =>
    getSessionById(record.sessionId),
  );
  const total = attendanceHistory.length;
  const rate =
    sessions.length > 0 ? Math.round((total / sessions.length) * 100) : 0;
  const monthCount = attendanceHistory.filter((record) =>
    isCurrentMonth(record.checkedInAt),
  ).length;

  const sorted = [...attendanceHistory].sort((a, b) => {
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
    return punctualityOf(record, getSessionById(record.sessionId)) === filter;
  });

  return (
    <ScreenList
      data={visible}
      keyExtractor={(record) => record.id}
      header={
        <>
          <RootTopBar />
          <Header
            title="Riwayat"
            accent="kehadiran"
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
                key: 'total',
                label: 'Total sesi',
                value: `${total} / ${sessions.length} sesi`,
                caption: 'Catatan presensi valid',
              },
              {
                key: 'rate',
                label: 'Persentase',
                value: sessions.length > 0 ? `${rate}%` : '–',
                caption:
                  sessions.length > 0
                    ? 'Dari seluruh sesi terdaftar'
                    : 'Belum ada sesi tercatat',
                captionTone: 'violet',
              },
            ]}
            breakdown={[
              {
                key: 'onTime',
                label: 'Tepat waktu',
                value: counts.onTime,
              },
              {
                key: 'late',
                label: 'Terlambat',
                value: counts.late,
              },
              {
                key: 'unknown',
                label: 'Tanpa jadwal',
                value: counts.unknown,
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
          title="Semua presensi"
          sortLabel={`Urutkan: ${newestFirst ? 'Terbaru' : 'Terlama'}`}
          onSort={() => setNewestFirst((value) => !value)}
        />
      }
      empty={
        <EmptyState
          icon="time-outline"
          title="Belum ada riwayat presensi"
          description="Presensi yang kamu lakukan akan muncul di sini."
          action={
            <Button
              label="Buka jadwal"
              variant="outline"
              onPress={() => navigation.navigate('StudentSchedule')}
            />
          }
        />
      }
      renderItem={({ item: record }) => {
        const session = getSessionById(record.sessionId);
        const punctual = punctualityOf(record, session);
        return (
          <AttendanceRecordCard
            title={session?.courseName ?? record.sessionId}
            meta={
              session
                ? `${formatSessionDate(session.startsAt)} · ${formatTimeRange(session.startsAt, session.endsAt)}`
                : 'Sesi tidak diketahui'
            }
            detail={session?.lab ?? session?.groupName}
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
              navigation.navigate('StudentSessionDetail', {
                sessionId: record.sessionId,
              })
            }
          />
        );
      }}
    />
  );
}
