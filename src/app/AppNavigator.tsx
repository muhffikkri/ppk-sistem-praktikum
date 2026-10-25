import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text } from 'react-native';

import {
  AssistantAttendanceRosterScreen,
  AssistantScheduleScreen,
  AssistantSessionDetailScreen,
} from '../features/assistant';
import { colors, typography } from '../shared/ui';
import type { RootStackParamList } from './navigation';
import { PlaceholderScreen } from './placeholders/PlaceholderScreen';
import { RoleSelectScreen } from './RoleSelectScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="RoleSelect"
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: colors.panel },
        headerTintColor: colors.violet,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.surface },
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ganti mode demo"
            onPress={() => navigation.popToTop()}
            style={({ pressed }) => [
              styles.changeRole,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.changeRoleLabel}>Ganti mode</Text>
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
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
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
