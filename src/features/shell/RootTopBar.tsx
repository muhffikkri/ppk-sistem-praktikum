import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ReactNode } from 'react';

import type { RootStackParamList } from '../../app/navigation';
import { openDockTab } from '../../app/openDockTab';
import { isAssistantRole } from '../../domain/asprakScope';
import { AppTopBar, IconButton } from '../../shared/ui';
import { useAuth } from '../../state';
import { NotificationBellButton } from '../notifications/NotificationBellButton';

type Props = {
  /** Override the portal caption; defaults to the signed-in role's portal. */
  subtitle?: string;
  /** Extra actions appended after the standard shortcuts. */
  trailing?: ReactNode;
};

/**
 * The single top bar used by every root-level page. Keeping the brand,
 * portal caption and shortcut trio in one place makes the chrome identical
 * on Home, Schedule, Attendance, Calendar and Profile.
 */
export function RootTopBar({ subtitle, trailing }: Props) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const portal =
    subtitle ??
    (isAssistantRole(user?.role) ? 'Portal Asisten' : 'Portal Praktikan');

  return (
    <AppTopBar
      logoIcon="school-outline"
      title="LabPresensi"
      subtitle={portal}
      trailing={
        <>
          <IconButton
            icon="map-outline"
            variant="circle"
            accessibilityLabel="Peta Laboratorium"
            onPress={() => navigation.navigate('LabMaps')}
          />
          <NotificationBellButton
            onPress={() => navigation.navigate('Notifications')}
          />
          <IconButton
            icon="person-outline"
            variant="circle"
            accessibilityLabel="Profil"
            onPress={() => openDockTab(navigation, 'Profile')}
          />
          {trailing}
        </>
      }
    />
  );
}
