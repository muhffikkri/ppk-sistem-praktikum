import { useNavigation } from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';



import { useEffect, useMemo, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

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
  AssistantSessionQrScreen,
} from '../features/assistant';

import {
  StudentAllAttendanceScreen,
  StudentAllSessionsScreen,
  StudentAttendanceHistoryScreen,
  StudentScheduleScreen,
  StudentSessionDetailScreen,
} from '../features/student';

import {
  BarcodeScanScreen,
  StudentCheckInScreen,
} from '../features/checkin';

import {
  AssistantLabFormScreen,
  AssistantLabListScreen,
} from '../features/labs';

import {
  AssistantLeaveReviewListScreen,
  LeaveProvider,
  StudentLeaveListScreen,
  StudentLeaveRequestFormScreen,
} from '../features/leave';

import { LabMapsScreen } from '../features/maps';

import { db } from '../services/firebase';

import { BottomDock, colors, Text, type DockTab } from '../shared/ui';

import { useActorRole, useAuth } from '../state';

import { AssistantSessionsProvider } from '../state/AssistantSessionsContext';
import { StudentAttendanceProvider } from '../state/StudentAttendanceContext';

import { CalendarScreen } from './CalendarScreen';

import { HomeScreen } from './HomeScreen';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from './navigation';

import { NotificationsScreen } from './NotificationsScreen';

import { ProfileEditScreen } from './ProfileEditScreen';

import { ProfileScreen } from './ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// 4 tab dock; FAB Izin berada di tengah.

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

type DockTabKey = 'Home' | 'Schedule' | 'Attendance' | 'Profile';
const DOCK_ORDER: DockTabKey[] = ['Home', 'Schedule', 'Attendance', 'Profile'];

function DockTabsScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'DockTabs'>) {
  const actorRole = useActorRole();
  const { width } = useWindowDimensions();
  const activeTab = (route.params?.tab as DockTabKey | undefined) ?? 'Home';
  const activeIndex = Math.max(0, DOCK_ORDER.indexOf(activeTab));
  const [translateX] = useState(() => new Animated.Value(-activeIndex * width));
  const drag = useMemo(() => ({ x: 0 }), []);

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: -activeIndex * width,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  }, [activeIndex, translateX, width]);

  const panHandlers = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.1,
        onPanResponderGrant: () => {
          translateX.stopAnimation((v) => {
            drag.x = v;
          });
        },
        onPanResponderMove: (_, g) => {
          const min = -(DOCK_ORDER.length - 1) * width;
          const next = Math.max(min, Math.min(0, drag.x + g.dx));
          translateX.setValue(next);
        },
        onPanResponderRelease: (_, g) => {
          const threshold = width * 0.18;
          let nextIndex = activeIndex;
          if (g.dx < -threshold && activeIndex < DOCK_ORDER.length - 1) nextIndex = activeIndex + 1;
          if (g.dx > threshold && activeIndex > 0) nextIndex = activeIndex - 1;
          navigation.setParams({ tab: DOCK_ORDER[nextIndex] });
        },
        onPanResponderTerminate: () => navigation.setParams({ tab: DOCK_ORDER[activeIndex] }),
      }).panHandlers,
    [activeIndex, drag, navigation, translateX, width],
  );

  const page = (key: DockTabKey) => {
    const nav = navigation as any;
    const fakeRoute = { key, name: key, params: undefined } as any;
    if (key === 'Home') return <HomeScreen navigation={nav} route={fakeRoute} />;
    if (key === 'Schedule') {
      return actorRole === 'asisten' ? (
        <AssistantScheduleScreen navigation={nav} route={fakeRoute} />
      ) : (
        <StudentScheduleScreen navigation={nav} route={fakeRoute} />
      );
    }
    if (key === 'Attendance') {
      return actorRole === 'asisten' ? (
        <AssistantAllAttendanceScreen navigation={nav} route={fakeRoute} />
      ) : (
        <StudentAttendanceHistoryScreen navigation={nav} route={fakeRoute} />
      );
    }
    return <ProfileScreen navigation={nav} route={fakeRoute} />;
  };

  return (
    <View style={{ flex: 1, overflow: 'hidden' }} {...panHandlers}>
      <Animated.View
        style={{
          flex: 1,
          flexDirection: 'row',
          width: width * DOCK_ORDER.length,
          transform: [{ translateX }],
        }}
      >
        {DOCK_ORDER.map((key) => (
          <View key={key} style={{ width }}>
            {page(key)}
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

export function AppNavigator() {
  const { authStatus, user, logout, needsRoleSelection } = useAuth();
  const actorRole = useActorRole();

  const navigation = useNavigation() as unknown as {
    navigate: (name: string | keyof RootStackParamList) => void;
    reset: (state: {
      index: number;
      routes: { name: string; params?: Record<string, unknown> }[];
    }) => void;
    addListener: (event: 'state', cb: (e: any) => void) => () => void;
    getState: () => { index?: number; routes: { name: string }[] } | undefined;
  };

  const [activeKey, setActiveKey] = useState('Home');

  useEffect(() => {
    const sync = (state: { index?: number; routes: any[] } | undefined) => {
      const route = state?.routes[state.index ?? 0];
      const name = route?.name ?? 'DockTabs';
      if (name === 'DockTabs') {
        const tab = route?.params?.tab;
        if (tab === 'Schedule' || tab === 'Attendance' || tab === 'Profile') return setActiveKey(tab);
        return setActiveKey('Home');
      }
      if (name === 'Home' || name === 'Profile') return setActiveKey(name);
      if (name === DOCK_ROUTE_FOR_POV[actorRole].Schedule) return setActiveKey('Schedule');
      if (name === DOCK_ROUTE_FOR_POV[actorRole].Attendance) return setActiveKey('Attendance');
      // Non-dock route: keep origin tab active until user picks another dock tab.
    };
    sync(navigation.getState?.());
    return navigation.addListener('state', (e) => sync(e.data?.state));
  }, [actorRole, navigation]);

  const onTabPress = (key: string) => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'DockTabs', params: { tab: key as DockTabKey } }],
    });
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
              initialRouteName="DockTabs"

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
                    <Text variant="label" tone="violet">Profil</Text>
                  </Pressable>
                ),
              })}
            >
              <Stack.Screen
                name="DockTabs"
                component={DockTabsScreen}
                options={{ headerShown: false }}
              />

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
                  name="StudentCheckIn"

                  component={StudentCheckInScreen}

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
                  name="AssistantSessionQr"
                  component={AssistantSessionQrScreen}
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

                <Stack.Screen
                  name="AssistantLabList"
                  component={AssistantLabListScreen}
                  options={{ headerShown: false }}
                />

                <Stack.Screen
                  name="AssistantLabForm"
                  component={AssistantLabFormScreen}
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

              <Stack.Screen
                name="Notifications"

                component={NotificationsScreen}

                options={{ headerShown: false }}
              />

              <Stack.Screen
                name="LabMaps"

                component={LabMapsScreen}

                options={{ headerShown: false }}
              />

              <Stack.Screen
                name="BarcodeScan"
                component={BarcodeScanScreen}
                options={{ headerShown: false }}
              />
            </Stack.Navigator>

            <BottomDock
              tabs={DOCK_TABS}

              activeKey={activeKey}

              onTabPress={onTabPress}

              fab={
                // Asisten menampilkan kode presensi, tidak ikut presensi.
                actorRole === 'praktikan'
                  ? {
                      glyph: 'camera',
                      label: 'Scan presensi',
                      onPress: () => {
                        navigation.navigate('BarcodeScan');
                      },
                    }
                  : undefined
              }
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
});
