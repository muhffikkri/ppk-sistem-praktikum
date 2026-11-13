import { type ComponentRef, type ReactNode, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import {
  colors,
  radius,
  shadow,
  spacing,
  typography,
} from '../../theme/tokens';
import { Text } from './Text';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Shown below the field in danger tone; also styles the field as invalid. */
  error?: string;
  /** Helper text below the field; hidden while `error` is shown. */
  hint?: string;
  /** Trailing control inside the pill, e.g. a show-password `IconButton`. */
  rightAccessory?: ReactNode;
};

/** Sticker sheet Section 03 "Input floating pill". */
export function TextField({
  label,
  error,
  hint,
  rightAccessory,
  multiline,
  onFocus,
  onBlur,
  editable = true,
  ...inputProps
}: TextFieldProps) {
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);
  const invalid = !!error;

  return (
    <View style={styles.container}>
      <Pressable
        accessible={false}
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.pill,
          focused && styles.pillFocused,
          invalid && styles.pillError,
          !editable && styles.pillDisabled,
        ]}
      >
        <View style={styles.body}>
          <Text
            variant="overline"
            tone={invalid ? 'danger' : focused ? 'violet' : 'muted'}
            numberOfLines={1}
          >
            {label}
          </Text>
          <TextInput
            ref={inputRef}
            accessibilityLabel={label}
            accessibilityHint={error ?? hint}
            placeholderTextColor={colors.inkMuted}
            selectionColor={colors.violet}
            cursorColor={colors.violet}
            multiline={multiline}
            editable={editable}
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            style={[styles.input, multiline && styles.inputMultiline]}
            {...inputProps}
          />
        </View>
        {rightAccessory ? (
          <View style={styles.accessory}>{rightAccessory}</View>
        ) : null}
      </Pressable>
      {invalid ? (
        <Text variant="caption" tone="danger" style={styles.message}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted" style={styles.message}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

// The focused border is 1px thicker; padding shrinks by 1px so the text
// does not shift when focus changes.
const PAD = spacing.md;

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.panel,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: PAD,
    paddingTop: spacing.sm,
  },
  pillFocused: {
    borderWidth: 2,
    borderColor: colors.violet,
    padding: PAD - 1,
    paddingTop: spacing.sm - 1,
    ...shadow.subtle,
  },
  pillError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  pillDisabled: { backgroundColor: colors.surface },
  body: { flex: 1, gap: 2 },
  input: {
    ...typography.bodyStrong,
    color: colors.ink,
    minHeight: 24,
    padding: 0,
  },
  inputMultiline: { minHeight: 88, textAlignVertical: 'top' },
  accessory: { alignSelf: 'center' },
  message: { paddingHorizontal: spacing.xs },
});
