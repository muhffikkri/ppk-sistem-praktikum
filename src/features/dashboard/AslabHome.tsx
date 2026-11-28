import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import type { DashboardPeriod } from '../../domain/labDashboardRules';
import { formatWeekdayDayMonth } from '../../shared/format/date';
import {
  EmptyState,
  ErrorState,
  Header,
  QuickActionGrid,
  Screen,
  SectionHeader,
  Skeleton,
  SkeletonList,
  StatCard,
  StatRow,
  StatusBadge,
  Text,
  type QuickAction,
} from '../../shared/ui';
import { spacing } from '../../theme/tokens';
import { useAuth } from '../../state';
import { RootTopBar } from '../shell/RootTopBar';
import { LabStatusRow, PeriodFilter, SessionActivityRow } from './components';
import { useAslabDashboard } from './useAslabDashboard';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const UPCOMING_LIMIT = 4;
const HISTORY_PREVIEW = 5;

/** Beranda Aslab: pemantauan seluruh lab dalam cakupan mata kuliah. */
export function AslabHome({ navigation }: { navigation: Nav }) {
  const { user } = useAuth();
  const [period, setPeriod] = useState<DashboardPeriod>('week');
  const [offset, setOffset] = useState(0);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const vm = useAslabDashboard(period, offset);
  const { summary } = vm;

  const changePeriod = useCallback((next: DashboardPeriod) => {
    setPeriod(next);
    setOffset(0);
    setShowAllHistory(false);
  }, []);
  const changeOffset = useCallback((next: number) => {
    setOffset(next);
    setShowAllHistory(false);
  }, []);
  const openLab = useCallback(
    (labId: string) => navigation.navigate('AssistantLabForm', { labId }),
    [navigation],
  );

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        key: 'labs',
        icon: 'business-outline',
        label: 'Kelola Lab',
        tone: 'violet',
        onPress: () => navigation.navigate('AssistantLabList'),
      },
      {
        key: 'distribution',
        icon: 'swap-horizontal-outline',
        label: 'Distribusi',
        tone: 'blue',
        onPress: () => navigation.navigate('AslabLabDistribution'),
      },
      {
        key: 'import',
        icon: 'cloud-upload-outline',
        label: 'Impor Data',
        tone: 'lime',
        onPress: () => navigation.navigate('AslabLabImport'),
      },
      {
        key: 'map',
        icon: 'map-outline',
        label: 'Peta Lab',
        tone: 'neutral',
        onPress: () => navigation.navigate('LabMaps'),
      },
    ],
    [navigation],
  );

  const header = (
    <Header
      eyebrow={formatWeekdayDayMonth(vm.now)}
      title={user?.displayName?.trim() || 'Aslab'}
      trailing={<StatusBadge label="Asisten Laboratorium" tone="lavender" />}
    />
  );

  if (!vm.hasScope) {
    return (
      <Screen>
        <RootTopBar />
        <View style={styles.feed}>
          {header}
          <EmptyState
            icon="school-outline"
            title="Belum ada mata kuliah"
            description="Akunmu belum ditugaskan ke mata kuliah. Hubungi pengelola praktikum agar dashboard lab bisa ditampilkan."
          />
        </View>
      </Screen>
    );
  }

  if (vm.loading) {
    return (
      <Screen>
        <RootTopBar />
        <SkeletonList variant="hero" count={3} label="Memuat dashboard…" />
      </Screen>
    );
  }

  if (vm.error) {
    return (
      <Screen>
        <RootTopBar />
        <ErrorState
          title="Gagal memuat dashboard"
          message={vm.error}
          hint="Periksa koneksi internet lalu coba lagi."
          onRetry={vm.retry}
        />
      </Screen>
    );
  }

  const history = showAllHistory
    ? summary.history
    : summary.history.slice(0, HISTORY_PREVIEW);
  const upcoming = summary.upcoming.slice(0, UPCOMING_LIMIT);

  return (
    <Screen>
      <RootTopBar />
      <View style={styles.feed}>
        {header}

        <StatRow>
          <StatCard
            variant="panel"
            value={summary.labCount}
            suffix={`· ${summary.activeLabCount} aktif`}
            label="Laboratorium dikelola"
          />
          <StatCard
            variant="panel"
            value={summary.participantCount}
            label="Praktikan terdaftar"
          />
        </StatRow>

        <QuickActionGrid actions={quickActions} />

        <View style={styles.section}>
          <SectionHeader
            title={`Sedang berlangsung (${summary.live.length})`}
          />
          {summary.live.length > 0 ? (
            summary.live.map((session) => (
              <SessionActivityRow
                key={session.id}
                session={session}
                withDate={false}
              />
            ))
          ) : (
            <Text variant="caption" tone="muted">
              Tidak ada sesi yang sedang dibuka saat ini.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Status laboratorium" />
          {summary.labs.length > 0 ? (
            summary.labs.map((row) => (
              <LabStatusRow key={row.lab.id} row={row} onPress={openLab} />
            ))
          ) : (
            <EmptyState
              icon="business-outline"
              title="Belum ada laboratorium"
              description="Tambahkan lab untuk mata kuliah yang kamu kelola."
            />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title={`Jadwal berikutnya (${summary.upcoming.length})`}
          />
          {upcoming.length > 0 ? (
            upcoming.map((session) => (
              <SessionActivityRow key={session.id} session={session} />
            ))
          ) : (
            <Text variant="caption" tone="muted">
              Belum ada sesi terjadwal dalam lima minggu ke depan.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Rekap periode" />
          <PeriodFilter
            period={period}
            offset={offset}
            range={vm.range}
            onChangePeriod={changePeriod}
            onChangeOffset={changeOffset}
          />
          {vm.periodLoading ? (
            <Skeleton height={88} />
          ) : (
            <StatRow>
              <StatCard
                variant="panel"
                value={summary.periodSessionCount}
                label="Sesi terlaksana & terjadwal"
              />
              <StatCard
                variant="panel"
                value={summary.periodParticipantCount}
                label="Praktikan dalam jadwal"
              />
            </StatRow>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title={`Riwayat kegiatan (${summary.history.length})`}
            actionLabel={
              summary.history.length > HISTORY_PREVIEW
                ? showAllHistory
                  ? 'Ringkas'
                  : 'Lihat semua'
                : undefined
            }
            onAction={() => setShowAllHistory((value) => !value)}
          />
          {vm.periodLoading ? (
            <SkeletonList count={2} label="Memuat riwayat…" />
          ) : history.length > 0 ? (
            history.map((session) => (
              <SessionActivityRow key={session.id} session={session} />
            ))
          ) : (
            <EmptyState
              icon="time-outline"
              title="Belum ada kegiatan"
              description="Tidak ada sesi yang selesai atau dibatalkan pada periode ini."
            />
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  feed: { gap: spacing.xl },
  section: { gap: spacing.sm },
});
