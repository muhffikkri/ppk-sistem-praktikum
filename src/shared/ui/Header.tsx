import { StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '../../theme/tokens';

export type HeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  dark?: boolean;
};

export function Header({ eyebrow, title, description, dark }: HeaderProps) {
  return (
    <View style={styles.container}>
      {eyebrow ? (
        <Text style={[styles.eyebrow, dark && styles.eyebrowDark]}>
          {eyebrow}
        </Text>
      ) : null}
      <Text
        accessibilityRole="header"
        style={[styles.title, dark && styles.titleDark]}
      >
        {title}
      </Text>
      {description ? (
        <Text style={[styles.description, dark && styles.descriptionDark]}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  eyebrow: { ...typography.overline, color: colors.violet },
  eyebrowDark: { color: 'rgba(255,255,255,0.7)' },
  title: { ...typography.display, color: colors.ink },
  titleDark: { color: colors.panel },
  description: { ...typography.body, color: colors.inkMuted },
  descriptionDark: { color: 'rgba(255,255,255,0.7)' },
});
