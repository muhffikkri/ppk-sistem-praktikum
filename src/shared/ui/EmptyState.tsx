import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, shadow, spacing } from '../../theme/tokens';
import { Text } from './Text';

type EmptyStateProps = {
  title: string;
  description: string;
  /** Ionicons name shown in the panel tile. */
  icon?: ComponentProps<typeof Ionicons>['name'];
  action?: ReactNode;
};

/** Sticker sheet empty state: dashed border, surface tint, centered icon tile. */
export function EmptyState({
  title,
  description,
  icon = 'file-tray-outline',
  action,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.mark} importantForAccessibility="no">
        <Ionicons name={icon} size={24} color={colors.violet} />
      </View>
      <Text
        variant="bodyStrong"
        tone="ink"
        accessibilityRole="header"
        style={styles.title}
      >
        {title}
      </Text>
      <Text variant="body" tone="muted" style={styles.description}>
        {description}
      </Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius['2xl'],
    padding: spacing['2xl'],
    gap: spacing.md,
    alignItems: 'center',
  },
  mark: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  title: { textAlign: 'center' },
  description: { textAlign: 'center', maxWidth: 240 },
  action: { marginTop: spacing.sm },
});
