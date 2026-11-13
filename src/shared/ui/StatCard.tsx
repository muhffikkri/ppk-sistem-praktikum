import { Children, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';
import { Text } from './Text';

export type StatCardProps = {
  /** Must be computed from loaded data; never a placeholder. */
  value: string | number;
  label: string;
  /** Small text after the value, e.g. "/ 24". */
  suffix?: string;
  /** `panel` for compact counters, `ink` for the hero figure on a screen. */
  variant: 'panel' | 'ink';
};

/** Sticker sheet Section 07 "big number". */
export function StatCard({ value, label, suffix, variant }: StatCardProps) {
  if (variant === 'ink') {
    return (
      <View style={[styles.card, styles.ink]}>
        <View style={styles.valueRow}>
          <Text variant="displayHero" tone="onDark" numberOfLines={1}>
            {String(value)}
          </Text>
          {suffix ? (
            <Text
              variant="bodyStrong"
              numberOfLines={1}
              style={styles.suffixLime}
            >
              {suffix}
            </Text>
          ) : null}
        </View>
        <Text variant="caption" tone="onDarkMuted" numberOfLines={2}>
          {label}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, styles.panel]}>
      <View style={styles.valueRow}>
        <Text variant="title" numberOfLines={1}>
          {String(value)}
        </Text>
        {suffix ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {suffix}
          </Text>
        ) : null}
      </View>
      <Text variant="caption" tone="muted" numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

/** Row of stat cards; every child takes an equal share of the width. */
export function StatRow({ children }: { children: ReactNode }) {
  return (
    <View style={styles.row}>
      {Children.map(children, (child) => (
        <View style={styles.cell}>{child}</View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius['2xl'],
  },
  panel: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ink: { backgroundColor: colors.ink },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    flexShrink: 1,
  },
  suffixLime: { color: colors.lime },
  row: { flexDirection: 'row', gap: spacing.sm },
  cell: { flex: 1 },
});
