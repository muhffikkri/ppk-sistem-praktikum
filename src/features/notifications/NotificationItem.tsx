import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import type {
  InboxNotification,
  NotificationType,
} from '../../domain/notificationTypes';
import { colors, radius, spacing, Text, type IconName } from '../../shared/ui';
import { formatNotificationTime } from './formatNotificationTime';

const icons: Record<NotificationType, IconName> = {
  session_scheduled: 'calendar-outline',
  session_opened: 'location-outline',
  schedule_changed: 'swap-horizontal-outline',
  leave_decided: 'document-text-outline',
  fine_issued: 'receipt-outline',
  payment_success: 'checkmark-circle-outline',
  payment_failed: 'alert-circle-outline',
};

type Props = {
  notification: InboxNotification;
  onPress: () => void;
};

export function NotificationItem({ notification, onPress }: Props) {
  const unread = notification.readAt === null;
  const time = formatNotificationTime(notification.createdAt);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[
        unread ? 'Belum dibaca' : null,
        notification.title,
        notification.body,
        time,
      ]
        .filter(Boolean)
        .join(', ')}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        unread && styles.unread,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.icon, unread && styles.iconUnread]}>
        <Ionicons
          name={icons[notification.type]}
          size={20}
          color={unread ? colors.violet : colors.inkMuted}
        />
      </View>
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <Text variant="bodyStrong" numberOfLines={1} style={styles.title}>
            {notification.title}
          </Text>
        </View>
        {notification.body ? (
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {notification.body}
          </Text>
        ) : null}
        <Text variant="caption" tone="muted">
          {time}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
  },
  unread: {
    borderColor: colors.lavender,
    backgroundColor: colors.lavenderSubtle,
  },
  pressed: { opacity: 0.85 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  iconUnread: { backgroundColor: colors.lavender },
  text: { flex: 1, gap: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flexShrink: 1 },
});
