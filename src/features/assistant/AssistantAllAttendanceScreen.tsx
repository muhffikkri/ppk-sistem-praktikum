import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../app/navigation';
import {
  Avatar,
  Banner,
  EmptyState,
  Header,
  ListRow,
  ScreenList,
  SectionHeader,
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
  const { sessions, getAttendanceForSession, error } =
    useAssistantSessionsViewModel();

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
    <ScreenList
      data={sorted}
      keyExtractor={(record) => record.id}
      header={
        <>
          <Header
            title="Rekap presensi"
            description="Semua catatan hadir dari sesi Anda"
          />
          {error ? (
            <Banner
              tone="danger"
              title="Gagal memuat rekap kehadiran"
              message={error}
            />
          ) : null}
          <StatRow>
            <StatCard variant="panel" value={sessions.length} label="Sesi" />
            <StatCard
              variant="panel"
              value={sorted.length}
              label="Catatan hadir"
            />
          </StatRow>
        </>
      }
      sectionHeader={<SectionHeader title="Terbaru" />}
      empty={
        <EmptyState
          icon="checkmark-done-outline"
          title="Belum ada presensi"
          description="Catatan kehadiran akan muncul setelah praktikan presensi."
        />
      }
      renderItem={({ item: record }) => (
        <ListRow
          title={record.studentName}
          meta={`${record.session.courseName} · ${formatSessionDate(record.session.startsAt)}`}
          leading={<Avatar name={record.studentName} tone="lime" />}
          trailing={
            <Text variant="bodyStrong">{formatClock(record.checkedInAt)}</Text>
          }
          onPress={() =>
            navigation.navigate('AssistantAttendanceRoster', {
              sessionId: record.sessionId,
            })
          }
        />
      )}
    />
  );
}
