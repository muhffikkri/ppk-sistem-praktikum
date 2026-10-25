import {
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  colors,
  radius,
  shadow,
  spacing,
  typography,
} from '../../theme/tokens';

type ButtonVariant =
  | 'primary' // violet solid
  | 'accent' // lime high-visibility
  | 'soft' // lavender soft
  | 'outline' // panel + border
  | 'destructive'; // red danger

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: ButtonVariant;
  /** Small 40x40 icon button (sticker sheet "Loading and Icon States"). */
  iconOnly?: boolean;
  /** Leading glyph as plain text (unicode or icon-font char). */
  leadingIcon?: string;
  loading?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  iconOnly = false,
  leadingIcon,
  loading = false,
  disabled,
  ...pressableProps
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        iconOnly && styles.iconOnly,
        styles[variant],
        !isDisabled && pressed && styles[`${variant}Pressed`],
        isDisabled && styles.disabled,
      ]}
      {...pressableProps}
    >
      <View style={styles.row}>
        {loading ? (
          <View style={styles.spinner} accessibilityLabel="Memuat" />
        ) : leadingIcon ? (
          <Text style={styles.leadingIcon} accessible={false}>
            {leadingIcon}
          </Text>
        ) : null}
        <Text
          style={[
            styles.label,
            styles[`${variant}Label`],
            isDisabled && styles.disabledLabel,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: radius['2xl'], // 18px, sticker sheet buttons
    paddingHorizontal: spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...shadow.card,
  },
  iconOnly: {
    width: 40,
    height: 40,
    minHeight: 40,
    padding: 0,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  leadingIcon: {
    ...typography.label,
    fontSize: 14,
  },
  spinner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    borderTopColor: '#FFFFFF',
  },

  label: {
    ...typography.label,
    textAlign: 'center',
    flexShrink: 1,
  },

  // Sticker sheet variants
  primary: {
    backgroundColor: colors.violet,
    borderColor: colors.violet,
  },
  primaryPressed: { backgroundColor: colors.violetDark },
  primaryLabel: { color: colors.panel, fontWeight: '500' },

  accent: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  accentPressed: { backgroundColor: colors.limeHover },
  accentLabel: { color: colors.ink, fontWeight: '600' },

  soft: {
    backgroundColor: colors.lavender,
    borderColor: colors.lavender,
  },
  softPressed: { backgroundColor: colors.lavenderSubtle },
  softLabel: { color: colors.violet, fontWeight: '600' },

  outline: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
  },
  outlinePressed: { backgroundColor: colors.surface },
  outlineLabel: { color: colors.ink, fontWeight: '600' },

  destructive: {
    backgroundColor: colors.dangerSoft,
    borderColor: 'rgba(252, 165, 165, 0.4)',
  },
  destructivePressed: { backgroundColor: colors.dangerBorder },
  destructiveLabel: { color: colors.dangerInk, fontWeight: '600' },

  disabled: {
    backgroundColor: colors.disabled,
    borderColor: colors.disabled,
    opacity: 0.7,
  },
  disabledLabel: { color: colors.inkMuted },
});
