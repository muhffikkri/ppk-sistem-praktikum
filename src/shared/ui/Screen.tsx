import type { PropsWithChildren } from 'react';
import {
  ScrollView,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { colors, spacing } from '../../theme/tokens';
import { DOCK_FAB_OVERLAP } from './BottomDock';

export type ScreenProps = PropsWithChildren<{
  /**
   * The screen sits above the BottomDock (signed-in app). The dock already
   * pads for the system navigation bar, so only the FAB overhang is reserved.
   * Set `false` for auth screens, which must clear the system bar themselves.
   */
  withDock?: boolean;
  /**
   * Layout-only style for the content column. Pass
   * `{ flexGrow: 1, justifyContent: 'space-between' }` to pin the last block
   * to the bottom on tall phones while staying scrollable on short ones.
   */
  contentStyle?: StyleProp<ViewStyle>;
}>;

export function Screen({
  children,
  withDock = true,
  contentStyle,
}: ScreenProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Responsive: single column on phones, capped comfortable reading width on
  // tablets. Use window width so it reflows when the device rotates or the
  // layout changes, rather than a fixed pixel value.
  const isNarrow = width < 600;

  const paddingBottom = withDock
    ? DOCK_FAB_OVERLAP + spacing['2xl']
    : insets.bottom + spacing['2xl'];

  return (
    <SafeAreaView edges={['left', 'right', 'top']} style={styles.safeArea}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingBottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.content,
            !isNarrow && styles.contentWide,
            contentStyle,
          ]}
        >
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
  content: { width: '100%', alignSelf: 'stretch', gap: spacing.xl },
  // On wider devices center the content column with breathing room on both
  // sides; the max width is a fraction of the window, not a hard pixel cap.
  contentWide: {
    maxWidth: '70%',
    alignSelf: 'center',
  },
});
