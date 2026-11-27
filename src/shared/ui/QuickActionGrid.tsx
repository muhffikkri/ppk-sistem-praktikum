import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';
import { Card } from './Card';
import type { IconName } from './IconButton';
import { Text } from './Text';

export type QuickActionTone = 'violet' | 'blue' | 'lime' | 'pink' | 'neutral';

export type QuickAction = {
  key: string;
  icon: IconName;
  label: string;
  tone: QuickActionTone;
  onPress: () => void;
};

const TONE: Record<QuickActionTone, { bg: string; fg: string }> = {
  violet: { bg: colors.lavenderSubtle, fg: colors.violet },
  blue: { bg: colors.blueSoft, fg: colors.blue },
  lime: { bg: colors.lime, fg: colors.ink },
  pink: { bg: colors.pink, fg: colors.pinkInk },
  neutral: { bg: colors.surface, fg: colors.inkMuted },
};

function QuickActionItem({ icon, label, tone, onPress }: QuickAction) {
  const t = TONE[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
    >
      <View style={[styles.icon, { backgroundColor: t.bg }]}>
        <Ionicons name={icon} size={20} color={t.fg} />
      </View>
      <Text variant="captionStrong" numberOfLines={1} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Baris pintasan beranda: ikon bertone di atas label pendek. */
export function QuickActionGrid({ actions }: { actions: QuickAction[] }) {
  return (
    <Card variant="panel" interactive={false} style={styles.grid}>
      {actions.map((action) => (
        <QuickActionItem {...action} key={action.key} />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    gap: spacing.xs,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
  },
  itemPressed: { opacity: 0.6 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { textAlign: 'center' },
});
