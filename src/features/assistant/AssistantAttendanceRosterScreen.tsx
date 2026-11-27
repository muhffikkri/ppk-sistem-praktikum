import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';

import type { RootStackParamList } from '../../app/navigation';
import {
  studentIdentityMeta,
  type SessionRosterEntry,
  type StudentAttendanceStatus,
} from '../../domain/sessionRecapRules';
import {
  Avatar,
  Banner,
  AvatarTone,
  EmptyState,
  Screen,
  ScreenList,
  SectionHeader,
  SegmentedControl,
  BackButton,
  BadgeTone,
  SegmentedOption,
  Header,
} from '../../shared/ui';
import { AttendanceRecordCard } from '../attendance/AttendanceRecordCard';
import { AttendanceSummary } from '../attendance/AttendanceSummary';
import { useAssistantSessionsViewModel } from '../../state';
import { formatClock } from './formatters';
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

const LEAVE_STATUS_LABEL: Record<
  NonNullable<SessionRosterEntry['leaveStatus']>,
  string
> = {
  pending: 'Izin menunggu',
  approved: 'Izin disetujui',
  rejected: 'Izin ditolak',
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
  const [newestFirst, setNewestFirst] = useState(true);

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
    const filtered =
      filter === 'all'
        ? recap.entries
        : recap.entries.filter((entry) => entry.status === filter);
    const timeOf = (entry: SessionRosterEntry) =>
      entry.checkedInAt ? Date.parse(entry.checkedInAt) : 0;
    return [...filtered].sort((a, b) =>
      newestFirst ? timeOf(b) - timeOf(a) : timeOf(a) - timeOf(b),
    );
  }, [recap.entries, filter, newestFirst]);

  if (!session) {
    return (
      <Screen withDock={false}>
        <BackButton onPress={() => navigation.goBack()} />
        <EmptyState
          icon="alert-circle-outline"
          title="Sesi tidak ditemukan"
          description="Rekap tidak dapat ditampilkan karena sesi tidak tersedia."
        />
      </Screen>
    );
  }

  const {
    total,
    presentCount,
    ontimeCount,
    lateCount,
    excusedCount,
    absentCount,
  } = recap.summary;
  const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  return (
    <ScreenList
      withDock={false}
      data={displayedEntries}
      keyExtractor={(record: SessionRosterEntry) => record.studentId}
      header={
        <>
          <BackButton onPress={() => navigation.goBack()} />

          <Header
            title="Rekapitulasi Kehadiran"
            description="Daftar Kehadiran"
          />

          {error ? (
            <Banner
              tone="danger"
              title="Gagal memuat rekap kehadiran"
              message={error}
            />
          ) : null}
          <AttendanceSummary
            metrics={[
              {
                key: 'total',
                label: 'Total peserta',
                value: total,
                badge: `${presentCount} hadir`,
                badgeTone: 'success',
                caption: 'Peserta terdaftar pada sesi',
              },
              {
                key: 'rate',
                label: 'Kehadiran',
                value: `${rate}%`,
                caption: 'Hadir dari seluruh peserta',
                captionTone: 'violet',
              },
            ]}
            breakdown={[
              {
                key: 'ontime',
                label: 'Tepat waktu',
                value: ontimeCount,
              },
              {
                key: 'late',
                label: 'Terlambat',
                value: lateCount,
              },
              {
                key: 'present',
                label: 'Hadir',
                value: presentCount,
              },
              {
                key: 'excused',
                label: 'Izin',
                value: excusedCount,
              },
              {
                key: 'absent',
                label: 'Belum hadir',
                value: absentCount,
              },
            ]}
          />
          <SegmentedControl
            options={filterOptions}
            value={filter}
            onChange={setFilter}
            accessibilityLabel="Filter kehadiran"
            scrollable
          />
        </>
      }
      sectionHeader={
        <SectionHeader
          title="Daftar kehadiran"
          sortLabel={`Urutkan: ${newestFirst ? 'Terbaru' : 'Terlama'}`}
          onSort={() => setNewestFirst((value) => !value)}
        />
      }
      empty={
        <EmptyState
          icon="people-outline"
          title="Tidak ada data"
          description="Tidak ada peserta pada kategori kehadiran ini."
        />
      }
      renderItem={({ item: record }: { item: SessionRosterEntry }) => {
        const presentation = STATUS_PRESENTATION[record.status];
        const isLate =
          record.status === 'present' && record.punctuality === 'late';
        const badgeTone: BadgeTone = isLate ? 'pink' : presentation.badgeTone;
        const avatarTone: AvatarTone = isLate
          ? 'pink'
          : presentation.avatarTone;
        const badgeLabel = isLate
          ? record.minutesLate
            ? `Terlambat (${record.minutesLate}m)`
            : 'Terlambat'
          : record.status === 'present' && record.punctuality === 'ontime'
            ? 'Tepat waktu'
            : presentation.badgeLabel;

        const identity = studentIdentityMeta(record);
        const leaveMeta = record.leaveStatus
          ? [LEAVE_STATUS_LABEL[record.leaveStatus], record.leaveReason]
              .filter(Boolean)
              .join(' · ')
          : '';
        const meta = [identity, leaveMeta].filter(Boolean).join(' · ');

        return (
          <AttendanceRecordCard
            leading={<Avatar name={record.studentName} tone={avatarTone} />}
            title={record.studentName}
            meta={meta || 'Tanpa keterangan identitas'}
            status={{ label: badgeLabel, tone: badgeTone }}
            time={record.checkedInAt ? formatClock(record.checkedInAt) : '–'}
            timeLabel={record.checkedInAt ? 'Hadir' : 'Belum'}
            timeTone={record.checkedInAt ? 'ink' : 'muted'}
          />
        );
      }}
    />
  );
}
