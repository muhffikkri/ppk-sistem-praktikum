import { Pressable, StyleSheet, View } from 'react-native';

import { spacing, Text } from '../../shared/ui';

type AuthSwitchLinkProps = {
  /** Muted sentence before the link, e.g. "Belum punya akun?" */
  prompt: string;
  /** Violet link text, e.g. "Daftar" */
  linkLabel: string;
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
};

/** Caption prompt + violet link to the sibling auth screen (Landing pattern). */
export function AuthSwitchLink({
  prompt,
  linkLabel,
  accessibilityLabel,
  onPress,
  disabled,
}: AuthSwitchLinkProps) {
  return (
    <View style={styles.row}>
      <Text variant="caption" tone="muted">
        {prompt}
      </Text>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        hitSlop={8}
        onPress={onPress}
        style={styles.link}
      >
        <Text variant="bodyStrong" tone="violet">
          {linkLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  link: { minHeight: 44, justifyContent: 'center' },
});
