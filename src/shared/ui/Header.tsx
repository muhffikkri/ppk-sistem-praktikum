import { StyleSheet, Text, View } from 'react-native';

import { colors } from './theme';

type HeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function Header({ eyebrow, title, description }: HeaderProps) {
  return (
    <View style={styles.container}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  title: { color: colors.ink, fontSize: 30, lineHeight: 38, fontWeight: '700' },
  description: { color: colors.muted, fontSize: 16, lineHeight: 25 },
});
