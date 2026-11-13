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

import { StudentAttendanceProvider } from './src/state/StudentAttendanceContext';

export default function App() {
  const currentStudentId = 'student-123';

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PovProvider>
          <StudentDemoProvider>
            <AssistantDemoProvider>
              <StudentAttendanceProvider currentStudentId={currentStudentId}>
                <NavigationContainer>
                  <AppNavigator />
                  <StatusBar style="dark" />
                </NavigationContainer>
              </StudentAttendanceProvider>
            </AssistantDemoProvider>
          </StudentDemoProvider>
        </PovProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}