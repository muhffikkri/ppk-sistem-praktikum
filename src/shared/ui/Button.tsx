import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  View,
} from 'react-native';

import { colors, radius, shadow, spacing } from '../../theme/tokens';
import type { IconName } from './IconButton';
import { Text, type TextTone } from './Text';

type ButtonVariant =
  | 'primary' // violet solid
  | 'accent' // lime high-visibility
  | 'soft' // lavender soft
  | 'outline' // panel + border
  | 'destructive'; // red danger

type ButtonSize = 'md' | 'sm';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: ButtonVariant;
  /** `md` (48 high) by default; `sm` (40 high) for actions inside cards/banners. */
  size?: ButtonSize;
  /**
   * Small 40x40 icon button. Prefer `IconButton`, which requires an
   * accessibility label; kept for existing screens.
   */
  iconOnly?: boolean;
  /** Ionicons name rendered before the label. */
  icon?: IconName;
  loading?: boolean;
};

const labelTone: Record<ButtonVariant, TextTone> = {
  primary: 'onDark',
  accent: 'ink',
  soft: 'violet',
  outline: 'ink',
  destructive: 'danger',
};

const contentColor: Record<ButtonVariant, string> = {
  primary: colors.onPrimary,
  accent: colors.ink,
  soft: colors.violet,
  outline: colors.ink,
  destructive: colors.dangerInk,
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  iconOnly = false,
  icon,
  loading = false,
  disabled,
  ...pressableProps
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const color = disabled ? colors.inkMuted : contentColor[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={iconOnly ? label : undefined}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        styles[size],
        iconOnly && styles.iconOnly,
        styles[variant],
        !isDisabled && pressed && styles[`${variant}Pressed`],
        disabled && styles.disabled,
      ]}
      {...pressableProps}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator size="small" color={color} />
        ) : icon ? (
          <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={color} />
        ) : null}
        {!iconOnly && (
          <Text
            variant={size === 'sm' ? 'label' : 'bodyStrong'}
            tone={disabled ? 'muted' : labelTone[variant]}
            numberOfLines={1}
            style={styles.label}
          >
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius['2xl'], // 18px, sticker sheet buttons
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...shadow.card,
  },
  md: { minHeight: 48, paddingHorizontal: spacing['2xl'] },
  sm: { minHeight: 40, paddingHorizontal: spacing.lg },
  iconOnly: {
    width: 40,
    height: 40,
    minHeight: 40,
    paddingHorizontal: 0,
    borderRadius: radius.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: { textAlign: 'center', flexShrink: 1 },

  // Sticker sheet variants
  primary: { backgroundColor: colors.violet, borderColor: colors.violet },
  primaryPressed: { backgroundColor: colors.violetDark },
  accent: { backgroundColor: colors.lime, borderColor: colors.lime },
  accentPressed: { backgroundColor: colors.limeHover },
  soft: { backgroundColor: colors.lavender, borderColor: colors.lavender },
  softPressed: { backgroundColor: colors.lavenderSubtle },
  outline: { backgroundColor: colors.panel, borderColor: colors.border },
  outlinePressed: { backgroundColor: colors.surface },
  destructive: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerBorder,
  },
  destructivePressed: { backgroundColor: colors.dangerBorder },

  disabled: {
    backgroundColor: colors.disabled,
    borderColor: colors.disabled,
    opacity: 0.7,
  },
});
