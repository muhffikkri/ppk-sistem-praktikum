import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  colors,
  radius,
  Screen,
  StatusBadge,
  typography,
} from '../../shared/ui';
import { useAssistantSessionsViewModel } from '../../state';
import { formatClock, formatSessionDate } from './formatters';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'AssistantAllAttendance'
>;

export function AssistantAllAttendanceScreen({ navigation }: Props) {
  const { sessions, getAttendanceForSession } = useAssistantSessionsViewModel();

  // Flatten all attendance records across every session, newest first.
  const allRecords = sessions.flatMap((s) =>
    getAttendanceForSession(s.id).map((r) => ({ ...r, session: s })),
  );
  const sorted = [...allRecords].sort(
    (a, b) =>
      new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime(),
  );
  const totalSessions = sessions.length;
  const totalAttendees = allRecords.length;

  return (
    <Screen>
      {/* Editorial header — asisten: Fraunces display + italic accent */}
      <View style={styles.headerBlock}>
        <Text style={styles.eyebrow}>MODE ASISTEN · REKAP KEHADIRAN</Text>
        <Text style={styles.pageTitle}>
          Semua Presensi
          <Text style={styles.pageTitleAccent}> Lab</Text>
        </Text>
        <Text style={styles.pageSub}>
          {totalAttendees} catatan hadir · {totalSessions} sesi tercatat
        </Text>
      </View>

      {/* Summary strip */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalSessions}</Text>
          <Text style={styles.summaryLabel}>Sesi</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalAttendees}</Text>
          <Text style={styles.summaryLabel}>Catatan Hadir</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {totalSessions > 0
              ? Math.round((totalAttendees / (totalSessions * 40)) * 100)
              : 0}
            %
          </Text>
          <Text style={styles.summaryLabel}>Rata-rata</Text>
        </View>
      </View>

      {sorted.length === 0 ? (
        <View style={styles.emptyBlock}>
          <Text style={styles.emptyTitle}>Belum ada presensi</Text>
          <Text style={styles.emptySub}>
            Data demo asisten belum memiliki catatan kehadiran.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {sorted.map((record, index) => (
            <Pressable
              key={record.id}
              accessibilityRole="button"
              accessibilityLabel={`${record.studentName}, ${formatSessionDate(record.session.startsAt)}, hadir pukul ${formatClock(record.checkedInAt)}`}
              onPress={() =>
                navigation.navigate('AssistantAttendanceRoster', {
                  sessionId: record.sessionId,
                })
              }
              style={({ pressed }) => [
                styles.row,
                index < sorted.length - 1 && styles.divider,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.rowLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText} accessible={false}>
                    {initialsOf(record.studentName)}
                  </Text>
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {record.studentName}
                  </Text>
                  <Text style={styles.meta}>
                    {record.session.courseName} ·{' '}
                    {formatSessionDate(record.session.startsAt)}
                  </Text>
                </View>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.time}>
                  {formatClock(record.checkedInAt)}
                </Text>
                <StatusBadge label="Hadir" tone="lime" />
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const second = parts[parts.length - 1]?.[0] ?? '';
  return `${first}${second}`.toUpperCase();
}

const styles = StyleSheet.create({
  headerBlock: { gap: 6 },
  eyebrow: { ...typography.overline, color: colors.violet },
  pageTitle: {
    ...typography.display,
    color: colors.ink,
    fontSize: 32,
    letterSpacing: -1,
  },
  pageTitleAccent: {
    ...typography.display,
    color: colors.violet,
    fontSize: 32,
    letterSpacing: -1,
    fontStyle: 'italic',
  },
  pageSub: { ...typography.label, color: colors.inkMuted },

  summaryRow: {
    flexDirection: 'row',
    backgroundColor: colors.panel,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    alignItems: 'center',
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.borderSubtle,
  },
  summaryValue: {
    ...typography.display,
    color: colors.violet,
    fontSize: 24,
    fontStyle: 'italic',
  },
  summaryLabel: { ...typography.caption, color: colors.inkMuted },

  emptyBlock: {
    backgroundColor: colors.panel,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    padding: 32,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: { ...typography.bodyStrong, color: colors.ink },
  emptySub: { ...typography.body, color: colors.inkMuted, textAlign: 'center' },

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
    justifyContent: 'space-between',
    gap: 12,
    padding: 14,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  pressed: { backgroundColor: colors.lavenderSubtle },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lavenderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.label, color: colors.violet, fontWeight: '700' },
  rowText: { gap: 2, flex: 1 },
  name: { ...typography.bodyStrong, color: colors.ink },
  meta: { ...typography.caption, color: colors.inkMuted },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  time: { ...typography.label, color: colors.violet, fontStyle: 'italic' },
});
