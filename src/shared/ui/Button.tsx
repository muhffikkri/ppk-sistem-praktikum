import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  type PressableProps,
  StyleSheet,
  View,
} from 'react-native';
import { interpolateColor, useAnimatedStyle } from 'react-native-reanimated';

import { colors, radius, shadow, spacing } from '../../theme/tokens';
import type { IconName } from './IconButton';
import { androidClip, rippleOnDark, rippleOnLight } from './ripple';
import { Text, type TextTone } from './Text';
import {
  AnimatedPressable,
  usePressFeedback,
  usePressShadow,
} from './usePressFeedback';

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
  /** Custom leading icon (for example a multi-color SVG logo). */
  iconElement?: ReactNode;
  loading?: boolean;
};

const labelTone: Record<ButtonVariant, TextTone> = {
  primary: 'onDark',
  accent: 'ink',
  soft: 'violet',
  outline: 'ink',
  destructive: 'danger',
};

// Resting and pressed fills, interpolated on the UI thread while pressed.
const fillColor: Record<ButtonVariant, [string, string]> = {
  primary: [colors.violet, colors.violetDark],
  accent: [colors.lime, colors.limeHover],
  soft: [colors.lavender, colors.lavenderSubtle],
  outline: [colors.panel, colors.surface],
  destructive: [colors.dangerSoft, colors.dangerBorder],
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
  iconElement,
  loading = false,
  disabled,
  onPressIn,
  onPressOut,
  ...pressableProps
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const color = disabled ? colors.inkMuted : contentColor[variant];
  const { progress, scaleStyle, handlers } = usePressFeedback({
    onPressIn,
    onPressOut,
  });
  const [rest, pressedFill] = fillColor[variant];
  // Disabled buttons keep the static disabled fill.
  const animateFill = !isDisabled;
  const fillStyle = useAnimatedStyle(() =>
    animateFill
      ? {
          backgroundColor: interpolateColor(
            progress.get(),
            [0, 1],
            [rest, pressedFill],
          ),
        }
      : {},
  );
  const pressShadowStyle = usePressShadow(progress, shadow.card);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={iconOnly ? label : undefined}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      // `sm`/`iconOnly` are 40px visually; 2px slop lifts the hit area to 44.
      hitSlop={2}
      android_ripple={variant === 'primary' ? rippleOnDark : rippleOnLight}
      style={[
        styles.button,
        styles[size],
        iconOnly && styles.iconOnly,
        styles[variant],
        disabled && styles.disabled,
        fillStyle,
        pressShadowStyle,
        scaleStyle,
      ]}
      {...pressableProps}
      {...handlers}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator size="small" color={color} />
        ) : iconElement ? (
          iconElement
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
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius['2xl'], // 18px, sticker sheet buttons
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...shadow.card,
    ...androidClip,
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
  accent: { backgroundColor: colors.lime, borderColor: colors.lime },
  soft: { backgroundColor: colors.lavender, borderColor: colors.lavender },
  outline: { backgroundColor: colors.panel, borderColor: colors.border },
  destructive: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerBorder,
  },

  disabled: {
    backgroundColor: colors.disabled,
    borderColor: colors.disabled,
    opacity: 0.7,
  },
});
