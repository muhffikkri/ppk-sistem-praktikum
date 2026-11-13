import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './src/app/AppNavigator';
import {
  PovProvider,
  StudentDemoProvider,
} from './src/state';

// Impor StudentAttendanceProvider khusus untuk modul real-time Anda (Developer 3)
import { StudentAttendanceProvider } from './src/state/StudentAttendanceContext';

export default function App() {
  const currentStudentId = "student-123"; // Sesuaikan dengan ID student Anda

  return (
    <SafeAreaProvider>
      <PovProvider>
        <StudentDemoProvider>
          <StudentAttendanceProvider currentStudentId={currentStudentId}>
            <NavigationContainer>
              <AppNavigator />
              <StatusBar style="dark" />
            </NavigationContainer>
          </StudentAttendanceProvider>
        </StudentDemoProvider>
      </PovProvider>
    </SafeAreaProvider>
  );
}