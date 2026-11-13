import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme/tokens';
import { Text, type TextTone } from './Text';

export type AvatarTone = 'lavender' | 'pink' | 'lime';

export type AvatarProps = {
  /** Real display name; initials are derived from it. */
  name: string;
  size?: 36 | 44;
  /** `lavender` default, `pink` for late, `lime` for present. */
  tone?: AvatarTone;
};

const toneStyle: Record<AvatarTone, { bg: string; text: TextTone }> = {
  lavender: { bg: colors.lavender, text: 'violet' },
  pink: { bg: colors.pink, text: 'pink' },
  lime: { bg: colors.lime, text: 'ink' },
};

export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0], words.at(-1)!] : words;
  return letters.map((word) => word[0].toUpperCase()).join('') || '?';
}

/** Section 06 avatar: initials on a tinted circle. */
export function Avatar({ name, size = 36, tone = 'lavender' }: AvatarProps) {
  const t = toneStyle[tone];
  return (
    <View
      accessible={false}
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        { backgroundColor: t.bg },
      ]}
    >
      <Text
        variant={size === 44 ? 'bodyStrong' : 'captionStrong'}
        tone={t.text}
      >
        {initialsOf(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});
