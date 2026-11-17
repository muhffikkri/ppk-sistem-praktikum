import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppTopBar, EmptyState, IconButton, Screen } from '../shared/ui';
import type { RootStackParamList } from './navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

/**
 * Pusat notifikasi lokal (unslop: quiet chrome, empty state without filler).
 * Belum terhubung push backend; menampilkan daftar dari state lokal saat
 * tersedia, jika kosong tampilkan empty state.
 */
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
      <EmptyState
        icon="notifications-outline"
        title="Belum ada notifikasi"
        description="Pemberitahuan presensi dan izin akan muncul di sini."
      />
    </Screen>
  );
}
