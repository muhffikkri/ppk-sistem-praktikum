import type { PropsWithChildren } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { colors, spacing } from '../../theme/tokens';

export function Screen({ children }: PropsWithChildren) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Responsive: single column on phones, capped comfortable reading width on
  // tablets. Use window width so it reflows when the device rotates or the
  // layout changes, rather than a fixed pixel value.
  const isNarrow = width < 600;

  return (
    <SafeAreaView edges={['left', 'right', 'top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        style={[
          styles.flex,
          { paddingBottom: Math.max(insets.bottom, 8) + 72 },
        ]}
      >
        <View style={[styles.content, !isNarrow && styles.contentWide]}>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.lg },
  content: { width: '100%', alignSelf: 'stretch', gap: 20 },
  // On wider devices center the content column with breathing room on both
  // sides; the max width is a fraction of the window, not a hard pixel cap.
  contentWide: {
    maxWidth: '70%',
    alignSelf: 'center',
  },
});
