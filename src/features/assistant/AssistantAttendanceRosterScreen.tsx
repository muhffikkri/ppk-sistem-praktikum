import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Avatar,
  EmptyState,
  Header,
  ListRow,
  Screen,
  ScreenList,
  SectionHeader,
  spacing,
  StatusBadge,
  Text,
  TopBar,
} from '../../shared/ui';
import { useAssistantSessionsViewModel } from '../../state';
import {
  sessionStatusLabel,
  sessionStatusTone,
} from './components/AssistantSessionCard';
import { formatClock, formatSessionDate, formatTimeRange } from './formatters';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'AssistantAttendanceRoster'
>;

export function AssistantAttendanceRosterScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const { getSessionById, getAttendanceForSession } =
    useAssistantSessionsViewModel();

  const session = getSessionById(sessionId);
  const attendees = [...getAttendanceForSession(sessionId)].sort(
    (a, b) =>
      new Date(a.checkedInAt).getTime() - new Date(b.checkedInAt).getTime(),
  );

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
      data={attendees}
      keyExtractor={(record) => record.id}
      header={
        <>
          <TopBar onBack={() => navigation.goBack()} />
          <Header
            title={session.courseName}
            description={`${session.groupName} · ${formatSessionDate(session.startsAt)} · ${formatTimeRange(session.startsAt, session.endsAt)}`}
          />
          <View style={styles.summary}>
            <StatusBadge
              label={sessionStatusLabel[session.status]}
              tone={sessionStatusTone[session.status]}
            />
            <Text variant="bodyStrong">{attendees.length} praktikan hadir</Text>
          </View>
        </>
      }
      sectionHeader={<SectionHeader title="Daftar hadir" />}
      empty={
        <EmptyState
          icon="people-outline"
          title="Belum ada presensi"
          description="Praktikan yang presensi akan muncul di sini."
        />
      }
      renderItem={({ item: record }) => (
        <ListRow
          title={record.studentName}
          meta={`NIM ${record.studentId}`}
          leading={<Avatar name={record.studentName} tone="lime" />}
          trailing={
            <Text variant="bodyStrong">{formatClock(record.checkedInAt)}</Text>
          }
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
