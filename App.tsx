import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './src/app/AppNavigator';
import {
  AssistantDemoProvider,
  AuthProvider,
  PovProvider,
  StudentDemoProvider,
} from './src/state';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PovProvider>
          <StudentDemoProvider>
            <AssistantDemoProvider>
              <NavigationContainer>
                <AppNavigator />
                <StatusBar style="dark" />
              </NavigationContainer>
            </AssistantDemoProvider>
          </StudentDemoProvider>
        </PovProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
