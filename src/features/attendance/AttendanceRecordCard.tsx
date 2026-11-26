import type { ReactNode } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '../../theme/tokens';
import {
  Card,
  StatusBadge,
  Text,
  type BadgeTone,
  type IconName,
  type TextTone,
} from '../../shared/ui';

export type AttendanceRecordCardProps = {
  title: string;
  meta: string;
  detail?: string;
  detailIcon?: IconName;
  status: { label: string; tone: BadgeTone };
  leading?: ReactNode;
  time: string;
  timeLabel: string;
  timeTone?: TextTone;
  onPress?: () => void;
  accessibilityHint?: string;
};

/** Kartu satu catatan presensi, dipakai oleh layar praktikan dan asprak. */
export function AttendanceRecordCard({
  title,
  meta,
  detail,
  detailIcon,
  status,
  leading,
  time,
  timeLabel,
  timeTone = 'muted',
  onPress,
  accessibilityHint,
}: AttendanceRecordCardProps) {
  return (
    <Card
      interactive={Boolean(onPress)}
      onPress={onPress}
      accessibilityHint={accessibilityHint}
      style={styles.card}
    >
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.main}>
        <View style={styles.titleRow}>
          <Text variant="bodyStrong" numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          <StatusBadge label={status.label} tone={status.tone} />
        </View>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {meta}
        </Text>
        {detail ? (
          <View style={styles.detailRow}>
            {detailIcon ? (
              <Ionicons name={detailIcon} size={13} color={colors.violet} />
            ) : null}
            <Text
              variant="caption"
              tone="muted"
              numberOfLines={1}
              style={styles.detail}
            >
              {detail}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.trailing}>
        <Text variant="subtitle" tone={timeTone} numberOfLines={1}>
          {time}
        </Text>
        <Text variant="overline" tone="muted" numberOfLines={1}>
          {timeLabel}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  leading: { flexShrink: 0 },
  main: { flex: 1, gap: spacing.xs, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { flexShrink: 1 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  detail: { flexShrink: 1 },
  trailing: { alignItems: 'flex-end', gap: spacing.xs, flexShrink: 0 },
});
