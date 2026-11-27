import { Pressable, StyleSheet, View } from 'react-native';

import { spacing } from '../../theme/tokens';
import { IconButton } from './IconButton';
import { Text } from './Text';

export type SectionHeaderProps = {
  title: string;
  /** Optional small text action on the right, e.g. "Lihat semua". */
  actionLabel?: string;
  onAction?: () => void;
  /** Sort control: icon only, label describes the current order for screen readers. */
  sortLabel?: string;
  onSort?: () => void;
};

/** Overline label between sections, with an optional text action or sort icon. */
export function SectionHeader({
  title,
  actionLabel,
  onAction,
  sortLabel,
  onSort,
}: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text
        variant="label"
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
      {sortLabel && onSort ? (
        <IconButton
          icon="swap-vertical-outline"
          variant="ghost"
          accessibilityLabel={sortLabel}
          onPress={onSort}
        />
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
