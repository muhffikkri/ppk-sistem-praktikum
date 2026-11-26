import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, shadow, spacing } from '../../theme/tokens';
import { Button } from './Button';
import { Text } from './Text';

export type ErrorStateProps = {
  title?: string;
  /** Message from the service that failed. */
  message: string;
  /** Plain-language next step, e.g. "Periksa koneksi lalu coba lagi." */
  hint?: string;
  /** Shows a "Coba lagi" button when provided. */
  onRetry?: () => void;
  /** Optional secondary action when retry alone is not enough. */
  secondaryAction?: ReactNode;
};

/**
 * Full-page failure state: what failed, why, and what to do next. Visually
 * parallel to `EmptyState` so "no data" and "could not load" read differently.
 */
export function ErrorState({
  title = 'Gagal memuat data',
  message,
  hint,
  onRetry,
  secondaryAction,
}: ErrorStateProps) {
  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.mark} importantForAccessibility="no">
        <Ionicons
          name="alert-circle-outline"
          size={24}
          color={colors.dangerInk}
        />
      </View>
      <Text
        variant="bodyStrong"
        tone="ink"
        accessibilityRole="header"
        style={styles.title}
      >
        {title}
      </Text>
      <Text variant="body" tone="muted" style={styles.message}>
        {message}
      </Text>
      {hint ? (
        <Text variant="caption" tone="muted" style={styles.message}>
          {hint}
        </Text>
      ) : null}
      {onRetry || secondaryAction ? (
        <View style={styles.actions}>
          {onRetry ? (
            <Button
              label="Coba lagi"
              variant="primary"
              icon="refresh"
              onPress={onRetry}
            />
          ) : null}
          {secondaryAction}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.dangerBorder,
    borderRadius: radius['2xl'],
    padding: spacing['2xl'],
    gap: spacing.md,
    alignItems: 'center',
  },
  mark: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  title: { textAlign: 'center' },
  message: { textAlign: 'center', maxWidth: 260 },
  actions: { marginTop: spacing.sm, gap: spacing.sm, alignItems: 'center' },
});
