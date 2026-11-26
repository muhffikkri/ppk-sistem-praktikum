import Ionicons from '@expo/vector-icons/Ionicons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import type { Session } from '../../domain/types';
import { studentIdentityMeta } from '../../domain/sessionRecapRules';
import { colors, radius, spacing } from '../../theme/tokens';
import {
  Avatar,
  Banner,
  Button,
  Card,
  CardContent,
  ConfirmSheet,
  EmptyState,
  ErrorState,
  Header,
  LoadingState,
  Screen,
  SectionHeader,
  StatCard,
  StatRow,
  StatusBadge,
  Text,
  type BadgeTone,
  type IconName,
} from '../../shared/ui';
import { formatWeekdayDayMonth } from '../../shared/format/date';
import { useTransientFeedback } from '../../shared/navigation/useTransientFeedback';
import { useAssistantSessionsViewModel, useAuth } from '../../state';
import { AttendanceRecordCard } from '../attendance/AttendanceRecordCard';
import { useAssistantLeaveViewModel } from '../leave';
import { RootTopBar } from '../shell/RootTopBar';
import { formatClock, formatTimeRange } from '../student/formatters';
import {
  sessionStatusLabel,
  sessionStatusTone,
} from './components/AssistantSessionCard';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;
type QuickTone = 'violet' | 'blue' | 'lime' | 'pink' | 'neutral';

const RECENT_LIMIT = 5;

const QUICK_TONE: Record<QuickTone, { bg: string; fg: string }> = {
  violet: { bg: colors.lavenderSubtle, fg: colors.violet },
  blue: { bg: colors.blueSoft, fg: colors.blue },
  lime: { bg: colors.lime, fg: colors.ink },
  pink: { bg: colors.pink, fg: colors.pinkInk },
  neutral: { bg: colors.surface, fg: colors.inkMuted },
};

function QuickAction({
  icon,
  label,
  tone,
  onPress,
}: {
  icon: IconName;
  label: string;
  tone: QuickTone;
  onPress: () => void;
}) {
  const t = QUICK_TONE[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickItem,
        pressed && styles.quickItemPressed,
      ]}
    >
      <View style={[styles.quickIcon, { backgroundColor: t.bg }]}>
        <Ionicons name={icon} size={20} color={t.fg} />
      </View>
      <Text variant="captionStrong" numberOfLines={1} style={styles.quickLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

function TodaySessionCard({
  session,
  onPress,
}: {
  session: Session;
  onPress: () => void;
}) {
  const isActive = session.status === 'open';
  const tone: BadgeTone = isActive
    ? 'violet'
    : sessionStatusTone[session.status];
  return (
    <Card
      onPress={onPress}
      accessibilityHint="Membuka detail sesi"
      style={[styles.scheduleCard, isActive && styles.scheduleCardActive]}
    >
      {isActive ? (
        <View
          accessible={false}
          style={styles.scheduleAccent}
          importantForAccessibility="no"
        />
      ) : null}
      <View style={styles.scheduleText}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {`${formatTimeRange(session.startsAt, session.endsAt)} · ${session.courseName}`}
        </Text>
        <Text
          variant="caption"
          tone={isActive ? 'violet' : 'muted'}
          numberOfLines={1}
        >
          {[session.groupName, session.title, session.lab]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
      <StatusBadge
        label={isActive ? 'Berlangsung' : sessionStatusLabel[session.status]}
        tone={tone}
      />
    </Card>
  );
}

export function AssistantHome({ navigation }: { navigation: Nav }) {
  const { user } = useAuth();
  const vm = useAssistantSessionsViewModel();
  const leave = useAssistantLeaveViewModel();
  const [confirmClose, setConfirmClose] = useState(false);
  const [busy, setBusy] = useState(false);
  const { feedback, showFeedback, clearFeedback } = useTransientFeedback();

  const topBar = <RootTopBar />;

  if (vm.loading) {
    return (
      <Screen>
        {topBar}
        <LoadingState label="Memuat sesi…" />
      </Screen>
    );
  }
  if (vm.error) {
    return (
      <Screen>
        {topBar}
        <ErrorState
          title="Gagal memuat sesi"
          message={vm.error}
          onRetry={vm.retry}
        />
      </Screen>
    );
  }

  const today = new Date();
  const isSameDay = (iso: string) => {
    const d = new Date(iso);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  };
  const todaySessions = vm.sessions.filter((s) => isSameDay(s.startsAt));
  const todayLabel = formatWeekdayDayMonth(today);

  const byStart = [...vm.sessions].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
  const active =
    todaySessions.find((s) => s.status === 'open') ??
    byStart.find((s) => s.status === 'open') ??
    byStart.find((s) => s.status === 'scheduled');

  const pending = leave.leaveRequests.filter((r) => r.status === 'pending');
  const records = active ? vm.getAttendanceForSession(active.id) : [];
  const participants = active
    ? (active.participantIds ??
      vm.getClassById(active.classId ?? '')?.participantIds ??
      [])
    : [];
  const absent = Math.max(0, participants.length - records.length);
  const pendingHere = active
    ? pending.filter((r) => r.sessionId === active.id).length
    : 0;
  const recent = [...records]
    .sort(
      (a, b) =>
        new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime(),
    )
    .slice(0, RECENT_LIMIT);

  const run = async (kind: 'open' | 'close') => {
    if (!active || busy) return;
    setBusy(true);
    const result =
      kind === 'open'
        ? await vm.openSession(active.id)
        : await vm.closeSession(active.id);
    setBusy(false);
    setConfirmClose(false);
    showFeedback(
      result.ok
        ? {
            tone: 'success',
            title: kind === 'open' ? 'Sesi dibuka' : 'Sesi ditutup',
            message: active.courseName,
          }
        : { tone: 'danger', title: 'Aksi gagal', message: result.message },
    );
  };

  const quickActions = [
    {
      key: 'map',
      icon: 'map-outline' as const,
      label: 'Peta Lab',
      tone: 'violet' as const,
      onPress: () => navigation.navigate('LabMaps'),
    },
    {
      key: 'class',
      icon: 'people-outline' as const,
      label: 'Kelola Kelas',
      tone: 'blue' as const,
      onPress: () => navigation.navigate('AssistantClassList'),
    },
    {
      key: 'new',
      icon: 'add-circle-outline' as const,
      label: 'Buat Sesi',
      tone: 'lime' as const,
      onPress: () => navigation.navigate('AssistantSessionForm', {}),
    },
    {
      key: 'leave',
      icon: 'clipboard-outline' as const,
      label: 'Periksa Izin',
      tone: 'pink' as const,
      onPress: () => navigation.navigate('AssistantLeaveReviewList'),
    },
    {
      key: 'all',
      icon: 'time-outline' as const,
      label: 'Semua Sesi',
      tone: 'neutral' as const,
      onPress: () => navigation.navigate('AssistantAllSessions'),
    },
  ];

  return (
    <Screen>
      {topBar}
      <View style={styles.feed}>
        <Header
          eyebrow={todayLabel}
          title={user?.displayName?.trim() || 'Asisten'}
          trailing={<StatusBadge label="Asisten Praktikum" tone="lavender" />}
        />

        {feedback ? (
          <Banner
            tone={feedback.tone}
            title={feedback.title}
            message={feedback.message}
            onDismiss={clearFeedback}
          />
        ) : null}

        {active ? (
          <Card variant="heroInk" interactive={false}>
            <CardContent>
              <View style={styles.heroTopRow}>
                <StatusBadge
                  label={
                    active.status === 'open'
                      ? 'Sesi berlangsung'
                      : 'Sesi berikutnya'
                  }
                  tone={active.status === 'open' ? 'violet' : 'lavender'}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Kelola sesi"
                  hitSlop={8}
                  onPress={() =>
                    navigation.navigate('AssistantSessionDetail', {
                      sessionId: active.id,
                    })
                  }
                  style={styles.heroSettings}
                >
                  <Ionicons
                    name="settings-outline"
                    size={18}
                    color={colors.onInkMuted}
                  />
                </Pressable>
              </View>
              <Text variant="subtitle" tone="onDark">
                {active.courseName}
              </Text>
              <Text variant="caption" tone="onDarkMuted">
                {`${active.groupName} · ${formatTimeRange(active.startsAt, active.endsAt)}${active.lab ? ` · ${active.lab}` : ''}`}
              </Text>
              <StatCard
                variant="ink"
                value={records.length}
                suffix={`/ ${participants.length}`}
                label="Praktikan hadir"
              />
              <StatRow>
                <StatCard
                  variant="panel"
                  value={pendingHere}
                  label="Izin menunggu"
                />
                <StatCard variant="panel" value={absent} label="Belum hadir" />
              </StatRow>
              <Button
                label={
                  active.status === 'scheduled' ? 'Buka sesi' : 'Tutup sesi'
                }
                variant="outline"
                icon="chevron-forward-outline"
                loading={busy}
                onPress={() =>
                  active.status === 'scheduled'
                    ? run('open')
                    : setConfirmClose(true)
                }
              />
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon="calendar-outline"
            title="Belum ada sesi"
            description="Buat sesi praktikum dari kelas yang kamu kelola."
            action={
              <Button
                label="Buat sesi"
                variant="primary"
                onPress={() => navigation.navigate('AssistantSessionForm', {})}
              />
            }
          />
        )}

        <View style={styles.section}>
          <View style={styles.headerRow}>
            <Text variant="bodyStrong">Pintasan Cepat</Text>
            <Text variant="caption" tone="violet">
              {`${quickActions.length} menu aktif`}
            </Text>
          </View>
          <Card variant="panel" interactive={false} style={styles.quickGrid}>
            {quickActions.map(({ key, ...action }) => (
              <QuickAction key={key} {...action} />
            ))}
          </Card>
        </View>

        {todaySessions.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title="Jadwal hari ini"
              actionLabel="Lihat semua"
              onAction={() => navigation.navigate('AssistantAllSessions')}
            />
            {todaySessions.map((session) => (
              <TodaySessionCard
                key={session.id}
                session={session}
                onPress={() =>
                  navigation.navigate('AssistantSessionDetail', {
                    sessionId: session.id,
                  })
                }
              />
            ))}
          </View>
        ) : null}

        {recent.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title="Kehadiran terbaru"
              actionLabel="Lihat semua"
              onAction={() => navigation.navigate('AssistantAllAttendance')}
            />
            {recent.map((record) => (
              <AttendanceRecordCard
                key={record.id}
                leading={<Avatar name={record.studentName} tone="lime" />}
                title={record.studentName}
                meta={studentIdentityMeta(record) || 'Praktikan'}
                status={{ label: 'Hadir', tone: 'success' }}
                time={formatClock(record.checkedInAt)}
                timeLabel="Hadir"
              />
            ))}
          </View>
        ) : null}

        <ConfirmSheet
          visible={confirmClose}
          title="Tutup sesi?"
          description="Praktikan tidak bisa presensi lagi setelah sesi ditutup."
          confirmLabel="Tutup sesi"
          tone="danger"
          loading={busy}
          onConfirm={() => run('close')}
          onCancel={() => setConfirmClose(false)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  feed: { gap: spacing.xl },
  section: { gap: spacing.sm },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  heroSettings: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.onInkSubtle,
  },

  quickGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    gap: spacing.xs,
  },
  quickItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
  },
  quickItemPressed: { opacity: 0.6 },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { textAlign: 'center' },

  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  scheduleCardActive: {
    borderColor: colors.lavender,
    borderWidth: 1,
    paddingLeft: spacing.lg,
  },
  scheduleAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.violet,
  },
  scheduleText: { flex: 1, gap: spacing.xs, minWidth: 0 },
});
