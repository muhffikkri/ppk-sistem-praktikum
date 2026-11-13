import { StyleSheet, View } from 'react-native';

import { spacing } from '../../theme/tokens';
import { Text } from './Text';

export type InfoRowProps = {
  label: string;
  value: string;
  /** Max lines for the value before it is truncated (default 2). */
  numberOfLines?: number;
};

/** Label on the left, value on the right; used in detail cards and sheets. */
export function InfoRow({ label, value, numberOfLines = 2 }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <Text variant="label" tone="muted">
        {label}
      </Text>
      <Text
        variant="bodyStrong"
        numberOfLines={numberOfLines}
        ellipsizeMode="tail"
        style={styles.value}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 32,
  },
  value: { flexShrink: 1, textAlign: 'right' },
});
