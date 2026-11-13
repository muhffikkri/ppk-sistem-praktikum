import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Avatar,
  EmptyState,
  Header,
  ListRow,
  Screen,
  SectionHeader,
  spacing,
  StatCard,
  StatRow,
  Text,
} from '../../shared/ui';
import { useAssistantSessionsViewModel } from '../../state';
import { formatClock, formatSessionDate } from './formatters';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'AssistantAllAttendance'
>;

export function AssistantAllAttendanceScreen({ navigation }: Props) {
  const { sessions, getAttendanceForSession } = useAssistantSessionsViewModel();

  // Semua catatan presensi dari setiap sesi, terbaru dulu.
  const sorted = sessions
    .flatMap((s) =>
      getAttendanceForSession(s.id).map((r) => ({ ...r, session: s })),
    )
    .sort(
      (a, b) =>
        new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime(),
    );

  return (
    <Screen>
      <Header
        title="Rekap"
        accent="presensi"
        description="Semua catatan hadir dari sesi Anda"
      />

      <StatRow>
        <StatCard variant="panel" value={sessions.length} label="Sesi" />
        <StatCard variant="panel" value={sorted.length} label="Catatan hadir" />
      </StatRow>

      <View style={styles.section}>
        <SectionHeader title="Terbaru" />
        {sorted.length === 0 ? (
          <EmptyState
            icon="checkmark-done-outline"
            title="Belum ada presensi"
            description="Catatan kehadiran akan muncul setelah praktikan presensi."
          />
        ) : (
          sorted.map((record) => (
            <ListRow
              key={record.id}
              title={record.studentName}
              meta={`${record.session.courseName} · ${formatSessionDate(record.session.startsAt)}`}
              leading={<Avatar name={record.studentName} tone="lime" />}
              trailing={
                <Text variant="bodyStrong">
                  {formatClock(record.checkedInAt)}
                </Text>
              }
              onPress={() =>
                navigation.navigate('AssistantAttendanceRoster', {
                  sessionId: record.sessionId,
                })
              }
            />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
});
