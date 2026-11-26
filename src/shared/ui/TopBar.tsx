import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '../../theme/tokens';
import { IconButton } from './IconButton';
import { Text } from './Text';

export type TopBarProps = {
  title?: string;
  /** Shows a back button when provided. */
  onBack?: () => void;
  backLabel?: string;
  /** Right-hand slot, e.g. an `IconButton`. */
  trailing?: ReactNode;
};

/** Bar for pushed screens (detail, form): back + title + trailing slot. */
export function TopBar({
  title,
  onBack,
  backLabel = 'Kembali',
  trailing,
}: TopBarProps) {
  return (
    <View style={styles.bar}>
      {onBack ? (
        <IconButton
          icon="chevron-back"
          variant="outline"
          accessibilityLabel={backLabel}
          onPress={onBack}
        />
      ) : null}
      <Text
        variant="bodyStrong"
        accessibilityRole="header"
        numberOfLines={1}
        style={styles.title}
      >
        {title}
      </Text>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.panel,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { flex: 1 },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
