import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from './theme';

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View accessible={false} style={styles.mark}>
        <Text style={styles.markText}>—</Text>
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.description}>{description}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 24,
    gap: 14,
  },
  mark: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  markText: { fontSize: 22, color: colors.primary },
  title: { fontSize: 20, lineHeight: 28, fontWeight: '600', color: colors.ink },
  description: { fontSize: 15, lineHeight: 24, color: colors.muted },
});
