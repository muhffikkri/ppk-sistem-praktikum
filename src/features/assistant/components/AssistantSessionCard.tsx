import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Session } from '../../../domain/types';
import { StatusBadge, colors } from '../../../shared/ui';
import { formatSessionDate, formatTimeRange } from '../formatters';

type AssistantSessionCardProps = {
  session: Session;
  attendeeCount: number;
  onPress: () => void;
};

const statusLabels: Record<Session['status'], string> = {
  scheduled: 'Terjadwal',
  open: 'Terbuka',
  closed: 'Tertutup',
};

export function AssistantSessionCard({
  session,
  attendeeCount,
  onPress,
}: AssistantSessionCardProps) {
  const date = formatSessionDate(session.startsAt);
  const time = formatTimeRange(session.startsAt, session.endsAt);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${session.courseName}, ${session.groupName}, ${date} ${time}, status ${statusLabels[session.status]}`}
      accessibilityHint="Membuka detail sesi"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <Text style={styles.course}>{session.courseName}</Text>
        <StatusBadge status={session.status} />
      </View>
      <Text style={styles.group}>{session.groupName}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{date}</Text>
        <Text style={styles.meta}>{time}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>{attendeeCount} praktikan hadir</Text>
        <Text style={styles.chevron} accessible={false}>
          Detail ›
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 18,
    gap: 8,
  },
  pressed: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  course: {
    flex: 1,
    flexShrink: 1,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.ink,
  },
  group: { fontSize: 15, lineHeight: 22, color: colors.muted },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4 },
  meta: { fontSize: 14, lineHeight: 20, color: colors.ink },
  footer: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  footerText: { flexShrink: 1, fontSize: 14, color: colors.muted },
  chevron: { fontSize: 14, fontWeight: '600', color: colors.primary },
});
