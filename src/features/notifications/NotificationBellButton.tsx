import { unreadBadgeLabel } from '../../domain/notificationTypes';
import { IconButton } from '../../shared/ui';
import { useNotificationInbox } from '../../state';

/** Tombol lonceng di topbar beserta jumlah notifikasi yang belum dibaca. */
export function NotificationBellButton({ onPress }: { onPress: () => void }) {
  const { unreadCount } = useNotificationInbox();
  return (
    <IconButton
      icon={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
      accessibilityLabel="Notifikasi"
      badge={unreadBadgeLabel(unreadCount)}
      onPress={onPress}
    />
  );
}
