import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './src/app/AppNavigator';
import { AuthProvider } from './src/state';
import { fontAssets } from './src/theme/fonts';

// Keep the native splash visible until brand fonts are ready, so the first
// frame never renders in the system fallback font.
void SplashScreen.preventAutoHideAsync();

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
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="dark" />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
