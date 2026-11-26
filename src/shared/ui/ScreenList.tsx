import type { ReactElement, ReactNode } from 'react';
import {
  FlatList,
  type ListRenderItem,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { colors, spacing } from '../../theme/tokens';
import { DOCK_FAB_OVERLAP } from './BottomDock';

export type ScreenListProps<T> = {
  data: readonly T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  /** Blocks above the list (top bar, header, stats), spaced like `Screen`. */
  header?: ReactNode;
  /** Section title that sits close above the first row. */
  sectionHeader?: ReactNode;
  /** Shown instead of rows when `data` is empty. */
  empty?: ReactElement;
  /** Same meaning as `Screen`'s `withDock`. */
  withDock?: boolean;
};

/**
 * `Screen` for long lists. Same safe area, padding and dock clearance, but
 * rows render through a virtualized FlatList, so only rows near the
 * viewport are mounted.
 */
export function ScreenList<T>({
  data,
  renderItem,
  keyExtractor,
  header,
  sectionHeader,
  empty,
  withDock = true,
}: ScreenListProps<T>) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isNarrow = width < 600;

  const paddingBottom = withDock
    ? DOCK_FAB_OVERLAP + spacing['2xl']
    : insets.bottom + spacing['2xl'];

  return (
    <SafeAreaView edges={['left', 'right', 'top']} style={styles.safeArea}>
      <FlatList
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          !isNarrow && styles.contentWide,
          { paddingBottom },
        ]}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={
          header || sectionHeader ? (
            <View
              style={[
                styles.header,
                sectionHeader ? styles.headerToSection : styles.headerToRows,
              ]}
            >
              {header}
              {sectionHeader}
            </View>
          ) : undefined
        }
        ListEmptyComponent={empty}
        ItemSeparatorComponent={RowGap}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </SafeAreaView>
  );
}

function RowGap() {
  return <View style={styles.rowGap} />;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.lg },
  // Matches Screen's wide-device column.
  contentWide: { width: '70%', alignSelf: 'center' },
  header: { gap: spacing.xl },
  // Section title hugs the rows; other blocks keep Screen's block rhythm.
  headerToSection: { marginBottom: spacing.sm },
  headerToRows: { marginBottom: spacing.xl },
  rowGap: { height: spacing.sm },
});
