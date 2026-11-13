import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, type PressableProps, StyleSheet } from 'react-native';

import { colors, radius } from '../../theme/tokens';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type IconButtonVariant = 'ghost' | 'soft' | 'outline';

export type IconButtonProps = Omit<
  PressableProps,
  'children' | 'style' | 'accessibilityLabel'
> & {
  icon: IconName;
  /** Required: an icon has no visible text for screen readers to announce. */
  accessibilityLabel: string;
  variant?: IconButtonVariant;
};

const SIZE = 40;
// Extends the 40px visual target to the 44px minimum touch target.
const HIT_SLOP = (44 - SIZE) / 2;

const iconColor: Record<IconButtonVariant, string> = {
  ghost: colors.ink,
  soft: colors.violet,
  outline: colors.ink,
};

/** Sticker sheet Section 02 "Loading and Icon States": 40×40 icon control. */
export function IconButton({
  icon,
  variant = 'outline',
  disabled,
  ...pressableProps
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={HIT_SLOP}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !disabled && styles[`${variant}Pressed`],
        disabled && styles.disabled,
      ]}
      {...pressableProps}
    >
      <Ionicons name={icon} size={20} color={iconColor[variant]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghost: {},
  ghostPressed: { backgroundColor: colors.lavenderSubtle },
  soft: { backgroundColor: colors.lavender, borderColor: colors.lavender },
  softPressed: { backgroundColor: colors.lavenderSubtle },
  outline: { backgroundColor: colors.panel, borderColor: colors.border },
  outlinePressed: { backgroundColor: colors.surface },
  disabled: { opacity: 0.5 },
});
