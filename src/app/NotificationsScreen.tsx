import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { NotificationPermissionStatus } from '../features/permissions';
import { AppTopBar, IconButton, Screen } from '../shared/ui';
import type { RootStackParamList } from './navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export function NotificationsScreen({ navigation }: Props) {
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
      <NotificationPermissionStatus />
    </Screen>
  );
}
