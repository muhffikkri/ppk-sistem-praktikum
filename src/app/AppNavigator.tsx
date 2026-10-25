import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AssistantAttendanceRosterScreen,
  AssistantDashboardScreen,
  AssistantScheduleScreen,
  AssistantSessionDetailScreen,
} from '../features/assistant';
import { BottomDock, colors, typography, type DockTab } from '../shared/ui';
import type { RootStackParamList } from './navigation';
import { PlaceholderScreen } from './placeholders/PlaceholderScreen';
import { ProfileScreen } from './ProfileScreen';
import { RoleSelectScreen } from './RoleSelectScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const DOCK_TABS: DockTab[] = [
  { key: 'RoleSelect', label: 'Beranda', glyph: '◆' },
  { key: 'StudentSchedule', label: 'Jadwal', glyph: '▦' },
  { key: 'StudentAttendanceHistory', label: 'Presensi', glyph: '✦' },
  { key: 'Profile', label: 'Akun', glyph: '◉' },
];

export function AppNavigator() {
  const [activeKey, setActiveKey] = useState<string>('RoleSelect');
  const navigation = useNavigation() as unknown as {
    navigate: (name: string | keyof RootStackParamList) => void;
  };

  // Keep the dock in sync with the current route so the highlight follows
  // navigation (not just direct taps on the dock).
  const onTabPress = (key: string) => {
    setActiveKey(key);
    navigation.navigate(key);
  };

  useEffect(() => {
    // No-op placeholder reserved for active-route sync hooks.
  }, [activeKey]);

  return (
    <View style={styles.root}>
      <Stack.Navigator
        initialRouteName="RoleSelect"
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
          name="RoleSelect"
          component={RoleSelectScreen}
          options={{ title: 'PPK Mobile', headerRight: () => null }}
        />
        <Stack.Group screenOptions={{ title: 'Praktikan · Demo' }}>
          <Stack.Screen name="StudentSchedule" component={PlaceholderScreen} />
          <Stack.Screen
            name="StudentSessionDetail"
            component={PlaceholderScreen}
          />
          <Stack.Screen
            name="StudentAttendanceHistory"
            component={PlaceholderScreen}
          />
        </Stack.Group>
        <Stack.Group screenOptions={{ title: 'Asisten · Demo' }}>
          <Stack.Screen
            name="AssistantDashboard"
            component={AssistantDashboardScreen}
          />
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
