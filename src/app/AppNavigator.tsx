import { StackActions, useNavigation } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackNavigationOptions,
  type NativeStackNavigationProp,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { memo, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from 'react-native-pager-view';

import {
  LandingScreen,
  LoginScreen,
  RegisterScreen,
  RoleSelectionScreen,
} from '../features/auth';
import { AssistantAllAttendanceScreen } from '../features/assistant/AssistantAllAttendanceScreen';
import { AssistantAttendanceRosterScreen } from '../features/assistant/AssistantAttendanceRosterScreen';
import { AssistantScheduleScreen } from '../features/assistant/AssistantScheduleScreen';
import { AssistantSessionDetailScreen } from '../features/assistant/AssistantSessionDetailScreen';
import { AssistantSessionQrScreen } from '../features/assistant/AssistantSessionQrScreen';
import { StudentAttendanceHistoryScreen } from '../features/student/StudentAttendanceHistoryScreen';
import { StudentScheduleScreen } from '../features/student/StudentScheduleScreen';
import { StudentSessionDetailScreen } from '../features/student/StudentSessionDetailScreen';
import { LeaveProvider } from '../features/leave/LeaveProvider';

import { canManageLabMaster, isAssistantRole } from '../domain/asprakScope';
import { db } from '../services/firebase';
import { DockTabActiveProvider } from '../shared/navigation/useTransientFeedback';
import { BottomDock, colors, Text, type DockTab } from '../shared/ui';
import {
  type ActorRole,
  NotificationInboxProvider,
  useActorRole,
  useAuth,
} from '../state';
import { AssistantSessionsProvider } from '../state/AssistantSessionsContext';
import { StudentAttendanceProvider } from '../state/StudentAttendanceContext';

import { HomeScreen } from './HomeScreen';
import { lazyScreen } from './lazyScreen';
import type { RootStackParamList } from './navigation';
import { ProfileScreen } from './ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

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

const DOCK_PAGE_ROUTES = Object.fromEntries(
  DOCK_ORDER.map((key) => [key, { key, name: key, params: undefined }]),
) as Record<DockTabKey, { key: string; name: string; params: undefined }>;

type DockPageProps = {
  tab: DockTabKey;
  role: ActorRole;
  navigation: NativeStackScreenProps<
    RootStackParamList,
    'DockTabs'
  >['navigation'];
};

const DockPage = memo(function DockPage({
  tab,
  role,
  navigation,
}: DockPageProps) {
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
  const pagerPosition = useRef(activeIndex);

  const [mounted, setMounted] = useState<ReadonlySet<DockTabKey>>(() =>
    neighbourTabs(activeIndex),
  );
  const wanted = neighbourTabs(activeIndex);
  if ([...wanted].some((tab) => !mounted.has(tab))) {
    setMounted(new Set([...mounted, ...wanted]));
  }

  useEffect(() => {
    if (pagerPosition.current !== activeIndex) {
      pagerPosition.current = activeIndex;
      pagerRef.current?.setPage(activeIndex);
    }
  }, [activeIndex]);

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
            <DockTabActiveProvider active={key === activeTab}>
              <DockPage tab={key} role={actorRole} navigation={navigation} />
            </DockTabActiveProvider>
          ) : null}
        </View>
      ))}
    </PagerView>
  );
}

function ProfileHeaderButton() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Buka profil"
      onPress={() => navigation.navigate('Profile')}
      style={({ pressed }) => [styles.changeRole, pressed && styles.pressed]}
    >
      <Text variant="label" tone="violet">
        Profil
      </Text>
    </Pressable>
  );
}

const renderProfileHeaderButton = () => <ProfileHeaderButton />;

// Dock (Home, Schedule, Attendance, Profile) dan empat layar alur harian
// (detail sesi, QR, rekap kehadiran) sengaja eager agar tidak ada jeda chunk
// saat navigasi. Layar lain tetap dimuat saat pertama dibuka.
const StudentCheckInScreen = lazyScreen<'StudentCheckIn'>(
  () => import('../features/checkin/StudentCheckInScreen'),
  'StudentCheckInScreen',
  'Memuat sesi praktikum…',
);
const StudentAllSessionsScreen = lazyScreen<'StudentAllSessions'>(
  () => import('../features/student/StudentAllSessionsScreen'),
  'StudentAllSessionsScreen',
  'Memuat sesi…',
);
const StudentAllAttendanceScreen = lazyScreen<'StudentAllAttendance'>(
  () => import('../features/student/StudentAllAttendanceScreen'),
  'StudentAllAttendanceScreen',
  'Memuat presensi…',
);
const StudentLeaveRequestFormScreen = lazyScreen<'StudentLeaveRequestForm'>(
  () => import('../features/leave/StudentLeaveRequestFormScreen'),
  'StudentLeaveRequestFormScreen',
  'Memuat formulir izin…',
);
const StudentLeaveListScreen = lazyScreen<'StudentLeaveList'>(
  () => import('../features/leave/StudentLeaveListScreen'),
  'StudentLeaveListScreen',
  'Memuat pengajuan izin…',
);
const StudentFineListScreen = lazyScreen<'StudentFineList'>(
  () => import('../features/fines/StudentFineListScreen'),
  'StudentFineListScreen',
  'Memuat tagihan…',
);
const StudentFineDetailScreen = lazyScreen<'StudentFineDetail'>(
  () => import('../features/fines/StudentFineDetailScreen'),
  'StudentFineDetailScreen',
  'Memuat detail tagihan…',
);
const StudentPaymentHistoryScreen = lazyScreen<'StudentPaymentHistory'>(
  () => import('../features/fines/StudentPaymentHistoryScreen'),
  'StudentPaymentHistoryScreen',
  'Memuat riwayat pembayaran…',
);
const AssistantAllSessionsScreen = lazyScreen<'AssistantAllSessions'>(
  () => import('../features/assistant/AssistantAllSessionsScreen'),
  'AssistantAllSessionsScreen',
  'Memuat sesi…',
);
const AssistantClassListScreen = lazyScreen<'AssistantClassList'>(
  () => import('../features/assistant/AssistantClassListScreen'),
  'AssistantClassListScreen',
  'Memuat kelas…',
);
const AssistantClassFormScreen = lazyScreen<'AssistantClassForm'>(
  () => import('../features/assistant/AssistantClassFormScreen'),
  'AssistantClassFormScreen',
  'Memuat formulir kelas…',
);
const AssistantSessionFormScreen = lazyScreen<'AssistantSessionForm'>(
  () => import('../features/assistant/AssistantSessionFormScreen'),
  'AssistantSessionFormScreen',
  'Memuat formulir sesi…',
);
const AssistantLeaveReviewListScreen = lazyScreen<'AssistantLeaveReviewList'>(
  () => import('../features/leave/AssistantLeaveReviewListScreen'),
  'AssistantLeaveReviewListScreen',
  'Memuat pengajuan izin…',
);
const AssistantLabListScreen = lazyScreen<'AssistantLabList'>(
  () => import('../features/labs/AssistantLabListScreen'),
  'AssistantLabListScreen',
  'Memuat laboratorium…',
);
const AssistantLabFormScreen = lazyScreen<'AssistantLabForm'>(
  () => import('../features/labs/AssistantLabFormScreen'),
  'AssistantLabFormScreen',
  'Memuat laboratorium…',
);
const AslabLabDistributionScreen = lazyScreen<'AslabLabDistribution'>(
  () => import('../features/labs/AslabLabDistributionScreen'),
  'AslabLabDistributionScreen',
  'Memuat laboratorium…',
);
const AslabLabImportScreen = lazyScreen<'AslabLabImport'>(
  () => import('../features/labs/AslabLabImportScreen'),
  'AslabLabImportScreen',
  'Memuat laboratorium…',
);
const CalendarScreen = lazyScreen<'Calendar'>(
  () => import('./CalendarScreen'),
  'CalendarScreen',
  'Memuat kalender…',
);
const ProfileEditScreen = lazyScreen<'ProfileEdit'>(
  () => import('./ProfileEditScreen'),
  'ProfileEditScreen',
  'Memuat profil…',
);
const NotificationsScreen = lazyScreen<'Notifications'>(
  () => import('./NotificationsScreen'),
  'NotificationsScreen',
  'Memuat notifikasi…',
);
const LabMapsScreen = lazyScreen<'LabMaps'>(
  () => import('../features/maps/LabMapsScreen'),
  'LabMapsScreen',
  'Memuat peta laboratorium…',
);
const BarcodeScanScreen = lazyScreen<'BarcodeScan'>(
  () => import('../features/checkin/BarcodeScanScreen'),
  'BarcodeScanScreen',
  'Menyiapkan pemindai…',
);

const STACK_SCREEN_OPTIONS: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.panel },
  headerTintColor: colors.violet,
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal',
  contentStyle: { backgroundColor: colors.surface },
  freezeOnBlur: true,
  headerRight: renderProfileHeaderButton,
};

export function AppNavigator() {
  const { authStatus, user, needsRoleSelection } = useAuth();
  const actorRole = useActorRole();

  const navigation = useNavigation() as unknown as {
    navigate: (name: string | keyof RootStackParamList, params?: any) => void;
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
        if (tab === 'Schedule' || tab === 'Attendance' || tab === 'Profile')
          return setActiveKey(tab);
        return setActiveKey('Home');
      }
      if (name === 'Home' || name === 'Profile') return setActiveKey(name);
      if (name === DOCK_ROUTE_FOR_POV[actorRole].Schedule)
        return setActiveKey('Schedule');
      if (name === DOCK_ROUTE_FOR_POV[actorRole].Attendance)
        return setActiveKey('Attendance');
    };
    sync(navigation.getState?.());
    return navigation.addListener('state', (e) => sync(e.data?.state));
  }, [actorRole, navigation]);

  const onTabPress = (key: string) => {
    navigation.dispatch(
      StackActions.popTo(
        'DockTabs',
        { tab: key as DockTabKey },
        { merge: true },
      ),
    );
  };

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
    <AssistantSessionsProvider enabled={isAssistantRole(user?.role)}>
      <StudentAttendanceProvider enabled={user?.role === 'student'}>
        <LeaveProvider db={db} user={user}>
          <NotificationInboxProvider>
            <View style={styles.root}>
              <View style={styles.content}>
                <Stack.Navigator
                  initialRouteName="DockTabs"
                  screenOptions={STACK_SCREEN_OPTIONS}
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
                    <Stack.Screen
                      name="StudentFineList"
                      component={StudentFineListScreen}
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="StudentFineDetail"
                      component={StudentFineDetailScreen}
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="StudentPaymentHistory"
                      component={StudentPaymentHistoryScreen}
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
                  </Stack.Group>

                  {/* Master lab & distribusi: route hanya ada untuk Aslab (#54). */}
                  {canManageLabMaster(user?.role) ? (
                    <Stack.Group screenOptions={{ headerShown: false }}>
                      <Stack.Screen
                        name="AssistantLabList"
                        component={AssistantLabListScreen}
                      />
                      <Stack.Screen
                        name="AssistantLabForm"
                        component={AssistantLabFormScreen}
                      />
                      <Stack.Screen
                        name="AslabLabDistribution"
                        component={AslabLabDistributionScreen}
                      />
                      <Stack.Screen
                        name="AslabLabImport"
                        component={AslabLabImportScreen}
                      />
                    </Stack.Group>
                  ) : null}

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
              </View>

              <BottomDock
                tabs={DOCK_TABS}
                activeKey={activeKey}
                onTabPress={onTabPress}
                fab={
                  actorRole === 'praktikan'
                    ? {
                        glyph: 'camera',
                        label: 'Scan presensi',
                        onPress: () => {
                          navigation.navigate('BarcodeScan', {
                            fromDock: true,
                          });
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
  content: { flex: 1 },
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
