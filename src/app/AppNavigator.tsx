import { StackActions, useNavigation } from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';



import { memo, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from 'react-native-pager-view';

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

import {
  type ActorRole,
  NotificationInboxProvider,
  useActorRole,
  useAuth,
} from '../state';

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

function neighbourTabs(index: number): Set<DockTabKey> {
  return new Set(
    [index - 1, index, index + 1]
      .filter((i) => i >= 0 && i < DOCK_ORDER.length)
      .map((i) => DOCK_ORDER[i]),
  );
}

// Tab pages are rendered inside DockTabs rather than as their own routes, so
// they get a fixed stand-in route. Module-level objects keep the props
// referentially stable across DockTabs re-renders.
const DOCK_PAGE_ROUTES = Object.fromEntries(
  DOCK_ORDER.map((key) => [key, { key, name: key, params: undefined }]),
) as Record<DockTabKey, { key: string; name: string; params: undefined }>;

type DockPageProps = {
  tab: DockTabKey;
  role: ActorRole;
  navigation: NativeStackScreenProps<RootStackParamList, 'DockTabs'>['navigation'];
};

// Memoized so a tab change (a `setParams` on DockTabs) does not re-render
// every mounted page.
const DockPage = memo(function DockPage({ tab, role, navigation }: DockPageProps) {
  const nav = navigation as any;
  const route = DOCK_PAGE_ROUTES[tab] as any;
  if (tab === 'Home') return <HomeScreen navigation={nav} route={route} />;
  if (tab === 'Schedule') {
    return role === 'asisten' ? (
      <AssistantScheduleScreen navigation={nav} route={route} />
    ) : (
      <StudentScheduleScreen navigation={nav} route={route} />
    );
  }
  if (tab === 'Attendance') {
    return role === 'asisten' ? (
      <AssistantAllAttendanceScreen navigation={nav} route={route} />
    ) : (
      <StudentAttendanceHistoryScreen navigation={nav} route={route} />
    );
  }
  return <ProfileScreen navigation={nav} route={route} />;
});

function DockTabsScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'DockTabs'>) {
  const actorRole = useActorRole();
  const activeTab = (route.params?.tab as DockTabKey | undefined) ?? 'Home';
  const activeIndex = Math.max(0, DOCK_ORDER.indexOf(activeTab));
  const pagerRef = useRef<PagerView>(null);
  // Page the native pager is showing; lets us skip redundant setPage calls.
  const pagerPosition = useRef(activeIndex);

  // Mount a page on first visit (plus its neighbours, so a swipe never
  // reveals a blank page) and keep it mounted afterwards to preserve scroll.
  const [mounted, setMounted] = useState<ReadonlySet<DockTabKey>>(() =>
    neighbourTabs(activeIndex),
  );
  const wanted = neighbourTabs(activeIndex);
  if ([...wanted].some((tab) => !mounted.has(tab))) {
    setMounted(new Set([...mounted, ...wanted]));
  }

  // Dock taps change the `tab` param; move the pager to match.
  useEffect(() => {
    if (pagerPosition.current !== activeIndex) {
      pagerPosition.current = activeIndex;
      pagerRef.current?.setPage(activeIndex);
    }
  }, [activeIndex]);

  // Swipes settle natively; mirror the page back into the route param so
  // the BottomDock highlight follows.
  const onPageSelected = (e: PagerViewOnPageSelectedEvent) => {
    const position = e.nativeEvent.position;
    pagerPosition.current = position;
    const tab = DOCK_ORDER[position];
    if (tab && tab !== activeTab) navigation.setParams({ tab });
  };

  return (
    <PagerView
      ref={pagerRef}
      style={styles.pager}
      initialPage={activeIndex}
      onPageSelected={onPageSelected}
    >
      {DOCK_ORDER.map((key) => (
        <View key={key} style={styles.page} collapsable={false}>
          {mounted.has(key) ? (
            <DockPage tab={key} role={actorRole} navigation={navigation} />
          ) : null}
        </View>
      ))}
    </PagerView>
  );
}

export function AppNavigator() {
  const { authStatus, user, logout, needsRoleSelection } = useAuth();
  const actorRole = useActorRole();

  const navigation = useNavigation() as unknown as {
    navigate: (name: string | keyof RootStackParamList) => void;
    dispatch: (action: ReturnType<typeof StackActions.popTo>) => void;
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

  // Pop back to the existing DockTabs route and merge the tab param so the
  // tab pages stay mounted. A reset would mint a new route key and remount
  // every tab page on each tap.
  const onTabPress = (key: string) => {
    navigation.dispatch(
      StackActions.popTo('DockTabs', { tab: key as DockTabKey }, { merge: true }),
    );
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
          <NotificationInboxProvider>
          <View style={styles.root}>
            <Stack.Navigator
              initialRouteName="DockTabs"

              screenOptions={({ route }) => ({
                headerStyle: { backgroundColor: colors.panel },

                headerTintColor: colors.violet,

                headerShadowVisible: false,

                headerBackButtonDisplayMode: 'minimal',

                contentStyle: { backgroundColor: colors.surface },

                // Screens covered by a pushed screen skip re-renders until
                // they are focused again.
                freezeOnBlur: true,

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
          </NotificationInboxProvider>
        </LeaveProvider>
      </StudentAttendanceProvider>
    </AssistantSessionsProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },

  pager: { flex: 1 },

  page: { flex: 1 },

  changeRole: {
    minHeight: 44,

    paddingHorizontal: 8,

    justifyContent: 'center',

    borderRadius: 8,
  },

  pressed: { backgroundColor: colors.lavenderSubtle },
});
