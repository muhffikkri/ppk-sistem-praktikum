import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';
import { Text } from './Text';

export type ListRowProps = {
  title: string;
  /** Secondary line, e.g. NIM or check-in time. */
  meta?: string;
  /** Leading slot, usually an `Avatar`. */
  leading?: ReactNode;
  /** Trailing slot: status badge, chevron, menu. */
  trailing?: ReactNode;
  /** Destructive rows (e.g. Keluar) render the title in danger ink. */
  tone?: 'default' | 'danger';
  /** Makes the whole row pressable. */
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

/** Sticker sheet Section 06 row: panel pill with leading, text and trailing. */
export function ListRow({
  title,
  meta,
  leading,
  trailing,
  tone = 'default',
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: ListRowProps) {
  const content = (
    <>
      {leading}
      <View style={styles.text}>
        <Text
          variant="bodyStrong"
          tone={tone === 'danger' ? 'danger' : 'ink'}
          numberOfLines={1}
        >
          {title}
        </Text>
        {meta ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? [title, meta].join(', ')}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
  },
  pressed: {
    borderColor: colors.violet,
    backgroundColor: colors.lavenderSubtle,
  },
  text: { flex: 1, gap: 2 },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
