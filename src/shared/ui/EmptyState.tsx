import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  colors,
  radius,
  shadow,
  spacing,
  typography,
} from '../../theme/tokens';

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.mark} accessibilityElementsHidden>
        <Text style={styles.markGlyph}>◎</Text>
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.description}>{description}</Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Sticker sheet empty state: dashed border, surface tint, centered
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius['2xl'],
    padding: spacing['2xl'],
    gap: 12,
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
  markGlyph: { ...typography.title, color: colors.violet, fontSize: 22 },
  title: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'center',
    maxWidth: 240,
  },
  action: { marginTop: spacing.sm },
});
