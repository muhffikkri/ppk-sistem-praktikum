import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';
import { Text } from './Text';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

export type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
  /** Let long chips (with counts) scroll horizontally instead of truncating. */
  scrollable?: boolean;
};

/** Sticker sheet Section 03 "Segmented switch": one active item on ink. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  scrollable = false,
}: SegmentedControlProps<T>) {
  const items = options.map((option) => {
    const selected = option.value === value;
    return (
      <Pressable
        key={option.value}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        accessibilityLabel={option.label}
        onPress={() => onChange(option.value)}
        style={[
          styles.item,
          scrollable ? styles.scrollItem : styles.fixedItem,
          selected && styles.itemSelected,
        ]}
      >
        <Text
          variant="bodyStrong"
          tone={selected ? 'onDark' : 'muted'}
          numberOfLines={1}
        >
          {option.label}
        </Text>
      </Pressable>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="tablist"
        accessibilityLabel={accessibilityLabel}
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {items}
      </ScrollView>
    );
  }

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={styles.container}
    >
      {items}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  item: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
  },
  fixedItem: { flex: 1 },
  scrollItem: { flexShrink: 0 },
  itemSelected: { backgroundColor: colors.ink },
});
