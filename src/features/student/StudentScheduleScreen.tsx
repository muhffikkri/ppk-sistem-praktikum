import Ionicons from '@expo/vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import type { AttendanceRecord, Session } from '../../domain/types';
import { colors, radius, spacing } from '../../theme/tokens';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Header,
  LoadingState,
  Screen,
  SegmentedControl,
  StatusBadge,
  Text,
  type BadgeTone,
  type SegmentedOption,
} from '../../shared/ui';
import { useStudentAttendanceViewModel } from '../../state';
import { RootTopBar } from '../shell/RootTopBar';
import { formatClock, formatSessionDate, formatTimeRange } from './formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentSchedule'>;
type Filter = 'all' | Session['status'];

const FILTERS: SegmentedOption<Filter>[] = [
  { value: 'all', label: 'Semua' },
  { value: 'open', label: 'Terbuka' },
  { value: 'scheduled', label: 'Terjadwal' },
  { value: 'closed', label: 'Tertutup' },
];

const STATUS_LABEL: Record<Session['status'], string> = {
  open: 'Terbuka',
  scheduled: 'Terjadwal',
  closed: 'Tertutup',
  cancelled: 'Dibatalkan',
};

const STATUS_TONE: Record<Session['status'], BadgeTone> = {
  open: 'violet',
  scheduled: 'lime',
  closed: 'neutral',
  cancelled: 'danger',
};

const GROUP_META: Record<
  Session['status'],
  { caption: string; countTone: BadgeTone }
> = {
  open: { caption: 'Presensi aktif', countTone: 'lavender' },
  scheduled: { caption: 'Akan datang', countTone: 'lime' },
  closed: { caption: 'Selesai / terlewat', countTone: 'neutral' },
  cancelled: { caption: 'Tidak dilaksanakan', countTone: 'danger' },
};

const CLOSED_PREVIEW = 2;

function SessionCard({
  session,
  record,
  onPress,
}: {
  session: Session;
  record: AttendanceRecord | undefined;
  onPress: () => void;
}) {
  const isDone = session.status === 'closed' || session.status === 'cancelled';
  const textTone = isDone ? 'muted' : 'ink';

  return (
    <Card
      onPress={onPress}
      accessibilityHint="Membuka detail sesi"
      style={[styles.card, isDone && styles.cardDone]}
    >
      <View style={styles.cardMain}>
        <View style={styles.cardTitleRow}>
          <Text
            variant="bodyStrong"
            tone={textTone}
            numberOfLines={1}
            style={styles.cardTitle}
          >
            {session.courseName}
          </Text>
          {session.title ? (
            <View style={styles.moduleChip}>
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {session.title}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.metaRow}>
          <Ionicons
            name="time-outline"
            size={14}
            color={isDone ? colors.inkSubtle : colors.violet}
          />
          <Text
            variant="caption"
            tone="muted"
            numberOfLines={1}
            style={styles.metaText}
          >
            {`${formatSessionDate(session.startsAt)} · ${formatTimeRange(session.startsAt, session.endsAt)}`}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons
            name="business-outline"
            size={14}
            color={colors.inkSubtle}
          />
          <Text
            variant="caption"
            tone="muted"
            numberOfLines={1}
            style={styles.metaText}
          >
            {session.lab ?? session.groupName}
          </Text>
        </View>
        {isDone ? (
          <View style={styles.metaRow}>
            <Ionicons
              name="checkmark-done-outline"
              size={14}
              color={colors.inkSubtle}
            />
            <Text
              variant="caption"
              tone="muted"
              numberOfLines={1}
              style={styles.metaText}
            >
              {record
                ? `Presensi diverifikasi (${formatClock(record.checkedInAt)})`
                : 'Tidak ada presensi tercatat'}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardTrailing}>
        <StatusBadge
          label={STATUS_LABEL[session.status]}
          tone={STATUS_TONE[session.status]}
        />
      </View>
    </Card>
  );
}

export function StudentScheduleScreen({ navigation }: Props) {
  const { sessions, attendanceHistory, loading, error, retry } =
    useStudentAttendanceViewModel();
  const [filter, setFilter] = useState<Filter>('all');
  const [showAllClosed, setShowAllClosed] = useState(false);

  if (loading) {
    return (
      <Screen>
        <RootTopBar />
        <LoadingState label="Memuat jadwal…" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <RootTopBar />
        <ErrorState
          title="Gagal memuat jadwal"
          message={error}
          onRetry={retry}
        />
      </Screen>
    );
  }

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
  const openCount = sessions.filter((s) => s.status === 'open').length;
  const bySessionId = new Map(
    attendanceHistory.map((record) => [record.sessionId, record]),
  );

  const statuses: Session['status'][] =
    filter === 'all' ? ['open', 'scheduled', 'closed', 'cancelled'] : [filter];
  const groups = statuses
    .map((status) => ({
      status,
      meta: GROUP_META[status],
      items: sorted.filter((session) => session.status === status),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <Screen>
      <RootTopBar />
      <Header
        title="Jadwal"
        description={`${sorted.length} sesi praktikum terdaftar`}
      />

      <Button
        label="Lihat kalender"
        variant="outline"
        icon="calendar-outline"
        onPress={() => navigation.navigate('Calendar')}
        accessibilityHint="Membuka kalender semua jadwal"
      />

      <SegmentedControl
        options={FILTERS}
        value={filter}
        onChange={setFilter}
        accessibilityLabel="Filter status sesi"
      />

      {groups.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title={
            filter === 'all'
              ? 'Belum ada jadwal'
              : `Belum ada sesi ${STATUS_LABEL[filter].toLowerCase()}`
          }
          description={
            filter === 'all'
              ? 'Jadwal praktikum akan muncul di sini setelah asisten menambahkanmu ke kelas.'
              : 'Coba pilih filter status lain untuk melihat sesi lainnya.'
          }
        />
      ) : (
        groups.map(({ status, meta, items }) => {
          const visible =
            status === 'closed' && !showAllClosed
              ? items.slice(0, CLOSED_PREVIEW)
              : items;
          return (
            <View key={status} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleGroup}>
                  <Text
                    variant="bodyStrong"
                    tone={
                      status === 'closed' || status === 'cancelled'
                        ? 'muted'
                        : 'ink'
                    }
                  >
                    {STATUS_LABEL[status]}
                  </Text>
                  <StatusBadge
                    label={String(items.length)}
                    tone={meta.countTone}
                  />
                </View>
                <Text variant="caption" tone="muted">
                  {meta.caption}
                </Text>
              </View>

              <View style={styles.list}>
                {visible.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    record={bySessionId.get(session.id)}
                    onPress={() =>
                      navigation.navigate('StudentSessionDetail', {
                        sessionId: session.id,
                      })
                    }
                  />
                ))}
              </View>

              {status === 'closed' && items.length > CLOSED_PREVIEW ? (
                <Button
                  label={
                    showAllClosed
                      ? 'Tampilkan lebih sedikit'
                      : `Tampilkan ${items.length - CLOSED_PREVIEW} sesi tertutup lainnya`
                  }
                  variant="soft"
                  size="sm"
                  icon={
                    showAllClosed
                      ? 'chevron-up-outline'
                      : 'chevron-down-outline'
                  }
                  onPress={() => setShowAllClosed((value) => !value)}
                />
              ) : null}
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  list: { gap: spacing.sm },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  cardDone: { opacity: 0.85 },
  cardMain: { flex: 1, gap: spacing.xs },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: { flexShrink: 1 },
  moduleChip: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: { flexShrink: 1 },
  cardTrailing: { flexShrink: 0 },
});
