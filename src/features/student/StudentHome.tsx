import React from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme/tokens';
import type { RootStackParamList } from '../../app/navigation';
import {
  AppTopBar,
  Button,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  Header,
  IconButton,
  ListRow,
  LoadingState,
  Screen,
  SectionHeader,
  StatusBadge,
  Text,
  type BadgeTone,
} from '../../shared/ui';
import { useAuth, useStudentAttendanceViewModel } from '../../state';
import { formatWeekdayDayMonth } from '../../shared/format/date';
import { formatClock, formatSessionDate, formatTimeRange } from './formatters';
import { NotificationBellButton } from '../notifications/NotificationBellButton';

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

function isSameDay(a: string, b: Date) {
  const d = new Date(a);
  return (
    d.getFullYear() === b.getFullYear() &&
    d.getMonth() === b.getMonth() &&
    d.getDate() === b.getDate()
  );
}

export function StudentHome({ navigation }: { navigation: Nav }) {
  const { user } = useAuth();
  const { sessions, attendanceHistory, loading, error, retry } =
    useStudentAttendanceViewModel();

  const topBar = (
    <AppTopBar
      logoIcon="school-outline"
      title="LabPresensi"
      trailing={
        <>
          <IconButton
            icon="map-outline"
            accessibilityLabel="Peta Laboratorium"
            onPress={() => navigation.navigate('LabMaps')}
          />
          <NotificationBellButton
            onPress={() => navigation.navigate('Notifications')}
          />
          <IconButton
            icon="person-outline"
            accessibilityLabel="Profil"
            onPress={() => navigation.navigate('Profile')}
          />
        </>
      }
    />
  );

  if (loading) {
    return (
      <Screen>
        {topBar}
        <LoadingState label="Memuat jadwal…" />
      </Screen>
    );
  }

  if (error) {
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
  const byStart = [...sessions].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  // Sesi untuk hari ini (container jadwal hari ini).
  const todaySessions = byStart.filter((s) => isSameDay(s.startsAt, today));

  const hero =
    todaySessions.find((s) => s.status === 'open') ??
    todaySessions.find((s) => s.status === 'scheduled') ??
    byStart.find((s) => s.status === 'open') ??
    byStart.find((s) => s.status === 'scheduled');
  const record = hero
    ? attendanceHistory.find((r) => r.sessionId === hero.id)
    : undefined;
  const upcoming = byStart
    .filter((s) => s.status !== 'closed' && s.id !== hero?.id)
    .slice(0, WEEK_ROWS);

  const openDetail = (sessionId: string) =>
    navigation.navigate('StudentSessionDetail', { sessionId });

  const header = (
    <Header
      eyebrow={formatWeekdayDayMonth(today)}
      title={user?.displayName?.trim() || 'Praktikan'}
    />
  );

  return (
    <Screen>
      {topBar}
      {header}

      {hero ? (
        <Card variant="heroViolet" interactive={false}>
          <CardContent>
            <StatusBadge
              label={
                hero.status === 'open'
                  ? 'Sedang berlangsung'
                  : 'Sesi berikutnya'
              }
              tone="lime"
              live={hero.status === 'open'}
            />
            <Text variant="displayHero" tone="onDark">
              {formatTimeRange(hero.startsAt, hero.endsAt)}
            </Text>
            <Text variant="subtitle" tone="onDark">
              {hero.courseName}
            </Text>
            <Text variant="caption" tone="onDarkMuted">
              {`${hero.groupName} · ${formatSessionDate(hero.startsAt)}${hero.lab ? ` · ${hero.lab}` : ''}`}
            </Text>
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
                  icon="finger-print"
                  onPress={() => openDetail(hero.id)}
                  accessibilityHint="Membuka detail sesi untuk presensi"
                />
              ) : (
                <Text variant="caption" tone="onDarkMuted">
                  Dibuka asisten saat sesi dimulai
                </Text>
              )}
            </View>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon="calendar-outline"
          title="Tidak ada sesi mendatang"
          description="Sesi baru akan muncul setelah asisten menjadwalkannya."
        />
      )}

      {todaySessions.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader
            title="Jadwal hari ini"
            actionLabel="Lihat semua"
            onAction={() => navigation.navigate('StudentSchedule')}
          />
          {todaySessions.map((s) => (
            <ListRow
              key={s.id}
              title={`${formatTimeRange(s.startsAt, s.endsAt)} · ${s.courseName}`}
              meta={`${s.groupName}${s.lab ? ` · ${s.lab}` : ''}`}
              onPress={() => openDetail(s.id)}
              accessibilityHint="Membuka detail sesi"
              trailing={
                <StatusBadge
                  label={STATUS_LABEL[s.status] ?? s.status}
                  tone={STATUS_TONE[s.status] ?? 'neutral'}
                  dot={s.status === 'open'}
                  live={s.status === 'open'}
                />
              }
            />
          ))}
        </View>
      ) : null}

      {upcoming.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader
            title="Sesi mendatang"
            actionLabel="Lihat semua"
            onAction={() => navigation.navigate('StudentSchedule')}
          />
          {upcoming.map((s) => (
            <ListRow
              key={s.id}
              title={s.courseName}
              meta={`${formatSessionDate(s.startsAt)} · ${formatTimeRange(s.startsAt, s.endsAt)}`}
              onPress={() => openDetail(s.id)}
              accessibilityHint="Membuka detail sesi"
              trailing={
                <StatusBadge
                  label={STATUS_LABEL[s.status] ?? s.status}
                  tone={STATUS_TONE[s.status] ?? 'neutral'}
                />
              }
            />
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Pintasan" />
        <ListRow
          title="Peta Laboratorium"
          meta="Lihat persebaran lab & jadwal aktif"
          onPress={() => navigation.navigate('LabMaps')}
        />
        <ListRow
          title="Riwayat kehadiran"
          meta={`${attendanceHistory.length} presensi tercatat`}
          onPress={() => navigation.navigate('StudentAttendanceHistory')}
        />
        <ListRow
          title="Izin saya"
          onPress={() => navigation.navigate('StudentLeaveList')}
        />
        <ListRow
          title="Tagihan denda"
          onPress={() => navigation.navigate('StudentFineList')}
        />
        <ListRow
          title="Riwayat pembayaran"
          onPress={() => navigation.navigate('StudentPaymentHistory')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  heroAction: { marginTop: spacing.sm, alignItems: 'flex-start' },
  // Day selector styles
  daySelector: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginVertical: spacing.sm,
  },
  dayBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.violet,
  },
  dayBtnSelected: {
    backgroundColor: colors.violet,
    borderColor: colors.violet,
  },
  dayBtnPressed: {
    opacity: 0.85,
  },
  dayBtnText: {
    ...typography.captionStrong,
    color: colors.ink,
  },
  dayBtnSelectedText: {
    color: colors.onPrimary,
  },
});
