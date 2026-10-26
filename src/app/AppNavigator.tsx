import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AssistantAttendanceRosterScreen,
  AssistantScheduleScreen,
  AssistantSessionDetailScreen,
} from '../features/assistant';
import {
  StudentAttendanceHistoryScreen,
  StudentScheduleScreen,
  StudentSessionDetailScreen,
} from '../features/student';
import { BottomDock, colors, typography, type DockTab } from '../shared/ui';
import type { RootStackParamList } from './navigation';
import { HomeScreen } from './HomeScreen';
import { ProfileScreen } from './ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// ponytail: dock adapts its middle tab label to the active POV so the
// user always sees a "Beranda" that reflects their current role.
// Replace with a single icon-font icon set when @react-navigation icons land.
const DOCK_TABS: DockTab[] = [
  { key: 'Home', label: 'Beranda', glyph: '◆' },
  { key: 'StudentSchedule', label: 'Jadwal', glyph: '▦' },
  { key: 'StudentAttendanceHistory', label: 'Presensi', glyph: '✦' },
  { key: 'Profile', label: 'Akun', glyph: '◉' },
];

export function AppNavigator() {
  const [activeKey, setActiveKey] = useState<string>('Home');
  const navigation = useNavigation() as unknown as {
    navigate: (name: string | keyof RootStackParamList) => void;
    /** Reset the whole stack to a single top-level route — used by the
     *  bottom dock so it never surfaces a "back" chevron. */
    reset: (state: { index: number; routes: { name: string }[] }) => void;
  };

  const onTabPress = (key: string) => {
    setActiveKey(key);
    // Dock = top-level context. Reset the stack to the pressed tab so any
    // pushed detail routes collapse and no header back button is shown.
    navigation.reset({ index: 0, routes: [{ name: key }] });
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
        </Stack.Group>
        <Stack.Group screenOptions={{ title: 'Asisten · Demo' }}>
          <Stack.Screen
            name="AssistantSchedule"
            component={AssistantScheduleScreen}
          />
          <Stack.Screen
            name="AssistantSessionDetail"
            component={AssistantSessionDetailScreen}
          />
          <Stack.Screen
            name="AssistantAttendanceRoster"
            component={AssistantAttendanceRosterScreen}
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
