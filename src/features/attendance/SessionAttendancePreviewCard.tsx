import { StyleSheet, View } from 'react-native';

import type { Session } from '../../domain/types';
import { spacing } from '../../theme/tokens';
import { Avatar, Card, StatusBadge, Text } from '../../shared/ui';
import { formatSessionDate, formatTimeRange } from '../assistant/formatters';
import type { AttendeePreview } from './sessionAttendanceGroups';

export type SessionAttendancePreviewCardProps = {
  session: Session;
  presentCount: number;
  onTimeCount: number;
  lateCount: number;
  attendees: AttendeePreview[];
  onPress: () => void;
};

/**
 Kartu ringkas satu sesi untuk riwayat presensi: cuplikan 2–3 praktikan hadir.
 Rekap lengkap dibuka lewat onPress, bukan ditampilkan semua di daftar.
*/
export function SessionAttendancePreviewCard({
  session,
  presentCount,
  onTimeCount,
  lateCount,
  attendees,
  onPress,
}: SessionAttendancePreviewCardProps) {
  const identity = [session.title, session.groupName, session.lab]
    .filter(Boolean)
    .join(' · ');
  const hidden = Math.max(0, presentCount - attendees.length);

  return (
    <Card
      onPress={onPress}
      accessibilityHint="Membuka rekap kehadiran sesi"
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.when}>
          <Text variant="overline" tone="muted" numberOfLines={1}>
            {formatSessionDate(session.startsAt)}
          </Text>
          <Text variant="captionStrong" tone="ink" numberOfLines={1}>
            {formatTimeRange(session.startsAt, session.endsAt)}
          </Text>
        </View>
        <StatusBadge label={`Hadir ${presentCount}`} tone="success" />
      </View>

      <View style={styles.titleBlock}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {session.courseName}
        </Text>
        {identity ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {identity}
          </Text>
        ) : null}
      </View>

      <View style={styles.counts}>
        <Text variant="captionStrong" tone="success" numberOfLines={1}>
          {`Tepat waktu ${onTimeCount}`}
        </Text>
        <Text variant="captionStrong" tone="pink" numberOfLines={1}>
          {`Terlambat ${lateCount}`}
        </Text>
      </View>

      {attendees.length > 0 ? (
        <View style={styles.attendees}>
          {attendees.map((attendee) => (
            <View key={attendee.id} style={styles.attendee}>
              <Avatar name={attendee.name} tone={attendee.tone} size={36} />
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {attendee.name.split(' ')[0]}
              </Text>
            </View>
          ))}
          {hidden > 0 ? (
            <View style={styles.more} accessible={false}>
              <Text variant="captionStrong" tone="violet">
                {`+${hidden}`}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, padding: spacing.md },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  when: { gap: 2, flexShrink: 1 },
  titleBlock: { gap: spacing.xs },
  counts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  attendees: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  attendee: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 0,
  },
  more: {
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
