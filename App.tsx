import Ionicons from '@expo/vector-icons/Ionicons';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { NavigationBar } from 'expo-navigation-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './src/app/AppNavigator';
import type { RootStackParamList } from './src/app/navigation';
import { notificationRoute } from './src/domain/notificationTypes';
import { DevicePermissionGate } from './src/features/permissions';
import { markNotificationRead } from './src/services/firestore/notificationInboxService';
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
  const readyUid = readyUser?.uid ?? null;
  const readyRole = readyUser?.role ?? null;
  const openPushTarget = useCallback(
    (target: PushTarget) => {
      if (!navigation.isReady() || !readyUid || readyRole !== 'student')
        return false;
      const route = notificationRoute(target);
      if (
        !route ||
        !navigation.getRootState()?.routeNames.includes(route.screen)
      )
        return false;
      if ('fineId' in route) {
        navigation.navigate('StudentFineDetail', { fineId: route.fineId });
      } else if ('sessionId' in route) {
        navigation.navigate(route.screen, { sessionId: route.sessionId });
      } else {
        navigation.navigate(route.screen);
      }
      if (target.notificationId) {
        void markNotificationRead(readyUid, target.notificationId).catch(
          () => undefined,
        );
      }
      return true;
    },
    [navigation, readyRole, readyUid],
  );

  return (
    <DevicePermissionGate
      uid={readyUser?.uid ?? null}
      onTarget={openPushTarget}
    >
      <NavigationContainer ref={navigation}>
        <AppNavigator />
        <StatusBar style="dark" />
        <NavigationBar style="light" />
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
