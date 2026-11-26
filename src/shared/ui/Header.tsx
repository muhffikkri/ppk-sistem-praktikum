import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../../theme/tokens';
import { Text } from './Text';

export type HeaderProps = {
  eyebrow?: string;
  title: string;
  /**
   * Trailing fragment of the title set in italic violet (`displayAccent`).
   * Use on the main page title only — at most once per screen.
   */
  accent?: string;
  description?: string;
  /** On a violet/ink surface: switches every line to on-dark tones. */
  dark?: boolean;
  /** Optional badge/action aligned to the right of the title row. */
  trailing?: ReactNode;
};

export function Header({
  eyebrow,
  title,
  accent,
  description,
  dark,
  trailing,
}: HeaderProps) {
  return (
    <View style={styles.container}>
      {eyebrow ? (
        <Text variant="caption" tone={dark ? 'onDarkMuted' : 'muted'}>
          {eyebrow}
        </Text>
      ) : null}
      <View style={styles.titleRow}>
        <Text
          variant="display"
          tone={dark ? 'onDark' : 'ink'}
          accessibilityRole="header"
          style={styles.titleText}
        >
          {title}
          {accent ? (
            <Text variant="displayAccent" tone={dark ? 'onDark' : 'violet'}>
              {` ${accent}`}
            </Text>
          ) : null}
        </Text>
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      {description ? (
        <Text variant="body" tone={dark ? 'onDarkMuted' : 'muted'}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleText: { flexShrink: 1 },
  trailing: { flexShrink: 0 },
});
