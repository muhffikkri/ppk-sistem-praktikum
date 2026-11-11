import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { UserProfile, UserRole } from '../domain/types';
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
import { LoginScreen, RegisterScreen } from '../features/auth';
import {
  StudentAllAttendanceScreen,
  StudentAllSessionsScreen,
  StudentAttendanceHistoryScreen,
  StudentScheduleScreen,
  StudentSessionDetailScreen,
} from '../features/student';
import {
  Banner,
  BottomDock,
  colors,
  spacing,
  typography,
  type DockTab,
} from '../shared/ui';
import { useAuth } from '../state';
import {
  AssistantSessionsProvider,
  useAssistantSessionsV2,
} from '../state/AssistantSessionsContext';
import type { AuthStackParamList, RootStackParamList } from './navigation';
import { CalendarScreen } from './CalendarScreen';
import { HomeScreen } from './HomeScreen';
import { ProfileEditScreen } from './ProfileEditScreen';
import { ProfileScreen } from './ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const DOCK_TABS: DockTab[] = [
  { key: 'Home', label: 'Beranda', glyph: 'grid' },
  { key: 'Schedule', label: 'Jadwal', glyph: 'calendar' },
  { key: 'Attendance', label: 'Presensi', glyph: 'finger-print' },
  { key: 'Profile', label: 'Akun', glyph: 'person' },
];

const DOCK_ROUTE_FOR_ROLE: Record<
  UserRole,
  { Schedule: keyof RootStackParamList; Attendance: keyof RootStackParamList }
> = {
  student: {
    Schedule: 'StudentSchedule',
    Attendance: 'StudentAttendanceHistory',
  },
  assistant: {
    Schedule: 'AssistantSchedule',
    Attendance: 'AssistantAllAttendance',
  },
};

function AuthLoadingView() {
  return (
    <View style={styles.loadingRoot}>
      <ActivityIndicator size="large" color={colors.violet} />
      <Text style={styles.loadingText}>Memuat sesi akun...</Text>
    </View>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.violet,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.surface },
      }}
    >
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Daftar Akun' }}
      />
    </AuthStack.Navigator>
  );
}

function AuthenticatedNavigator({ user }: { user: UserProfile }) {
  const { error, clearError } = useAuth();
  const { sessions: assistantSessions } = useAssistantSessionsV2();
  const [activeKey, setActiveKey] = useState<string>('Home');
  const navigation = useNavigation() as unknown as {
    navigate: (name: string | keyof RootStackParamList) => void;
    reset: (state: {
      index: number;
      routes: { name: string; params?: Record<string, unknown> }[];
    }) => void;
  };

  const isAssistant = user.role === 'assistant';

  const resolveRoute = (key: string): keyof RootStackParamList => {
    switch (key) {
      case 'Schedule':
        return DOCK_ROUTE_FOR_ROLE[user.role].Schedule;
      case 'Attendance':
        return DOCK_ROUTE_FOR_ROLE[user.role].Attendance;
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
    if (key === 'Attendance' && isAssistant) {
      const targetSession =
        assistantSessions.find((s) => s.status === 'open') ??
        assistantSessions[0];
      if (targetSession) {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'AssistantAttendanceRoster',
              params: { sessionId: targetSession.id },
            },
          ],
        });
        return;
      }
    }
    navigation.reset({ index: 0, routes: [{ name: route }] });
  };

  return (
    <View style={styles.root}>
      {error ? (
        <View style={styles.shellBanner}>
          <Banner
            title="Gangguan akun"
            message={error}
            tone="danger"
            onDismiss={clearError}
          />
        </View>
      ) : null}

      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
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
                styles.profileShortcut,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.profileShortcutLabel}>Profil</Text>
            </Pressable>
          ),
        }}
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

        {user.role === 'student' ? (
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
        ) : (
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
              name="AssistantClassList"
              component={AssistantClassListScreen}
              options={{ title: 'Kelola Kelas' }}
            />
            <Stack.Screen
              name="AssistantClassForm"
              component={AssistantClassFormScreen}
              options={{ title: 'Form Kelas' }}
            />
            <Stack.Screen
              name="AssistantSessionForm"
              component={AssistantSessionFormScreen}
              options={{ title: 'Form Sesi' }}
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
        )}

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
      />
    </View>
  </AssistantSessionsProvider>
  );
}

export function AppNavigator() {
  const { authStatus, user } = useAuth();

  if (authStatus === 'loading') {
    return <AuthLoadingView />;
  }

  if (authStatus === 'unauthenticated' || !user) {
    return <AuthNavigator />;
  }

  return (
    <AssistantSessionsProvider>
      <AuthenticatedNavigator key={user.uid} user={user} />
    </AssistantSessionsProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  loadingRoot: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.inkMuted,
  },
  shellBanner: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  profileShortcut: {
    minHeight: 44,
    paddingHorizontal: 8,
    justifyContent: 'center',
    borderRadius: 8,
  },
  pressed: { backgroundColor: colors.lavenderSubtle },
  profileShortcutLabel: {
    ...typography.label,
    color: colors.violet,
  },
});
