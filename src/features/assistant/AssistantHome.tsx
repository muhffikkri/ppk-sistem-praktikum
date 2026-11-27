import Ionicons from '@expo/vector-icons/Ionicons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import { openDockTab } from '../../app/openDockTab';
import type { Session } from '../../domain/types';
import { colors, radius, spacing } from '../../theme/tokens';
import {
  Banner,
  Button,
  Card,
  CardContent,
  ConfirmSheet,
  EmptyState,
  ErrorState,
  Header,
  Screen,
  SectionHeader,
  SkeletonList,
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
import { SessionAttendancePreviewCard } from '../attendance/SessionAttendancePreviewCard';
import { buildSessionAttendanceGroup } from '../attendance/sessionAttendanceGroups';
import { useAssistantLeaveViewModel } from '../leave/useAssistantLeaveViewModel';
import { RootTopBar } from '../shell/RootTopBar';
import { formatTimeRange } from '../student/formatters';
import {
  sessionStatusLabel,
  sessionStatusTone,
} from './components/AssistantSessionCard';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;
type QuickTone = 'violet' | 'blue' | 'lime' | 'pink' | 'neutral';

// Beranda hanya cuplikan; daftar lengkapnya ada di halaman Jadwal/Presensi.
const SCHEDULE_PREVIEW_LIMIT = 2;
const ATTENDANCE_PREVIEW_LIMIT = 2;

const QUICK_TONE: Record<QuickTone, { bg: string; fg: string }> = {
  violet: { bg: colors.lavenderSubtle, fg: colors.violet },
  blue: { bg: colors.blueSoft, fg: colors.blue },
  lime: { bg: colors.lime, fg: colors.ink },
  pink: { bg: colors.pink, fg: colors.pinkInk },
  neutral: { bg: colors.surface, fg: colors.inkMuted },
};

/** "A" -> "Kelas A", tanpa menggandakan "Kelas" pada data yang sudah lengkap. */
function classLabel(groupName: string): string {
  const name = groupName.trim();
  if (!name) return 'Belum ditentukan';
  if (/^kelas\b/i.test(name)) return name;
  if (/^kelompok\b/i.test(name)) {
    return `Kelas ${name.replace(/^kelompok\s+/i, '')}`;
  }
  return `Kelas ${name}`;
}

function HeroHighlight({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.heroHighlightRow}>
      <Ionicons name={icon} size={18} color={colors.lime} />
      <View style={styles.heroHighlightText}>
        <Text variant="overline" tone="onDarkMuted" numberOfLines={1}>
          {label}
        </Text>
        <Text variant="bodyStrong" tone="onDark" numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

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
        <SkeletonList variant="hero" count={2} label="Memuat sesi…" />
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
          hint="Periksa koneksi internet lalu coba lagi. Sesi yang tersimpan akan muncul kembali."
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
  const schedulePreview = todaySessions.slice(0, SCHEDULE_PREVIEW_LIMIT);
  const attendanceGroups = byStart
    .map((session) =>
      buildSessionAttendanceGroup(
        session,
        vm.getAttendanceForSession(session.id),
      ),
    )
    .filter((group) => group.records.length > 0)
    .sort(
      (a, b) => Date.parse(b.session.startsAt) - Date.parse(a.session.startsAt),
    );
  const attendancePreview = attendanceGroups.slice(0, ATTENDANCE_PREVIEW_LIMIT);

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
          <Card
            variant="heroInk"
            accessibilityLabel="Detail sesi aktif"
            accessibilityHint="Membuka detail sesi"
            onPress={() =>
              navigation.navigate('AssistantSessionDetail', {
                sessionId: active.id,
              })
            }
          >
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
              </View>
              <Text variant="title" tone="onDark" numberOfLines={2}>
                {active.courseName}
              </Text>
              <View style={styles.heroHighlights}>
                <HeroHighlight
                  icon="book-outline"
                  label="Pertemuan"
                  value={active.title ?? active.groupName}
                />
                <HeroHighlight
                  icon="people-outline"
                  label="Kelas"
                  value={classLabel(active.groupName)}
                />
                <HeroHighlight
                  icon="time-outline"
                  label="Jam"
                  value={formatTimeRange(active.startsAt, active.endsAt)}
                />
                <HeroHighlight
                  icon="location-outline"
                  label="Tempat praktikum"
                  value={active.lab ?? 'Belum ditentukan'}
                />
              </View>
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
          </View>
          <Card variant="panel" interactive={false} style={styles.quickGrid}>
            {quickActions.map(({ key, ...action }) => (
              <QuickAction key={key} {...action} />
            ))}
          </Card>
        </View>

        {schedulePreview.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title={`Jadwal hari ini (${todaySessions.length})`}
              actionLabel="Lihat semua"
              onAction={() => navigation.navigate('AssistantAllSessions')}
            />
            {schedulePreview.map((session) => (
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

        {attendancePreview.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title={`Presensi terbaru (${attendanceGroups.length})`}
              actionLabel="Lihat semua"
              onAction={() => openDockTab(navigation, 'Attendance')}
            />
            {attendancePreview.map((group) => (
              <SessionAttendancePreviewCard
                key={group.session.id}
                session={group.session}
                presentCount={group.records.length}
                onTimeCount={group.onTime}
                lateCount={group.late}
                attendees={group.preview}
                onPress={() =>
                  navigation.navigate('AssistantAttendanceRoster', {
                    sessionId: group.session.id,
                  })
                }
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
  heroHighlights: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius['2xl'],
    backgroundColor: colors.onInkSubtle,
  },
  heroHighlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  heroHighlightText: { flex: 1, gap: 2, minWidth: 0 },
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
    // iOS cards no longer clip children (so the shadow can render); keep the
    // accent visually inside the rounded corner explicitly.
    borderTopLeftRadius: radius['3xl'],
    borderBottomLeftRadius: radius['3xl'],
    backgroundColor: colors.violet,
  },
  scheduleText: { flex: 1, gap: spacing.xs, minWidth: 0 },
});
