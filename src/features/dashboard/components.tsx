import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import type {
  DashboardPeriod,
  LabActivityStatus,
  LabDashboardRow,
  PeriodRange,
} from '../../domain/labDashboardRules';
import type { Session } from '../../domain/types';
import { formatSessionDate, formatTimeRange } from '../../shared/format/date';
import {
  IconButton,
  ListRow,
  SegmentedControl,
  StatusBadge,
  Text,
  type BadgeTone,
} from '../../shared/ui';
import { spacing } from '../../theme/tokens';
import {
  sessionStatusLabel,
  sessionStatusTone,
} from '../assistant/components/AssistantSessionCard';
import { PERIOD_OPTIONS, periodLabel } from './periodLabel';

const LAB_STATUS: Record<
  LabActivityStatus,
  { label: string; tone: BadgeTone }
> = {
  live: { label: 'Berlangsung', tone: 'violet' },
  scheduled: { label: 'Terjadwal', tone: 'lavender' },
  idle: { label: 'Kosong', tone: 'neutral' },
  inactive: { label: 'Nonaktif', tone: 'danger' },
};

/** Batas pergeseran periode agar query tetap dalam rentang semester. */
const MAX_OFFSET = 12;

export function PeriodFilter({
  period,
  offset,
  range,
  onChangePeriod,
  onChangeOffset,
}: {
  period: DashboardPeriod;
  offset: number;
  range: PeriodRange;
  onChangePeriod: (period: DashboardPeriod) => void;
  onChangeOffset: (offset: number) => void;
}) {
  const label = periodLabel(period, offset, range);
  return (
    <View style={styles.filter}>
      <SegmentedControl
        options={PERIOD_OPTIONS}
        value={period}
        onChange={onChangePeriod}
        accessibilityLabel="Filter periode dashboard"
      />
      <View style={styles.periodRow}>
        <IconButton
          icon="chevron-back"
          variant="outline"
          accessibilityLabel="Periode sebelumnya"
          disabled={offset <= -MAX_OFFSET}
          onPress={() => onChangeOffset(offset - 1)}
        />
        <View style={styles.periodText} accessibilityLiveRegion="polite">
          <Text variant="bodyStrong" numberOfLines={1}>
            {label.title}
          </Text>
          {label.title !== label.detail ? (
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {label.detail}
            </Text>
          ) : null}
        </View>
        <IconButton
          icon="chevron-forward"
          variant="outline"
          accessibilityLabel="Periode berikutnya"
          disabled={offset >= MAX_OFFSET}
          onPress={() => onChangeOffset(offset + 1)}
        />
      </View>
    </View>
  );
}

function sessionMeta(session: Session, withDate: boolean): string {
  return [
    withDate ? formatSessionDate(session.startsAt) : null,
    formatTimeRange(session.startsAt, session.endsAt),
    session.lab,
  ]
    .filter(Boolean)
    .join(' · ');
}

export const SessionActivityRow = memo(function SessionActivityRow({
  session,
  withDate = true,
}: {
  session: Session;
  withDate?: boolean;
}) {
  const isLive = session.status === 'open';
  return (
    <ListRow
      title={`${session.courseName} · ${session.groupName}`}
      meta={sessionMeta(session, withDate)}
      trailing={
        <StatusBadge
          label={isLive ? 'Berlangsung' : sessionStatusLabel[session.status]}
          tone={isLive ? 'violet' : sessionStatusTone[session.status]}
        />
      }
    />
  );
});

function labMeta(row: LabDashboardRow): string {
  if (row.current) {
    return `Berlangsung: ${row.current.courseName} · ${formatTimeRange(
      row.current.startsAt,
      row.current.endsAt,
    )}`;
  }
  if (row.next) {
    return `Berikutnya: ${formatSessionDate(row.next.startsAt)} · ${formatTimeRange(
      row.next.startsAt,
      row.next.endsAt,
    )}`;
  }
  return row.lab.building || 'Belum ada jadwal';
}

export const LabStatusRow = memo(function LabStatusRow({
  row,
  onPress,
}: {
  row: LabDashboardRow;
  onPress: (labId: string) => void;
}) {
  const status = LAB_STATUS[row.status];
  return (
    <ListRow
      title={row.lab.name}
      meta={labMeta(row)}
      accessibilityLabel={`${row.lab.name}, ${status.label}`}
      accessibilityHint="Membuka pengaturan lab"
      onPress={() => onPress(row.lab.id)}
      trailing={<StatusBadge label={status.label} tone={status.tone} />}
    />
  );
});

const styles = StyleSheet.create({
  filter: { gap: spacing.sm },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  periodText: { flex: 1, alignItems: 'center', minWidth: 0 },
});
