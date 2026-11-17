import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing } from '../../theme/tokens';
import type { IconName } from './IconButton';
import { Text } from './Text';

export type AppTopBarProps = {
  /** Product mark: a single solid-color glyph (unslop pass 7: flat, no gradient tile). */
  logoIcon: IconName;
  /** Product / screen name shown next to the logo. */
  title: string;
  /** Right-hand actions, e.g. notification + profile IconButtons. */
  trailing?: ReactNode;
};

/**
 * Persistent app top bar (unslop: quiet chrome, 56px tall, logo + name +
 * icon actions). Used on root-level screens that hide the native stack
 * header. The bottom dock keeps its own 52px row, so this bar sits above
 * the scrollable screen content only.
 */
export function AppTopBar({ logoIcon, title, trailing }: AppTopBarProps) {
  return (
    <View style={styles.bar}>
      <View style={styles.brand}>
        <View style={styles.logo} accessibilityElementsHidden>
          <Ionicons name={logoIcon} size={20} color={colors.violet} />
        </View>
        <Text variant="bodyStrong" style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {trailing ? <View style={styles.actions}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.panel,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    flexShrink: 1,
  },
  // Flat solid-tint square (no gradient, no sparkle) — unslop logo rule.
  logo: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.lavenderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.ink, flexShrink: 1 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
