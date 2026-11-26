import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../app/navigation';
import {
  Button,
  EmptyState,
  ErrorState,
  Header,
  ListRow,
  LoadingState,
  Screen,
  ScreenList,
  SectionHeader,
  StatCard,
  StatRow,
  Text,
} from '../../shared/ui';
import { useStudentAttendanceViewModel } from '../../state';
import { formatClock, formatSessionDate, formatTimeRange } from './formatters';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'StudentAttendanceHistory'
>;

export function StudentAttendanceHistoryScreen({ navigation }: Props) {
  const { attendanceHistory, sessions, loading, error, retry, getSessionById } =
    useStudentAttendanceViewModel();

  const sorted = [...attendanceHistory].sort(
    (a, b) =>
      new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime(),
  );

  const total = sorted.length;
  const rate =
    sessions.length > 0 ? Math.round((total / sessions.length) * 100) : 0;

  if (loading) {
    return (
      <Screen>
        <LoadingState label="Memuat riwayat…" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState
          title="Gagal memuat riwayat"
          message={error}
          onRetry={retry}
        />
      </Screen>
    );
  }

  return (
    <ScreenList
      data={sorted}
      keyExtractor={(record) => record.id}
      header={
        <>
          <Header
            title="Riwayat kehadiran"
            description={`${total} presensi tercatat`}
          />
          <StatRow>
            <StatCard variant="panel" value={total} label="Total presensi" />
            <StatCard
              variant="panel"
              value={sessions.length > 0 ? `${rate}%` : '–'}
              label="Tingkat kehadiran"
            />
          </StatRow>
        </>
      }
      sectionHeader={<SectionHeader title="Semua presensi" />}
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
        return (
          <ListRow
            title={session?.courseName ?? record.sessionId}
            meta={
              session
                ? `${formatSessionDate(session.startsAt)} · ${formatTimeRange(session.startsAt, session.endsAt)}`
                : 'Sesi tidak diketahui'
            }
            trailing={
              <Text variant="bodyStrong">
                {formatClock(record.checkedInAt)}
              </Text>
            }
          />
        );
      }}
    />
  );
}
