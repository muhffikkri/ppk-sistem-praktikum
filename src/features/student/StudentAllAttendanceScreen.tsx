import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Banner,
  Button,
  colors,
  EmptyState,
  radius,
  Screen,
  typography,
} from '../../shared/ui';
import { useStudentAttendanceViewModel } from '../../state';
import { formatClock, formatSessionDate } from './formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentAllAttendance'>;

export function StudentAllAttendanceScreen({ navigation }: Props) {
  const { attendanceHistory, sessions, currentStudent, loading, error, retry } =
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
        <View style={styles.stateBlock}>
          <ActivityIndicator color={colors.violet} />
          <Text style={styles.stateText}>Memuat jadwal…</Text>
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <Banner
          title="Gagal memuat jadwal"
          message={error}
          tone="danger"
          action={
            <Button label="Coba lagi" variant="outline" onPress={retry} />
          }
        />
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Praktikan header — clean sans, bold title */}
      <View style={styles.headerBlock}>
        <Text style={styles.eyebrow}>MODE PRAKTIKAN · RIWAYAT</Text>
        <Text style={styles.pageTitle}>Semua Presensi</Text>
        <Text style={styles.pageSub}>
          {currentStudent?.displayName ?? '-'} · {currentStudent?.email ?? '-'}
        </Text>
      </View>

      {/* Metric tiles */}
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
        <View style={styles.metricTile}>
          <Text style={styles.metricValue}>{sessions.length}</Text>
          <Text style={styles.metricLabel}>Total Sesi</Text>
        </View>
      </View>

      {sorted.length === 0 ? (
        <EmptyState
          title="Belum ada riwayat presensi"
          description="Presensi yang kamu lakukan akan muncul di sini."
          action={
            <Button
              label="Buka jadwal"
              variant="outline"
              onPress={() => navigation.navigate('StudentAllSessions')}
            />
          }
        />
      ) : (
        <View style={styles.list}>
          {sorted.map((record, index) => {
            const session = sessions.find((s) => s.id === record.sessionId);
            return (
              <Pressable
                key={record.id}
                accessibilityRole="button"
                accessibilityLabel={`${session?.courseName ?? 'Sesi'}, ${formatSessionDate(session?.startsAt ?? record.checkedInAt)}, pukul ${formatClock(record.checkedInAt)}`}
                onPress={() =>
                  navigation.navigate('StudentSessionDetail', {
                    sessionId: record.sessionId,
                  })
                }
                style={({ pressed }) => [
                  styles.row,
                  index < sorted.length - 1 && styles.divider,
                  pressed && styles.pressed,
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
                      ? `${formatSessionDate(session.startsAt)}`
                      : 'Sesi tidak diketahui'}
                  </Text>
                </View>
                <View style={styles.rowTrailing}>
                  <Text style={styles.rowTime}>
                    {formatClock(record.checkedInAt)}
                  </Text>
                  <Text style={styles.rowStatus}>Hadir</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  stateBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 48,
  },
  stateText: { ...typography.body, color: colors.inkMuted },

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

  emptyBlock: {
    backgroundColor: colors.panel,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { ...typography.bodyStrong, color: colors.ink },
  emptySub: { ...typography.body, color: colors.inkMuted, textAlign: 'center' },
  emptyAction: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.violet,
  },
  emptyActionPressed: { backgroundColor: colors.violetDark },
  emptyActionLabel: {
    ...typography.label,
    color: colors.panel,
    fontWeight: '600',
  },

  list: {
    backgroundColor: colors.panel,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  pressed: { backgroundColor: colors.lavenderSubtle },
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
  rowTitle: { ...typography.bodyStrong, color: colors.ink, fontSize: 14 },
  rowMeta: { ...typography.caption, color: colors.inkMuted },
  rowTrailing: { alignItems: 'flex-end', gap: 2 },
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
});
