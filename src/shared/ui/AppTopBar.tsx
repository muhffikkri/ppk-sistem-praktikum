import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, spacing } from '../../theme/tokens';
import type { IconName } from './IconButton';
import { Text } from './Text';

export type AppTopBarProps = {
  /** Product mark: a solid-color glyph inside the lavender tile. */
  logoIcon: IconName;
  /** Product / screen name shown next to the logo. */
  title: string;
  /** Optional violet overline under the title, e.g. the current portal. */
  subtitle?: string;
  /** Right-hand shortcuts. Root screens only; pushed screens use `BackButton`. */
  trailing?: ReactNode;
};

/**
 * Root/navbar top bar. Mirrors the HTML reference `data-purpose="brand-header"`:
 * lavender square logo tile, bold product name + violet overline, and three
 * circular white shortcuts. Has no back button and no bottom border — pushed
 * screens show only `BackButton`.
 */
export function AppTopBar({
  logoIcon,
  title,
  subtitle,
  trailing,
}: AppTopBarProps) {
  return (
    <View style={styles.bar}>
      <View style={styles.brand}>
        <View style={styles.logo} accessibilityElementsHidden>
          <Ionicons name={logoIcon} size={20} color={colors.violet} />
        </View>
        <View style={styles.brandText}>
          <Text
            variant="brandTitle"
            tone="ink"
            accessibilityRole="header"
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text variant="overline" tone="violet" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {trailing ? <View style={styles.actions}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    flexShrink: 1,
  },
  // rounded-2xl tile with lavender-light fill and lavender border.
  logo: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.lavenderSubtle,
    borderWidth: 1,
    borderColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { flex: 1, flexShrink: 1, gap: spacing.xs },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
