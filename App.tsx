import { Ionicons } from '@expo/vector-icons';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './src/app/AppNavigator';
import type { RootStackParamList } from './src/app/navigation';
import { DevicePermissionGate } from './src/features/permissions';
import type { PushTarget } from './src/services/notifications/pushNotificationService';
import { AuthProvider, useAuth } from './src/state';
import { fontAssets } from './src/theme/fonts';

// Keep the native splash visible until brand fonts are ready, so the first
// frame never renders in the system fallback font.
void SplashScreen.preventAutoHideAsync();

function AppNavigation() {
  const navigation = useNavigationContainerRef<RootStackParamList>();
  const { authStatus, user, needsRoleSelection } = useAuth();
  const readyUser =
    authStatus === 'authenticated' && !needsRoleSelection ? user : null;
  const openPushTarget = useCallback(
    (target: PushTarget) => {
      if (!navigation.isReady() || readyUser?.role !== 'student') return false;
      if (target.type === 'leave_decided') {
        if (!navigation.getRootState()?.routeNames.includes('StudentLeaveList'))
          return false;
        navigation.navigate('StudentLeaveList');
      } else {
        if (
          !navigation
            .getRootState()
            ?.routeNames.includes('StudentSessionDetail')
        )
          return false;
        navigation.navigate('StudentSessionDetail', {
          sessionId: target.sessionId,
        });
      }
      return true;
    },
    [navigation, readyUser?.role],
  );

  return (
    <DevicePermissionGate
      uid={readyUser?.uid ?? null}
      onTarget={openPushTarget}
    >
      <NavigationContainer ref={navigation}>
        <AppNavigator />
        <StatusBar style="dark" />
      </NavigationContainer>
    </DevicePermissionGate>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    ...fontAssets,
    ...Ionicons.font,
  });
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (fontError && __DEV__) {
      console.warn('[App] font load failed, using system fonts:', fontError);
    }
    if (ready) SplashScreen.hide();
  }, [ready, fontError]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
