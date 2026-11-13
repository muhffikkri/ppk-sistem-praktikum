import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Button,
  EmptyState,
  ErrorState,
  Header,
  ListRow,
  LoadingState,
  Screen,
  spacing,
  StatCard,
  StatRow,
  Text,
  TopBar,
} from '../../shared/ui';
import { useStudentAttendanceViewModel } from '../../state';
import { formatClock, formatSessionDate } from './formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentAllAttendance'>;

export function StudentAllAttendanceScreen({ navigation }: Props) {
  const { attendanceHistory, sessions, loading, error, retry } =
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
        <TopBar title="Semua presensi" onBack={() => navigation.goBack()} />
        <LoadingState label="Memuat presensi…" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <TopBar title="Semua presensi" onBack={() => navigation.goBack()} />
        <ErrorState
          title="Gagal memuat presensi"
          message={error}
          onRetry={retry}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar onBack={() => navigation.goBack()} />
      <Header
        title="Semua presensi"
        description="Daftar presensi yang kamu catat"
      />

      <StatRow>
        <StatCard variant="panel" value={total} label="Total presensi" />
        <StatCard
          variant="panel"
          value={`${rate}%`}
          label="Tingkat kehadiran"
        />
        <StatCard variant="panel" value={sessions.length} label="Total sesi" />
      </StatRow>

      {sorted.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="Belum ada riwayat presensi"
          description="Presensi yang kamu lakukan akan muncul di sini."
          action={
            <Button
              label="Buka semua sesi"
              variant="outline"
              onPress={() => navigation.navigate('StudentAllSessions')}
            />
          }
        />
      ) : (
        <View style={styles.list}>
          {sorted.map((record) => {
            const session = sessions.find((s) => s.id === record.sessionId);
            return (
              <ListRow
                key={record.id}
                title={session?.courseName ?? record.sessionId}
                meta={
                  session
                    ? formatSessionDate(session.startsAt)
                    : 'Sesi tidak diketahui'
                }
                accessibilityHint="Membuka detail sesi"
                onPress={() =>
                  navigation.navigate('StudentSessionDetail', {
                    sessionId: record.sessionId,
                  })
                }
                trailing={
                  <Text variant="bodyStrong">
                    {formatClock(record.checkedInAt)}
                  </Text>
                }
              />
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
});
