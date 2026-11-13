import {
  Text as RNText,
  type TextProps as RNTextProps,
  StyleSheet,
} from 'react-native';

import { colors, typography } from '../../theme/tokens';

export type TextVariant = keyof typeof typography;

export type TextTone =
  'ink' | 'muted' | 'violet' | 'onDark' | 'onDarkMuted' | 'success' | 'danger';

const toneColor: Record<TextTone, string> = {
  ink: colors.ink,
  muted: colors.inkMuted,
  violet: colors.violet,
  onDark: colors.onPrimary,
  onDarkMuted: colors.onInkMuted,
  success: colors.successInk,
  danger: colors.dangerInk,
};

export type TextProps = RNTextProps & {
  /** Type scale token from design.md (default `body`). */
  variant?: TextVariant;
  /** Semantic text color (default `ink`). */
  tone?: TextTone;
};

/**
 * Design-system text. Screens use this instead of `Text` from react-native so
 * font family, size and line height always come from the type scale. Pass
 * `style` only for layout (margins, alignment, flex), never for typography.
 */
export function Text({
  variant = 'body',
  tone = 'ink',
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      style={[styles[variant], { color: toneColor[tone] }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create(typography);
