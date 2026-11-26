import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import { colors, radius, shadow, spacing } from '../../theme/tokens';
import {
  Avatar,
  Banner,
  Button,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  IconButton,
  ListRow,
  LoadingState,
  Screen,
  SectionHeader,
  StatRow,
  StatusBadge,
  Text,
  type BadgeTone,
  type IconName,
} from '../../shared/ui';
import { useAuth, useStudentAttendanceViewModel } from '../../state';
import { formatClock, formatSessionDate, formatTimeRange } from './formatters';
import { RootTopBar } from '../shell/RootTopBar';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const STATUS_LABEL: Record<string, string> = {
  open: 'Terbuka',
  scheduled: 'Terjadwal',
  closed: 'Tertutup',
};

const STATUS_TONE: Record<string, BadgeTone> = {
  open: 'violet',
  scheduled: 'lime',
  closed: 'neutral',
};

const WEEK_ROWS = 4;
const DAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

type QuickTone = 'violet' | 'lime' | 'pink' | 'blue';

const QUICK_TONE: Record<QuickTone, { bg: string; fg: string }> = {
  violet: { bg: colors.lavenderSubtle, fg: colors.violet },
  lime: { bg: colors.lime, fg: colors.ink },
  pink: { bg: colors.pink, fg: colors.pinkInk },
  blue: { bg: colors.blueSoft, fg: colors.blue },
};

function isSameDay(a: string, b: Date) {
  const d = new Date(a);
  return (
    d.getFullYear() === b.getFullYear() &&
    d.getMonth() === b.getMonth() &&
    d.getDate() === b.getDate()
  );
}

function dayParts(iso: string) {
  const d = new Date(iso);
  return {
    day: DAY_SHORT[d.getDay()],
    date: String(d.getDate()).padStart(2, '0'),
  };
}

function progressOf(part: number, whole: number) {
  return whole > 0 ? Math.min(1, part / whole) : 0;
}

function MetricCard({
  label,
  value,
  suffix,
  progress,
  fill,
  caption,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  progress: number;
  fill: string;
  caption: string;
}) {
  const width = `${Math.round(progress * 100)}%`;
  return (
    <View style={styles.metric}>
      <Text variant="caption" tone="muted" numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.metricValueRow}>
        <Text variant="title" numberOfLines={1}>
          {String(value)}
        </Text>
        {suffix ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {suffix}
          </Text>
        ) : null}
      </View>
      <View style={styles.track}>
        <View style={[styles.trackFill, { backgroundColor: fill, width }]} />
      </View>
      <Text variant="caption" tone="muted" numberOfLines={1}>
        {caption}
      </Text>
    </View>
  );
}

function HeroMeta({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metaItem}>
      <View style={styles.metaIcon} importantForAccessibility="no">
        <Ionicons name={icon} size={16} color={colors.onPrimary} />
      </View>
      <View style={styles.metaText}>
        <Text variant="caption" tone="onDarkMuted" numberOfLines={1}>
          {label}
        </Text>
        <Text variant="captionStrong" tone="onDark" numberOfLines={1}>
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
    <Card
      onPress={onPress}
      accessibilityLabel={label}
      style={styles.quickAction}
    >
      <View style={[styles.quickIcon, { backgroundColor: t.bg }]}>
        <Ionicons name={icon} size={20} color={t.fg} />
      </View>
      <Text variant="captionStrong" numberOfLines={1} style={styles.quickLabel}>
        {label}
      </Text>
    </Card>
  );
}

export function StudentHome({ navigation }: { navigation: Nav }) {
  const { user } = useAuth();
  const {
    sessions,
    classes,
    attendanceHistory,
    loading,
    error,
    reportError,
    retry,
  } = useStudentAttendanceViewModel();

  const topBar = <RootTopBar />;

  if (loading) {
    return (
      <Screen>
        {topBar}
        <LoadingState label="Memuat jadwal…" />
      </Screen>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <Screen>
        {topBar}
        <ErrorState
          title="Gagal memuat jadwal"
          message={error}
          onRetry={retry}
        />
      </Screen>
    );
  }

  const today = new Date();
  const displayName = user?.displayName?.trim() || 'Praktikan';
  const className = classes[0]?.groupName;

  const byStart = [...sessions].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  const todaySessions = byStart.filter((s) => isSameDay(s.startsAt, today));

  const hero =
    todaySessions.find((s) => s.status === 'open') ??
    todaySessions.find((s) => s.status === 'scheduled') ??
    byStart.find((s) => s.status === 'open') ??
    byStart.find((s) => s.status === 'scheduled');
  const record = hero
    ? attendanceHistory.find((r) => r.sessionId === hero.id)
    : undefined;

  const attendedIds = new Set(attendanceHistory.map((r) => r.sessionId));
  const needsAction = byStart.filter(
    (s) => s.status === 'open' && !attendedIds.has(s.id),
  );

  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const weekEnd = new Date(startOfDay);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const upcoming = byStart
    .filter((s) => {
      const date = new Date(s.startsAt);
      return (
        s.status !== 'closed' &&
        s.status !== 'cancelled' &&
        s.id !== hero?.id &&
        date >= startOfDay &&
        date < weekEnd
      );
    })
    .slice(0, WEEK_ROWS);

  const total = sessions.length;
  const attended = attendanceHistory.length;
  const openCount = sessions.filter((s) => s.status === 'open').length;
  const closedCount = sessions.filter((s) => s.status === 'closed').length;

  const openDetail = (sessionId: string) =>
    navigation.navigate('StudentSessionDetail', { sessionId });

  return (
    <Screen>
      {topBar}
      <View style={styles.feed}>
        {error ? (
          <Banner
            tone="danger"
            title="Aksi presensi terkendala"
            message={error}
            onDismiss={() => reportError(null)}
          />
        ) : null}

        <Card interactive={false}>
          <CardContent>
            <View style={styles.profileRow}>
              <Avatar name={displayName} size={44} tone="lavender" />
              <View style={styles.profileText}>
                <View style={styles.profileTitleRow}>
                  <Text
                    variant="bodyStrong"
                    numberOfLines={1}
                    style={styles.profileName}
                  >
                    {displayName}
                  </Text>
                  <StatusBadge
                    label={className ?? 'Praktikan'}
                    tone="lavender"
                  />
                </View>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {[user?.nim, user?.email].filter(Boolean).join(' · ') ||
                    'Akun praktikan'}
                </Text>
              </View>
              <IconButton
                icon="id-card-outline"
                accessibilityLabel="Buka kartu profil praktikan"
                variant="soft"
                onPress={() => navigation.navigate('Profile')}
              />
            </View>
          </CardContent>
        </Card>

        <View style={styles.section}>
          <SectionHeader title="Pintasan Praktikum" />
          <View style={styles.quickRow}>
            <QuickAction
              icon="calendar-outline"
              label="Jadwal"
              tone="violet"
              onPress={() => navigation.navigate('StudentSchedule')}
            />
            <QuickAction
              icon="checkmark-done-outline"
              label="Riwayat"
              tone="lime"
              onPress={() => navigation.navigate('StudentAttendanceHistory')}
            />
            <QuickAction
              icon="document-text-outline"
              label="Izin"
              tone="pink"
              onPress={() => navigation.navigate('StudentLeaveList')}
            />
            <QuickAction
              icon="cash-outline"
              label="Denda"
              tone="blue"
              onPress={() => navigation.navigate('StudentFineList')}
            />
          </View>
        </View>

        {hero ? (
          <Card variant="heroViolet" interactive={false}>
            <View style={styles.heroContent}>
              <View style={styles.heroTopRow}>
                <StatusBadge
                  label={
                    hero.status === 'open'
                      ? 'Sedang berlangsung'
                      : 'Sesi berikutnya'
                  }
                  tone="lime"
                />
                <Text
                  variant="captionStrong"
                  tone="onDark"
                  numberOfLines={1}
                  style={styles.heroTime}
                >
                  {formatTimeRange(hero.startsAt, hero.endsAt)}
                </Text>
              </View>

              <View style={styles.heroTitle}>
                <Text variant="subtitle" tone="onDark" numberOfLines={2}>
                  {hero.courseName}
                </Text>
                <Text variant="body" tone="onDarkMuted" numberOfLines={2}>
                  {`${hero.title ?? hero.groupName} · ${formatSessionDate(hero.startsAt)}`}
                </Text>
              </View>

              <View style={styles.metaGrid}>
                <HeroMeta
                  icon="business-outline"
                  label="Laboratorium"
                  value={hero.lab ?? 'Belum ditentukan'}
                />
                <HeroMeta
                  icon="people-outline"
                  label="Kelas"
                  value={hero.groupName}
                />
              </View>

              <View style={styles.heroAction}>
                {record ? (
                  <StatusBadge
                    label={`Hadir ${formatClock(record.checkedInAt)}`}
                    tone="success"
                  />
                ) : hero.status === 'open' ? (
                  <Button
                    label="Presensi sekarang"
                    variant="accent"
                    icon="qr-code-outline"
                    onPress={() => openDetail(hero.id)}
                    accessibilityHint="Membuka detail sesi untuk presensi"
                  />
                ) : (
                  <Text variant="caption" tone="onDarkMuted">
                    Dibuka asisten saat sesi dimulai
                  </Text>
                )}
              </View>
            </View>
          </Card>
        ) : (
          <EmptyState
            icon="calendar-outline"
            title="Tidak ada sesi mendatang"
            description="Sesi baru akan muncul setelah asisten menjadwalkannya."
          />
        )}

        <View style={styles.section}>
          <SectionHeader
            title="Progres & Kehadiran"
            actionLabel="Riwayat"
            onAction={() => navigation.navigate('StudentAttendanceHistory')}
          />
          <StatRow>
            <MetricCard
              label="Presensi"
              value={attended}
              suffix={`/ ${total}`}
              progress={progressOf(attended, total)}
              fill={colors.violet}
              caption="Sesi hadir tercatat"
            />
            <MetricCard
              label="Selesai"
              value={closedCount}
              suffix={`/ ${total}`}
              progress={progressOf(closedCount, total)}
              fill={colors.successInk}
              caption="Sesi sudah ditutup"
            />
            <MetricCard
              label="Dibuka"
              value={openCount}
              progress={progressOf(openCount, total)}
              fill={colors.limeHover}
              caption="Siap untuk presensi"
            />
          </StatRow>
        </View>

        {needsAction.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader title="Perlu Dilakukan" />
            {needsAction.map((s) => (
              <ListRow
                key={s.id}
                title={s.courseName}
                meta={`${formatTimeRange(s.startsAt, s.endsAt)}${s.lab ? ` · ${s.lab}` : ''}`}
                onPress={() => openDetail(s.id)}
                accessibilityHint="Membuka detail sesi untuk presensi"
                trailing={<StatusBadge label="Presensi" tone="violet" />}
              />
            ))}
          </View>
        ) : null}

        {upcoming.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title="Jadwal Minggu Ini"
              actionLabel="Lihat kalender"
              onAction={() => navigation.navigate('Calendar')}
            />
            {upcoming.map((s) => {
              const day = dayParts(s.startsAt);
              return (
                <Card
                  key={s.id}
                  onPress={() => openDetail(s.id)}
                  accessibilityHint="Membuka detail sesi"
                  style={styles.scheduleCard}
                >
                  <View style={styles.dateTile}>
                    <Text variant="overline" tone="muted" numberOfLines={1}>
                      {day.day}
                    </Text>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {day.date}
                    </Text>
                  </View>
                  <View style={styles.scheduleText}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {s.courseName}
                    </Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {`${formatTimeRange(s.startsAt, s.endsAt)} · ${s.lab ?? s.groupName}`}
                    </Text>
                  </View>
                  <StatusBadge
                    label={STATUS_LABEL[s.status] ?? s.status}
                    tone={STATUS_TONE[s.status] ?? 'neutral'}
                  />
                </Card>
              );
            })}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  feed: { gap: spacing.xl },
  section: { gap: spacing.sm },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileText: { flex: 1, gap: spacing.xs },
  profileTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  profileName: { flexShrink: 1 },

  heroContent: { padding: spacing.lg, gap: spacing.md },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  heroTime: { flexShrink: 1 },
  heroTitle: { gap: spacing.xs },
  metaGrid: { flexDirection: 'row', gap: spacing.sm },
  metaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.onInkRaised,
  },
  metaIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.onInkSubtle,
  },
  metaText: { flex: 1 },
  heroAction: { marginTop: spacing.xs },

  metric: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius['2xl'],
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  track: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  trackFill: { height: '100%', borderRadius: radius.full },

  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  dateTile: {
    width: 44,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  scheduleText: { flex: 1, gap: spacing.xs },

  quickRow: { flexDirection: 'row', gap: spacing.sm },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    minHeight: 88,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { textAlign: 'center' },
});
