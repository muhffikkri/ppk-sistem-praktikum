import { useNavigation } from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useState } from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  LoginScreen,
  RegisterScreen,
  LandingScreen,
  RoleSelectionScreen,
} from '../features/auth';
import {
  AssistantAllAttendanceScreen,
  AssistantAllSessionsScreen,
  AssistantAttendanceRosterScreen,
  AssistantClassFormScreen,
  AssistantClassListScreen,
  AssistantScheduleScreen,
  AssistantSessionDetailScreen,
  AssistantSessionFormScreen,
} from '../features/assistant';

import {
  StudentAllAttendanceScreen,
  StudentAllSessionsScreen,
  StudentAttendanceHistoryScreen,
  StudentScheduleScreen,
  StudentSessionDetailScreen,
} from '../features/student';

import {
  AssistantLeaveReviewListScreen,
  LeaveProvider,
  StudentLeaveListScreen,
  StudentLeaveRequestFormScreen,
} from '../features/leave';

import { db } from '../services/firebase';

import { BottomDock, colors, typography, type DockTab } from '../shared/ui';

import { useActorRole, useAuth } from '../state';

import { AssistantSessionsProvider } from '../state/AssistantSessionsContext';
import { StudentAttendanceProvider } from '../state/StudentAttendanceContext';

import { CalendarScreen } from './CalendarScreen';

import { HomeScreen } from './HomeScreen';

import type { RootStackParamList } from './navigation';

import { ProfileEditScreen } from './ProfileEditScreen';

import { ProfileScreen } from './ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// 5-slot dock: [Beranda] [Jadwal] [QR FAB] [Presensi] [Akun]

// Uses Ionicons from @expo/vector-icons.

// The Jadwal / Presensi keys are stable; their target routes depend on
// the active POV (see DOCK_ROUTE_FOR_POV below).

const DOCK_TABS: DockTab[] = [
  { key: 'Home', label: 'Beranda', glyph: 'grid' },

  { key: 'Schedule', label: 'Jadwal', glyph: 'calendar' },

  { key: 'Attendance', label: 'Presensi', glyph: 'finger-print' },

  { key: 'Profile', label: 'Akun', glyph: 'person' },
];

const DOCK_ROUTE_FOR_POV: Record<
  'praktikan' | 'asisten',
  { Schedule: keyof RootStackParamList; Attendance: keyof RootStackParamList }
> = {
  praktikan: {
    Schedule: 'StudentSchedule',

    Attendance: 'StudentAttendanceHistory',
  },

  asisten: {
    Schedule: 'AssistantSchedule',

    Attendance: 'AssistantAllAttendance',
  },
};

const AuthStack = createNativeStackNavigator<{
  Landing: undefined;
  Login: undefined;
  Register: undefined;
  RoleSelection: undefined;
}>();

export function AppNavigator() {
  const { authStatus, user, logout, needsRoleSelection } = useAuth();
  const actorRole = useActorRole();

  const [activeKey, setActiveKey] = useState<string>('Home');

  const navigation = useNavigation() as unknown as {
    navigate: (name: string | keyof RootStackParamList) => void;

    /** Reset the whole stack to a single top-level route used by the
     *  bottom dock so it never surfaces a "back" chevron. */
    reset: (state: {
      index: number;
      routes: { name: string; params?: Record<string, unknown> }[];
    }) => void;
  };

  // Resolve the stable dock keys to the route matching the active POV.
  const resolveRoute = (key: string): keyof RootStackParamList => {
    const currentPov = actorRole;
    switch (key) {
      case 'Schedule':
        return DOCK_ROUTE_FOR_POV[currentPov].Schedule;

      case 'Attendance':
        return DOCK_ROUTE_FOR_POV[currentPov].Attendance;

      case 'Home':
        return 'Home';

      case 'Profile':
        return 'Profile';

      default:
        return key as keyof RootStackParamList;
    }
  };

  const onTabPress = (key: string) => {
    setActiveKey(key);

    const route = resolveRoute(key);

    navigation.reset({ index: 0, routes: [{ name: route }] });
  };

  // When unauthenticated or loading, show auth stack (Landing → Login/Register)
  if (authStatus === 'unauthenticated' || authStatus === 'loading') {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Landing" component={LandingScreen} />
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Register" component={RegisterScreen} />
        <AuthStack.Screen
          name="RoleSelection"
          component={RoleSelectionScreen}
        />
      </AuthStack.Navigator>
    );
  }

  // When authenticated but role not yet selected (Google first-time login),
  // show RoleSelectionScreen before entering the app.
  if (needsRoleSelection) {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen
          name="RoleSelection"
          component={RoleSelectionScreen}
        />
      </AuthStack.Navigator>
    );
  }

  return (
    <AssistantSessionsProvider enabled={user?.role === 'assistant'}>
      <StudentAttendanceProvider enabled={user?.role === 'student'}>
        <LeaveProvider db={db} user={user}>
          <View style={styles.root}>
            <Stack.Navigator
              initialRouteName="Home"

              screenOptions={({ route }) => ({
                headerStyle: { backgroundColor: colors.panel },

                headerTintColor: colors.violet,

                headerShadowVisible: false,

                headerBackButtonDisplayMode: 'minimal',

                contentStyle: { backgroundColor: colors.surface },

                headerRight: () => (
                  <Pressable
                    accessibilityRole="button"

                    accessibilityLabel="Buka profil"

                    onPress={() => navigation.navigate('Profile')}

                    style={({ pressed }) => [
                      styles.changeRole,

                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.changeRoleLabel}>Profil</Text>
                  </Pressable>
                ),
              })}
            >
              <Stack.Screen
                name="Home"

                component={HomeScreen}

                options={{
                  title: 'Beranda',

                  headerRight: () => null,

                  headerBackTitle: '',

                  headerShown: false,
                }}
              />

              <Stack.Group screenOptions={{ title: 'Praktikan' }}>
                <Stack.Screen
                  name="StudentSchedule"

                  component={StudentScheduleScreen}

                  options={{ headerShown: false }}
                />

                <Stack.Screen
                  name="StudentSessionDetail"

                  component={StudentSessionDetailScreen}

                  options={{ headerShown: false }}
                />

                <Stack.Screen
                  name="StudentAttendanceHistory"

                  component={StudentAttendanceHistoryScreen}

                  options={{ headerShown: false }}
                />

                <Stack.Screen
                  name="StudentAllSessions"

                  component={StudentAllSessionsScreen}

                  options={{ headerShown: false }}
                />

                <Stack.Screen
                  name="StudentAllAttendance"

                  component={StudentAllAttendanceScreen}

                  options={{ headerShown: false }}
                />

                <Stack.Screen
                  name="StudentLeaveRequestForm"

                  component={StudentLeaveRequestFormScreen}

                  options={{ headerShown: false }}
                />

                <Stack.Screen
                  name="StudentLeaveList"

                  component={StudentLeaveListScreen}

                  options={{ headerShown: false }}
                />
              </Stack.Group>

              <Stack.Group screenOptions={{ headerShown: false }}>
                <Stack.Screen
                  name="AssistantSchedule"

                  component={AssistantScheduleScreen}

                  options={{ headerShown: false }}
                />

                <Stack.Screen
                  name="AssistantSessionDetail"

                  component={AssistantSessionDetailScreen}
                />

                <Stack.Screen
                  name="AssistantAttendanceRoster"

                  component={AssistantAttendanceRosterScreen}

                  options={{ headerShown: false }}
                />

                <Stack.Screen
                  name="AssistantAllSessions"

                  component={AssistantAllSessionsScreen}
                />

                <Stack.Screen
                  name="AssistantAllAttendance"

                  component={AssistantAllAttendanceScreen}
                />

                <Stack.Screen
                  name="AssistantClassList"

                  component={AssistantClassListScreen}
                />

                <Stack.Screen
                  name="AssistantClassForm"

                  component={AssistantClassFormScreen}
                />

                <Stack.Screen
                  name="AssistantSessionForm"

                  component={AssistantSessionFormScreen}
                />

                <Stack.Screen
                  name="AssistantLeaveReviewList"

                  component={AssistantLeaveReviewListScreen}

                  options={{ headerShown: false }}
                />
              </Stack.Group>

              <Stack.Screen
                name="Calendar"

                component={CalendarScreen}

                options={{ headerShown: false }}
              />

              <Stack.Screen
                name="Profile"

                component={ProfileScreen}

                options={{ headerShown: false }}
              />

              <Stack.Screen
                name="ProfileEdit"

                component={ProfileEditScreen}

                options={{ headerShown: false }}
              />
            </Stack.Navigator>

            <BottomDock
              tabs={DOCK_TABS}

              activeKey={activeKey}

              onTabPress={onTabPress}

              fab={{
                glyph: 'document-text',

                label: 'Izin',

                onPress: () => {
                  // Izin bukan tab dock: kosongkan key agar tab lama tidak menyala.
                  setActiveKey('');
                  navigation.navigate(
                    actorRole === 'asisten'
                      ? 'AssistantLeaveReviewList'
                      : 'StudentLeaveList',
                  );
                },
              }}
            />
          </View>
        </LeaveProvider>
      </StudentAttendanceProvider>
    </AssistantSessionsProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },

  changeRole: {
    minHeight: 44,

    paddingHorizontal: 8,

    justifyContent: 'center',

    borderRadius: 8,
  },

  pressed: { backgroundColor: colors.lavenderSubtle },

  changeRoleLabel: {
    ...typography.label,

    color: colors.violet,
  },
});
