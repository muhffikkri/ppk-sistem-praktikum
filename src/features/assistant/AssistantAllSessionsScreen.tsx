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
import { formatSessionDate, formatTimeRange } from './formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantAllSessions'>;

export function AssistantAllSessionsScreen({ navigation }: Props) {
  const { sessions, getAttendanceForSession } = useAssistantSessionsViewModel();

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  return (
    <Screen>
      {/* Editorial header — asisten: Fraunces display + italic accent */}
      <View style={styles.headerBlock}>
        <Text style={styles.eyebrow}>MODE ASISTEN · SEMUA SESI</Text>
        <Text style={styles.pageTitle}>
          Semua Sesi
          <Text style={styles.pageTitleAccent}> Pratikum</Text>
        </Text>
        <Text style={styles.pageSub}>
          {sorted.length} sesi tercatat · Semester Ganjil 2026/2027
        </Text>
      </View>

      <View style={styles.list}>
        {sorted.map((session, index) => {
          const attendees = getAttendanceForSession(session.id).length;
          return (
            <Pressable
              key={session.id}
              accessibilityRole="button"
              accessibilityLabel={`${session.courseName}, ${formatSessionDate(session.startsAt)}, status ${session.status}`}
              onPress={() =>
                navigation.navigate('AssistantSessionDetail', {
                  sessionId: session.id,
                })
              }
              style={({ pressed }) => [
                styles.card,
                index < sorted.length - 1 && styles.divider,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.cardTop}>
                <Text style={styles.course} numberOfLines={2}>
                  {session.courseName}
                </Text>
                <StatusBadge
                  label={
                    session.status === 'open'
                      ? 'Terbuka'
                      : session.status === 'scheduled'
                        ? 'Terjadwal'
                        : 'Tertutup'
                  }
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
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>
                  {formatSessionDate(session.startsAt)}
                </Text>
                <Text style={styles.meta}>
                  {formatTimeRange(session.startsAt, session.endsAt)}
                </Text>
                <Text style={styles.metaMuted}>{attendees} hadir</Text>
              </View>
              <Text style={styles.chevron}>Detail ›</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
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
  // Asisten accent: Fraunces italic, violet — editorial signature
  pageTitleAccent: {
    ...typography.display,
    color: colors.violet,
    fontSize: 32,
    letterSpacing: -1,
    fontStyle: 'italic',
  },
  pageSub: { ...typography.label, color: colors.inkMuted },

  list: {
    backgroundColor: colors.panel,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  card: {
    padding: 18,
    gap: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  pressed: { backgroundColor: colors.lavenderSubtle },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  course: {
    flex: 1,
    flexShrink: 1,
    ...typography.subtitle,
    color: colors.ink,
    letterSpacing: -0.36,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: 4,
  },
  meta: { ...typography.label, color: colors.ink },
  metaMuted: { ...typography.label, color: colors.inkMuted },
  chevron: { ...typography.label, color: colors.violet, fontStyle: 'italic' },
});
