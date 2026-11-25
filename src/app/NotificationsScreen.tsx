import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import {
  notificationRoute,
  type InboxNotification,
} from '../domain/notificationTypes';
import { NotificationItem } from '../features/notifications/NotificationItem';
import {
  NotificationPermissionStatus,
  usePermissionContext,
} from '../features/permissions';
import {
  AppTopBar,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  Screen,
  SectionHeader,
  spacing,
} from '../shared/ui';
import { useNotificationInbox } from '../state';
import type { RootStackParamList } from './navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export function NotificationsScreen({ navigation }: Props) {
  const permission = usePermissionContext();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markRead,
    markAllRead,
    retry,
  } = useNotificationInbox();

  const open = (notification: InboxNotification) => {
    void markRead(notification.id);
    const route = notificationRoute(notification);
    if (!route) return;
    if (route.screen === 'StudentLeaveList') {
      navigation.navigate('StudentLeaveList');
    } else {
      navigation.navigate(route.screen, { sessionId: route.sessionId });
    }
  };

  return (
    <Screen withDock>
      <AppTopBar
        logoIcon="notifications-outline"
        title="Notifikasi"
        trailing={
          <IconButton
            icon="close"
            accessibilityLabel="Tutup"
            onPress={() => navigation.goBack()}
          />
        }
      />

      {/* Status izin hanya muncul bila perangkat belum siap menerima push. */}
      {permission.registration !== 'registered' ? (
        <NotificationPermissionStatus />
      ) : null}

      {error ? <ErrorState message={error} onRetry={retry} /> : null}

      {loading ? (
        <LoadingState label="Memuat notifikasi…" />
      ) : notifications.length === 0 ? (
        error ? null : (
          <EmptyState
            icon="notifications-off-outline"
            title="Belum ada notifikasi"
            description="Jadwal baru, sesi yang dibuka, perubahan jadwal, dan keputusan izin akan muncul di sini."
          />
        )
      ) : (
        <View style={styles.list}>
          <SectionHeader
            title={unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Terbaru'}
            actionLabel={unreadCount > 0 ? 'Tandai semua dibaca' : undefined}
            onAction={unreadCount > 0 ? () => void markAllRead() : undefined}
          />
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onPress={() => open(notification)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
});
