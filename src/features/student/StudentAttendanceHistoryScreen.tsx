import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Button,
  Card,
  CardContent,
  colors,
  EmptyState,
  Header,
  radius,
  shadow,
  Screen,
  typography,
} from '../../shared/ui';
import { useStudentAttendanceViewModel } from '../../state';
import { formatClock, formatSessionDate, formatTimeRange } from './formatters';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'StudentAttendanceHistory'
>;

export function StudentAttendanceHistoryScreen({ navigation }: Props) {
  const { attendanceHistory, sessions, currentStudent } =
    useStudentAttendanceViewModel();

  const sorted = [...attendanceHistory].sort(
    (a, b) =>
      new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime(),
  );

  const total = sorted.length;
  const rate = sessions.length > 0 ? Math.round((total / sessions.length) * 100) : 0;

  return (
    <Screen>
      <Header
        eyebrow="MODE PRAKTIKAN · RIWAYAT"
        title="Riwayat kehadiran"
        description={`${currentStudent.displayName} • NIM ${currentStudent.id}`}
      />

      <View style={styles.metricsGrid}>
        <Card variant="panel" interactive={false}>
          <CardContent>
            <Text style={styles.metricLabel}>Total Presensi</Text>
            <Text style={styles.metricValue}>
              {total}
              <Text style={styles.metricSub}> sesi</Text>
            </Text>
          </CardContent>
        </Card>
        <Card variant="panel" interactive={false}>
          <CardContent>
            <Text style={styles.metricLabel}>Hadir</Text>
            <Text style={[styles.metricValue, { color: colors.successInk }]}>
              {rate}
              <Text style={styles.metricSub}>%</Text>
            </Text>
          </CardContent>
        </Card>
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Semua Presensi
        </Text>

        {sorted.length === 0 ? (
          <EmptyState
            title="Belum ada riwayat"
            description="Presensi yang kamu lakukan akan muncul di sini."
            action={
              <Button
                label="Buka jadwal"
                variant="outline"
                onPress={() => navigation.navigate('StudentSchedule')}
              />
            }
          />
        ) : (
          <View style={styles.list}>
            {sorted.map((record, index) => {
              const session = sessions.find((s) => s.id === record.sessionId);
              return (
                <View
                  key={record.id}
                  style={[
                    styles.row,
                    index < sorted.length - 1 && styles.rowDivider,
                  ]}
                >
                  <View style={styles.indexBadge}>
                    <Text style={styles.indexText} accessible={false}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {session?.courseName ?? record.sessionId}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {session
                        ? `${formatSessionDate(session.startsAt)} • ${formatTimeRange(session.startsAt, session.endsAt)}`
                        : 'Sesi tidak diketahui'}
                    </Text>
                  </View>
                  <Text style={styles.rowTime}>
                    {formatClock(record.checkedInAt)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <Text style={styles.note}>
        Riwayat ini berasal dari data demo praktikan dan dapat direset saat
        aplikasi dimulai ulang.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metricsGrid: { flexDirection: 'row', gap: 8 },
  metricLabel: { ...typography.caption, color: colors.inkMuted },
  metricValue: { ...typography.title, color: colors.ink, fontSize: 22 },
  metricSub: { ...typography.caption, color: colors.inkMuted },
  sectionBlock: { gap: 12 },
  sectionTitle: { ...typography.overline, color: colors.inkMuted },
  list: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius['3xl'],
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: { ...typography.label, color: colors.violet, fontSize: 12 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { ...typography.bodyStrong, color: colors.ink },
  rowMeta: { ...typography.caption, color: colors.inkMuted },
  rowTime: { ...typography.label, color: colors.violet, fontWeight: '700' },
  note: { ...typography.caption, color: colors.inkMuted },
});
