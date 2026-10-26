import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Session } from '../../domain/types';
import type { RootStackParamList } from '../../app/navigation';
import {
  Card,
  CardContent,
  CardOverline,
  colors,
  LegacyStatusBadge,
  radius,
  shadow,
  Screen,
  typography,
} from '../../shared/ui';
import { useStudentAttendanceViewModel } from '../../state';
import { formatSessionDate, formatTimeRange } from './formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentSchedule'>;

function statusLabel(status: Session['status']): string {
  switch (status) {
    case 'open':
      return 'Terbuka';
    case 'scheduled':
      return 'Terjadwal';
    case 'closed':
      return 'Tertutup';
  }
}

export function StudentScheduleScreen({ navigation }: Props) {
  const { sessions, getAttendanceForSession } =
    useStudentAttendanceViewModel();

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  return (
    <Screen>
      <Text accessibilityRole="header" style={styles.screenTitle}>
        Jadwal
      </Text>
      <Text style={styles.subhead}>
        Semester Ganjil 2026/2027 • Kelas 3SE1
      </Text>

      <Card variant="heroViolet" interactive={false}>
        <CardContent>
          <CardOverline dark>KELAS KAMU</CardOverline>
          <Text style={styles.heroTitle}>Kelas 3SE1 — Kelompok Praktikan</Text>
          <Text style={styles.heroMeta}>
            {sorted.length} sesi praktikum minggu ini
          </Text>
        </CardContent>
      </Card>

      <Text accessibilityRole="header" style={styles.sectionTitle}>
        Semua Sesi ({sorted.length})
      </Text>

      <View style={styles.list}>
        {sorted.map((session) => {
          const record = getAttendanceForSession(session.id);
          return (
            <Pressable
              key={session.id}
              accessibilityRole="button"
              accessibilityLabel={`${session.courseName}, ${session.groupName}, ${formatSessionDate(session.startsAt)} ${formatTimeRange(session.startsAt, session.endsAt)}, status ${statusLabel(session.status)}`}
              accessibilityHint="Membuka detail sesi"
              onPress={() =>
                navigation.navigate('StudentSessionDetail', {
                  sessionId: session.id,
                })
              }
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <View style={styles.topRow}>
                <Text style={styles.course} numberOfLines={2}>
                  {session.courseName}
                </Text>
                <LegacyStatusBadge status={session.status} />
              </View>
              <Text style={styles.group}>{session.groupName}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>
                  {formatSessionDate(session.startsAt)}
                </Text>
                <Text style={styles.meta}>
                  {formatTimeRange(session.startsAt, session.endsAt)}
                </Text>
              </View>
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  {record
                    ? `Presensi tercatat ${formatSessionDate(record.checkedInAt)}`
                    : 'Belum presensi'}
                </Text>
                <Text style={styles.chevron} accessible={false}>
                  Detail ›
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenTitle: { ...typography.title, color: colors.ink },
  subhead: {
    ...typography.label,
    color: colors.inkMuted,
    marginTop: -8,
    marginBottom: 4,
  },
  heroTitle: {
    ...typography.subtitle,
    color: colors.panel,
  },
  heroMeta: {
    ...typography.label,
    color: colors.panel,
    opacity: 0.85,
  },
  sectionTitle: { ...typography.overline, color: colors.inkMuted },
  list: { gap: 12 },
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius['3xl'],
    padding: 18,
    gap: 8,
    ...shadow.card,
  },
  pressed: {
    backgroundColor: colors.lavenderSubtle,
    borderColor: colors.violet,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  course: {
    flex: 1,
    flexShrink: 1,
    ...typography.subtitle,
    color: colors.ink,
    fontSize: 16,
  },
  group: { ...typography.label, color: colors.inkMuted },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: 4,
  },
  meta: { ...typography.label, color: colors.ink },
  footer: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  footerText: { flexShrink: 1, ...typography.label, color: colors.inkMuted },
  chevron: { ...typography.label, color: colors.violet },
});
