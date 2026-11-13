import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import { formatSessionDate } from '../../app/formatters';
import type { RootStackParamList } from '../../app/navigation';
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  Header,
  ListRow,
  LoadingState,
  Screen,
  SectionHeader,
  spacing,
  StatusBadge,
  Text,
  type BadgeTone,
} from '../../shared/ui';
import { useAuth, useStudentAttendanceViewModel } from '../../state';
import { formatClock, formatTimeRange } from './formatters';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const STATUS_LABEL = {
  open: 'Terbuka',
  scheduled: 'Terjadwal',
  closed: 'Tertutup',
} as const;

const STATUS_TONE: Record<keyof typeof STATUS_LABEL, BadgeTone> = {
  open: 'violet',
  scheduled: 'lavender',
  closed: 'neutral',
};

const WEEK_ROWS = 4;

export function StudentHome({ navigation }: { navigation: Nav }) {
  const { user } = useAuth();
  const { sessions, attendanceHistory, loading, error, retry } =
    useStudentAttendanceViewModel();

  if (loading) {
    return (
      <Screen>
        <LoadingState label="Memuat jadwal…" />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen>
        <ErrorState
          title="Gagal memuat jadwal"
          message={error}
          onRetry={retry}
        />
      </Screen>
    );
  }

  const firstName = user?.displayName?.trim().split(/\s+/)[0] || 'Praktikan';
  const header = (
    <Header
      eyebrow={formatSessionDate(new Date().toISOString())}
      title={`Halo, ${firstName}`}
    />
  );

  if (sessions.length === 0) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="school-outline"
          title="Belum terdaftar di kelas"
          description="Minta asisten menambahkan emailmu ke kelas praktikum. Jadwal akan muncul di sini."
        />
      </Screen>
    );
  }

  const byStart = [...sessions].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
  const hero =
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

  return (
    <Screen>
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
              tone="lavender"
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
                  label={STATUS_LABEL[s.status]}
                  tone={STATUS_TONE[s.status]}
                />
              }
            />
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Pintasan" />
        <ListRow
          title="Riwayat kehadiran"
          meta={`${attendanceHistory.length} presensi tercatat`}
          onPress={() => navigation.navigate('StudentAttendanceHistory')}
        />
        <ListRow
          title="Izin saya"
          onPress={() => navigation.navigate('StudentLeaveList')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  heroAction: { marginTop: spacing.sm, alignItems: 'flex-start' },
});
