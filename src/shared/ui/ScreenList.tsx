import {
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { SkeletonItem } from './Skeleton';

const LOAD_MORE_DELAY = 100;

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
  /** Rows revealed per batch. Defaults to 10. */
  pageSize?: number;
};

/**
 * `Screen` for long lists. Same safe area, padding and dock clearance, but
 * rows render through a virtualized FlatList and are revealed batch by batch,
 * so only rows near the viewport are mounted at any time.
 */
export function ScreenList<T>({
  data,
  renderItem,
  keyExtractor,
  header,
  sectionHeader,
  empty,
  withDock = true,
  pageSize = 10,
}: ScreenListProps<T>) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isNarrow = width < 600;

  const [revealed, setRevealed] = useState(pageSize);
  const [loadingMore, setLoadingMore] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const visibleCount = Math.min(revealed, data.length);
  const visibleData = useMemo(
    () => data.slice(0, visibleCount),
    [data, visibleCount],
  );
  const hasMore = visibleCount < data.length;

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    timer.current = setTimeout(() => {
      setRevealed((count) => count + pageSize);
      setLoadingMore(false);
      timer.current = null;
    }, LOAD_MORE_DELAY);
  }, [hasMore, loadingMore, pageSize]);

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
        data={visibleData}
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
        ListFooterComponent={
          hasMore ? (
            <View style={styles.footer}>
              <SkeletonItem variant="row" />
            </View>
          ) : undefined
        }
        ItemSeparatorComponent={RowGap}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
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
  footer: { marginTop: spacing.sm },
  rowGap: { height: spacing.sm },
});
