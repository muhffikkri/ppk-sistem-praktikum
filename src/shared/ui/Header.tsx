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
};

export function Header({
  eyebrow,
  title,
  accent,
  description,
  dark,
}: HeaderProps) {
  return (
    <View style={styles.container}>
      {eyebrow ? (
        <Text variant="overline" tone={dark ? 'onDarkMuted' : 'violet'}>
          {eyebrow}
        </Text>
      ) : null}
      <Text
        variant="display"
        tone={dark ? 'onDark' : 'ink'}
        accessibilityRole="header"
      >
        {title}
        {accent ? (
          <Text variant="displayAccent" tone={dark ? 'onDark' : 'violet'}>
            {` ${accent}`}
          </Text>
        ) : null}
      </Text>
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
});
