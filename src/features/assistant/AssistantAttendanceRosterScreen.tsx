import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../../domain/types';
import { Button, EmptyState, Header, Screen, StatusBadge, colors } from '../../shared/ui';
import { useAssistantSessionsViewModel } from '../../state';
import { formatClock, formatSessionDate, formatTimeRange } from './formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantAttendanceRoster'>;

export function AssistantAttendanceRosterScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const { getSessionById, getAttendanceForSession } = useAssistantSessionsViewModel();

  const session = getSessionById(sessionId);
  const attendees = [...getAttendanceForSession(sessionId)].sort(
    (a, b) => new Date(a.checkedInAt).getTime() - new Date(b.checkedInAt).getTime()
  );

  if (!session) {
    return (
      <Screen>
        <EmptyState
          title="Sesi tidak ditemukan"
          description="Rekap tidak dapat ditampilkan karena sesi tidak tersedia pada data demo asisten."
          action={<Button label="Kembali" variant="secondary" onPress={() => navigation.goBack()} />}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        eyebrow="MODE ASISTEN · REKAP KEHADIRAN"
        title={session.courseName}
        description={`${session.groupName} · ${formatSessionDate(session.startsAt)}, ${formatTimeRange(session.startsAt, session.endsAt)}`}
      />

      <View style={styles.summary}>
        <StatusBadge status={session.status} />
        <Text style={styles.summaryText}>{attendees.length} praktikan hadir</Text>
      </View>

      {attendees.length === 0 ? (
        <EmptyState
          title="Belum ada presensi"
          description="Belum ada praktikan yang tercatat hadir pada sesi ini di data demo."
        />
      ) : (
        <View style={styles.list} accessibilityRole="list">
          {attendees.map((record, index) => (
            <View
              key={record.id}
              style={[styles.row, index < attendees.length - 1 && styles.rowDivider]}
              accessible
              accessibilityLabel={`${index + 1}. ${record.studentName}, hadir pukul ${formatClock(record.checkedInAt)}`}
            >
              <Text style={styles.index}>{index + 1}</Text>
              <Text style={styles.name}>{record.studentName}</Text>
              <Text style={styles.time}>{formatClock(record.checkedInAt)}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.note}>
        Rekap ini berasal dari data demo asisten dan tidak tersinkron dengan presensi di mode praktikan.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  summaryText: { fontSize: 15, fontWeight: '600', color: colors.ink },
  list: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 18,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  index: { width: 24, fontSize: 14, color: colors.muted },
  name: { flex: 1, flexShrink: 1, fontSize: 16, lineHeight: 22, color: colors.ink },
  time: { fontSize: 15, fontWeight: '600', color: colors.primary },
  note: { fontSize: 13, lineHeight: 20, color: colors.muted },
});
