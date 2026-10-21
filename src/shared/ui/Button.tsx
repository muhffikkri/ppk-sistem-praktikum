import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { colors } from './theme';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: 'primary' | 'secondary';
};

export function Button({ label, variant = 'primary', disabled, ...props }: ButtonProps) {
  return (
    <Pressable
      {...props}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' ? styles.primary : styles.secondary,
        pressed && (variant === 'primary' ? styles.primaryPressed : styles.secondaryPressed),
        disabled && styles.disabled,
      ]}
    >
      <Text style={[
        styles.label,
        variant === 'primary' ? styles.primaryLabel : styles.secondaryLabel,
        disabled && styles.disabledLabel,
      ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderColor: colors.border },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  secondaryPressed: { backgroundColor: colors.primarySoft },
  disabled: { backgroundColor: colors.disabled, borderColor: colors.disabled },
  label: { fontSize: 16, fontWeight: '600', textAlign: 'center', flexShrink: 1 },
  primaryLabel: { color: colors.surface },
  secondaryLabel: { color: colors.primary },
  disabledLabel: { color: colors.muted },
});
