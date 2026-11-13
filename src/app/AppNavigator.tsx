import { useNavigation } from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useState } from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LoginScreen, RegisterScreen, LandingScreen, RoleSelectionScreen } from '../features/auth';
import {
  AssistantAllAttendanceScreen,
  AssistantAllSessionsScreen,
  AssistantAttendanceRosterScreen,
  AssistantClassFormScreen,
  AssistantClassListScreen,
  AssistantModuleListScreen,
  AssistantScheduleScreen,
  AssistantSessionDetailScreen,
  AssistantSessionFormScreen,
  AssistantSettingsScreen,
} from '../features/assistant';

import {
  StudentAllAttendanceScreen,
  StudentAllSessionsScreen,
  StudentAttendanceHistoryScreen,
  StudentScheduleScreen,
  StudentSessionDetailScreen,
} from '../features/student';

import { BottomDock, colors, typography, type DockTab } from '../shared/ui';

import { useActorRole, useAuth } from '../state';

import { AssistantSessionsProvider } from '../state/AssistantSessionsContext';

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

    Attendance: 'AssistantAttendanceRoster',
  },
};

const AuthStack = createNativeStackNavigator<{
  Landing: undefined;
  Login: undefined;
  Register: undefined;
  RoleSelection: undefined;
}>();

export function AppNavigator() {
  const { authStatus, logout, needsRoleSelection } = useAuth();
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

    if (key === 'Attendance' && actorRole === 'asisten') {
      // Attendance roster for asisten requires a sessionId param.
      navigation.reset({
        index: 0,
        routes: [{ name: route, params: { sessionId: 'session-ast-02' } }],
      });
    } else {
      navigation.reset({ index: 0, routes: [{ name: route }] });
    }
  };

  // When unauthenticated or loading, show auth stack (Landing → Login/Register)
  if (authStatus === 'unauthenticated' || authStatus === 'loading') {
    return (
      <AssistantSessionsProvider>
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Landing" component={LandingScreen} />
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Register" component={RegisterScreen} />
          <AuthStack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        </AuthStack.Navigator>
      </AssistantSessionsProvider>
    );
  }

  // When authenticated but role not yet selected (Google first-time login),
  // show RoleSelectionScreen before entering the app.
  if (needsRoleSelection) {
    return (
      <AssistantSessionsProvider>
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        </AuthStack.Navigator>
      </AssistantSessionsProvider>
    );
  }

  return (
    <AssistantSessionsProvider>
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
            />

            <Stack.Screen
              name="StudentAttendanceHistory"

              component={StudentAttendanceHistoryScreen}

              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="StudentAllSessions"

              component={StudentAllSessionsScreen}
            />

            <Stack.Screen
              name="StudentAllAttendance"

              component={StudentAllAttendanceScreen}
            />
          </Stack.Group>

          <Stack.Group screenOptions={{ title: 'Asisten' }}>
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
              name="AssistantModuleList"

              component={AssistantModuleListScreen}
            />

            <Stack.Screen
              name="AssistantSettings"

              component={AssistantSettingsScreen}
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
          </Stack.Group>

          <Stack.Screen
            name="Calendar"

            component={CalendarScreen}

            options={{
              headerTintColor: colors.inkMuted,

              headerStyle: { backgroundColor: colors.surface },

              title: 'Kalender',
            }}
          />

          <Stack.Screen
            name="Profile"

            component={ProfileScreen}

            options={{
              headerRight: () => null,

              headerTintColor: colors.inkMuted,

              headerStyle: { backgroundColor: colors.surface },
            }}
          />

          <Stack.Screen
            name="ProfileEdit"

            component={ProfileEditScreen}

            options={{
              headerTintColor: colors.inkMuted,

              headerStyle: { backgroundColor: colors.surface },

              title: 'Edit Profil',
            }}
          />
        </Stack.Navigator>

        <BottomDock
          tabs={DOCK_TABS}

          activeKey={activeKey}

          onTabPress={onTabPress}

          fab={{
            glyph: 'scan',

            label: 'Scan QR',

            onPress: () => {
              // ponytail: QR scanner screen not yet implemented; no-op.
              // Replace with camera-scan navigation when that screen lands.
            },
          }}
        />
      </View>
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