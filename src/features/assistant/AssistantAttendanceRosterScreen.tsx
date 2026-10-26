import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Button,
  Card,
  EmptyState,
  Screen,
  StatusBadge,
  colors,
  typography,
} from '../../shared/ui';
import { useAssistantSessionsViewModel } from '../../state';
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
      <Screen>
        <EmptyState
          title="Sesi tidak ditemukan"
          description="Rekap tidak dapat ditampilkan karena sesi tidak tersedia pada data demo asisten."
          action={
            <Button
              label="Kembali"
              variant="outline"
              onPress={() => navigation.goBack()}
            />
          }
        />
      </Screen>
    );
  }

  const statusLabel =
    session.status === 'open'
      ? 'Terbuka'
      : session.status === 'scheduled'
        ? 'Terjadwal'
        : 'Tertutup';

  return (
    <Screen>
      {/* Editorial header — asisten: Fraunces display + italic accent */}
      <View style={styles.headerBlock}>
        <Text style={styles.eyebrow}>MODE ASISTEN · REKAP KEHADIRAN</Text>
        <Text style={styles.pageTitle} numberOfLines={2}>
          {session.courseName}
        </Text>
        <Text style={styles.pageSub}>
          {session.groupName} · {formatSessionDate(session.startsAt)}
        </Text>
        <Text style={styles.timeRange}>
          {formatTimeRange(session.startsAt, session.endsAt)}
          <Text style={styles.timeAccent}> WIB</Text>
        </Text>
      </View>

      <View style={styles.summary}>
        <StatusBadge
          label={statusLabel}
          tone={
            session.status === 'open'
              ? 'violet'
              : session.status === 'scheduled'
                ? 'lavender'
                : 'neutral'
          }
          dot
          live={session.status === 'open'}
        />
        <Text style={styles.summaryText}>
          {attendees.length} praktikan hadir
        </Text>
      </View>

      {attendees.length === 0 ? (
        <EmptyState
          title="Belum ada presensi"
          description="Belum ada praktikan yang tercatat hadir pada sesi ini di data demo."
        />
      ) : (
        <Card interactive={false}>
          <View style={styles.list}>
            {attendees.map((record, index) => (
              <Pressable
                key={record.id}
                accessibilityRole="button"
                accessibilityLabel={`${index + 1}. ${record.studentName}, hadir pukul ${formatClock(record.checkedInAt)}`}
                style={[
                  styles.row,
                  index < attendees.length - 1 && styles.rowDivider,
                ]}
              >
                <View style={styles.indexBadge}>
                  <Text style={styles.index} accessible={false}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {record.studentName}
                  </Text>
                  <Text style={styles.meta}>
                    NIM {record.studentId}
                  </Text>
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
        </Card>
      )}

      <Text style={styles.note}>
        Rekap ini berasal dari data demo asisten dan tidak tersinkron dengan
        presensi di mode praktikan.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBlock: { gap: 4 },
  eyebrow: { ...typography.overline, color: colors.violet },
  pageTitle: {
    ...typography.display,
    color: colors.ink,
    fontSize: 28,
    letterSpacing: -1,
  },
  pageSub: { ...typography.label, color: colors.inkMuted },
  timeRange: {
    ...typography.displayHero,
    color: colors.violet,
    fontSize: 22,
    marginTop: 4,
  },
  timeAccent: {
    ...typography.label,
    color: colors.violet,
    opacity: 0.7,
    fontStyle: 'italic',
  },

  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  summaryText: {
    ...typography.subtitle,
    color: colors.ink,
    fontStyle: 'italic',
  },

  list: { paddingHorizontal: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.lavenderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  index: { ...typography.label, color: colors.violet, fontWeight: '700' },
  rowText: { flex: 1, gap: 2 },
  name: { ...typography.bodyStrong, color: colors.ink },
  meta: { ...typography.caption, color: colors.inkMuted },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  time: {
    ...typography.label,
    color: colors.violet,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  note: {
    ...typography.label,
    color: colors.inkMuted,
    fontStyle: 'italic',
  },
});
