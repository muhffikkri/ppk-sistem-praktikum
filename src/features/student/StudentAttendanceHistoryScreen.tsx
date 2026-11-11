import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Button,
  colors,
  EmptyState,
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
  const rate =
    sessions.length > 0 ? Math.round((total / sessions.length) * 100) : 0;

  return (
    <Screen>
      {/* Praktikan: clean sans, bold title */}
      <View style={styles.headerBlock}>
        <Text style={styles.eyebrow}>MODE PRAKTIKAN · RIWAYAT</Text>
        <Text style={styles.pageTitle}>Riwayat Kehadiran</Text>
        <Text style={styles.pageSub}>
          {currentStudent.displayName} • NIM {currentStudent.id}
        </Text>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricTile}>
          <Text style={styles.metricValue}>{total}</Text>
          <Text style={styles.metricLabel}>Total Presensi</Text>
        </View>
        <View style={styles.metricTile}>
          <Text style={[styles.metricValue, { color: colors.successInk }]}>
            {rate}%
          </Text>
          <Text style={styles.metricLabel}>Tingkat Kehadiran</Text>
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Semua Presensi</Text>

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
                  <View style={styles.rowRight}>
                    <Text style={styles.rowTime}>
                      {formatClock(record.checkedInAt)}
                    </Text>
                    <Text style={styles.rowStatus}>Hadir</Text>
                  </View>
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
  // Praktikan: clean sans, bold — no italic, no editorial serif for titles
  headerBlock: { gap: 4 },
  eyebrow: { ...typography.overline, color: colors.violet },
  pageTitle: {
    ...typography.body,
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 28,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.5,
  },
  pageSub: { ...typography.label, color: colors.inkMuted },

  metricsGrid: { flexDirection: 'row', gap: 8 },
  metricTile: {
    flex: 1,
    backgroundColor: colors.panel,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 4,
  },
  metricValue: {
    ...typography.body,
    fontSize: 24,
    fontWeight: '800',
    color: colors.ink,
    fontFamily: 'Plus Jakarta Sans',
  },
  metricLabel: { ...typography.caption, color: colors.inkMuted },

  sectionBlock: { gap: 12 },
  sectionTitle: {
    ...typography.label,
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  list: {
    backgroundColor: colors.panel,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
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
  indexText: { ...typography.label, color: colors.violet, fontWeight: '700' },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { ...typography.bodyStrong, color: colors.ink },
  rowMeta: { ...typography.caption, color: colors.inkMuted },
  rowRight: { alignItems: 'flex-end', gap: 2 },
  rowTime: {
    ...typography.label,
    color: colors.ink,
    fontWeight: '700',
    fontFamily: 'Plus Jakarta Sans',
  },
  rowStatus: {
    ...typography.caption,
    color: colors.successInk,
    fontWeight: '600',
  },
  note: { ...typography.caption, color: colors.inkMuted },
});
