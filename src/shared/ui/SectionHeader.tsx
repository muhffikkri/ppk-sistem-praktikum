import { Pressable, StyleSheet, View } from 'react-native';

import { spacing } from '../../theme/tokens';
import { Text } from './Text';

export type SectionHeaderProps = {
  title: string;
  /** Optional small text action on the right, e.g. "Lihat semua". */
  actionLabel?: string;
  onAction?: () => void;
};

/** Overline label between sections, with an optional text action. */
export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text
        variant="overline"
        tone="muted"
        accessibilityRole="header"
        numberOfLines={1}
        style={styles.title}
      >
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          hitSlop={12}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text variant="captionStrong" tone="violet">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: { flexShrink: 1 },
  pressed: { opacity: 0.6 },
});
