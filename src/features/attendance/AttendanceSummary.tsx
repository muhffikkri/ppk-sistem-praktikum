import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '../../theme/tokens';
import {
  Card,
  StatusBadge,
  Text,
  type BadgeTone,
  type TextTone,
} from '../../shared/ui';

export type AttendanceMetric = {
  key: string;
  label: string;
  value: string | number;
  badge?: string;
  badgeTone?: BadgeTone;
  caption: string;
  captionTone?: TextTone;
};

export type AttendanceBreakdownItem = {
  key: string;
  label: string;
  value: number;
};

/** Ringkasan angka + strip rincian, dipakai bersama layar presensi. */
export function AttendanceSummary({
  metrics,
  breakdown,
}: {
  metrics: AttendanceMetric[];
  breakdown: AttendanceBreakdownItem[];
}) {
  return (
    <View style={styles.block}>
      <View style={styles.metrics}>
        {metrics.map((metric) => (
          <Card
            key={metric.key}
            variant="panel"
            interactive={false}
            style={styles.metric}
          >
            <View style={styles.metricTop}>
              <Text
                variant="overline"
                tone="muted"
                numberOfLines={1}
                style={styles.metricLabel}
              >
                {metric.label}
              </Text>
              {metric.badge ? (
                <StatusBadge
                  label={metric.badge}
                  tone={metric.badgeTone ?? 'lavender'}
                />
              ) : null}
            </View>
            <Text variant="display" numberOfLines={1}>
              {String(metric.value)}
            </Text>
            <View style={styles.captionRow}>
              <Text
                variant="caption"
                tone={metric.captionTone ?? 'muted'}
                numberOfLines={2}
                style={styles.caption}
              >
                {metric.caption}
              </Text>
            </View>
          </Card>
        ))}
      </View>

      {breakdown.length > 0 ? (
        <Card variant="surface" interactive={false} style={styles.breakdown}>
          <View style={styles.breakdownRow}>
            {breakdown.map((item, index) => (
              <Fragment key={item.key}>
                {index > 0 ? (
                  <View accessible={false} style={styles.separator} />
                ) : null}
                <View style={styles.breakdownItem}>
                  <Text variant="caption" tone="muted" numberOfLines={1}>
                    {`${item.label}: `}
                    <Text variant="captionStrong" tone="ink">
                      {item.value}
                    </Text>
                  </Text>
                </View>
              </Fragment>
            ))}
          </View>
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.sm },
  metrics: { flexDirection: 'row', gap: spacing.md },
  metric: { flex: 1, padding: spacing.lg, gap: spacing.sm },
  metricTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metricLabel: { flexShrink: 1 },
  captionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  caption: { flexShrink: 1 },
  breakdown: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  breakdownItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 0,
  },
  separator: { width: 1, height: 16, backgroundColor: colors.border },
});
