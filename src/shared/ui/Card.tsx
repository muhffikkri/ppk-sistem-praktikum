import {
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import type { ReactNode } from 'react';

import {
  colors,
  radius,
  shadow,
  spacing,
  typography,
} from '../../theme/tokens';

type CardVariant =
  | 'panel' // white panel + border + card shadow (sticker sheet default card)
  | 'surface' // app canvas tint + border
  | 'heroViolet' // deep violet gradient block (hero shift card)
  | 'heroInk' // dark ink block (dark analytics / shift)
  | 'lavender' // soft lavender block (shift variant)
  | 'pink'; // soft pink block (shift variant);
export type CardProps = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  variant?: CardVariant;
  /** Wrap the card in a Pressable (default true when onPress given). */
  interactive?: boolean;
  /** Extra layout styles (e.g. `flex: 1` for shrink-to-fill grids). */
  style?: StyleProp<ViewStyle>;
};

export function Card({
  children,
  variant = 'panel',
  interactive,
  style,
  ...pressableProps
}: CardProps) {
  const isInteractive = interactive ?? 'onPress' in pressableProps;

  if (!isInteractive) {
    return (
      <View
        style={[styles.base, styles[variant], style]}
        accessibilityRole="none"
      >
        {children}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        style,
        pressed && styles.pressed,
      ]}
      {...pressableProps}
    >
      {children}
    </Pressable>
  );
}

/** Standard content wrapper: padding 16, vertical rhythm 8. */
export function CardContent({ children }: { children: ReactNode }) {
  return <View style={styles.content}>{children}</View>;
}

/** Title row with optional trailing slot (badge / chevron / time). */
export function CardHeader({
  title,
  trailing,
  dark = false,
}: {
  title: string;
  trailing?: ReactNode;
  dark?: boolean;
}) {
  return (
    <View style={styles.headerRow}>
      <Text
        style={[styles.title, dark ? styles.titleDark : undefined]}
        numberOfLines={2}
      >
        {title}
      </Text>
      {trailing}
    </View>
  );
}

/** Eyebrow/overline label used above card titles (spec-label style). */
export function CardOverline({
  children,
  dark = false,
}: {
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <Text style={[styles.overline, dark ? styles.overlineDark : undefined]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius['3xl'], // 24 — section cards in sticker sheet
    overflow: 'hidden',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    ...typography.subtitle,
    color: colors.ink,
    flex: 1,
  },
  titleDark: { color: colors.panel },
  overline: {
    ...typography.overline,
    color: colors.inkMuted,
    textTransform: 'uppercase',
  },
  overlineDark: { color: 'rgba(255,255,255,0.6)' },
  pressed: { opacity: 0.92 },

  panel: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  surface: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroViolet: {
    backgroundColor: colors.violet,
    ...shadow.elevated,
  },
  heroInk: {
    backgroundColor: colors.ink,
    ...shadow.elevated,
  },
  lavender: {
    backgroundColor: colors.lavender,
    borderWidth: 1,
    borderColor: colors.lavender,
  },
  pink: {
    backgroundColor: colors.pink,
    borderWidth: 1,
    borderColor: colors.pink,
  },
});
