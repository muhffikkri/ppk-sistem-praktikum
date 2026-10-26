import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AssistantAllAttendanceScreen,
  AssistantAllSessionsScreen,
  AssistantAttendanceRosterScreen,
  AssistantModuleListScreen,
  AssistantScheduleScreen,
  AssistantSessionDetailScreen,
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
import { usePov } from '../state';
import type { RootStackParamList } from './navigation';
import { HomeScreen } from './HomeScreen';
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

export function AppNavigator() {
  const { pov } = usePov();
  const [activeKey, setActiveKey] = useState<string>('Home');
  const navigation = useNavigation() as unknown as {
    navigate: (name: string | keyof RootStackParamList) => void;
    /** Reset the whole stack to a single top-level route — used by the
     *  bottom dock so it never surfaces a "back" chevron. */
    reset: (state: {
      index: number;
      routes: { name: string; params?: Record<string, unknown> }[];
    }) => void;
  };

  // Resolve the stable dock keys to the route matching the active POV.
  const resolveRoute = (key: string): keyof RootStackParamList => {
    switch (key) {
      case 'Schedule':
        return DOCK_ROUTE_FOR_POV[pov].Schedule;
      case 'Attendance':
        // Assistant roster needs a sessionId; pass the first open session
        // so the screen renders. ponytail: use 'session-ast-01' when no
        // session is open — replace with real selector when that lands.
        return DOCK_ROUTE_FOR_POV[pov].Attendance;
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
    if (key === 'Attendance' && pov === 'asisten') {
      // Attendance roster for asisten requires a sessionId param.
      navigation.reset({
        index: 0,
        routes: [{ name: route, params: { sessionId: 'session-ast-02' } }],
      });
    } else {
      navigation.reset({ index: 0, routes: [{ name: route }] });
    }
  };

  useEffect(() => {
    // No-op placeholder reserved for active-route sync hooks.
  }, [activeKey]);

  return (
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
        <Stack.Group screenOptions={{ title: 'Praktikan · Demo' }}>
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
        <Stack.Group screenOptions={{ title: 'Asisten · Demo' }}>
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
        </Stack.Group>
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            headerRight: () => null,
            headerTintColor: colors.inkMuted,
            headerStyle: { backgroundColor: colors.surface },
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
