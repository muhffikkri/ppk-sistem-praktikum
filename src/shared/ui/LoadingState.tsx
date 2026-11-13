import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors, spacing } from '../../theme/tokens';
import { Text } from './Text';

export type LoadingStateProps = {
  label?: string;
};

/** The one loading block: violet spinner + muted label, centred. */
export function LoadingState({ label = 'Memuat…' }: LoadingStateProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      style={styles.container}
    >
      <ActivityIndicator color={colors.violet} />
      <Text variant="body" tone="muted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing['3xl'],
  },
});
