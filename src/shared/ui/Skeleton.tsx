import { useEffect, useMemo, type ReactNode } from 'react';
import { StyleSheet, type StyleProp, View, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius, spacing } from '../../theme/tokens';

const SHIMMER_DURATION = 900;

export type SkeletonProps = {
  /** Width in px or percent; defaults to the full width of the parent. */
  width?: number | `${number}%`;
  height?: number;
  /** Circle (avatar/icon) instead of a rounded line/block. */
  circle?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Decorative placeholder with a soft shimmer. Shown while data is loading so
 * the final layout is already visible. Individual blocks are not announced to
 * screen readers — wrap a group in `SkeletonGroup` for that.
 */
export function Skeleton({
  width,
  height = spacing.md,
  circle = false,
  style,
}: SkeletonProps) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(progress);
      progress.value = 0;
      return;
    }
    progress.value = withRepeat(
      withTiming(1, {
        duration: SHIMMER_DURATION,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
    return () => cancelAnimation(progress);
  }, [progress, reducedMotion]);

  const shimmer = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.borderSubtle, colors.lavender],
    ),
  }));

  const sizeStyle = useMemo(
    () => ({
      width: width ?? '100%',
      height,
      borderRadius: circle ? radius.full : radius.sm,
    }),
    [circle, height, width],
  );

  return (
    <Animated.View
      accessible={false}
      style={[styles.block, sizeStyle, shimmer, style]}
    />
  );
}

export type SkeletonGroupProps = {
  children: ReactNode;
  label?: string;
};

/** Loading announcement for a set of decorative skeleton blocks. */
export function SkeletonGroup({
  children,
  label = 'Memuat…',
}: SkeletonGroupProps) {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} accessible>
      {children}
    </View>
  );
}

/** Shape of the placeholder — mirrors the real list item it replaces. */
export type SkeletonVariant = 'card' | 'row' | 'hero';

export type SkeletonItemProps = {
  variant?: SkeletonVariant;
};

export function SkeletonItem({ variant = 'row' }: SkeletonItemProps) {
  if (variant === 'hero') {
    return (
      <View style={styles.hero} accessible={false}>
        <Skeleton width="45%" height={spacing.lg} />
        <Skeleton width="80%" height={spacing.md} />
        <Skeleton width="60%" height={spacing.sm} />
        <View style={styles.avatarRow}>
          <Skeleton width={36} height={36} circle />
          <Skeleton width={36} height={36} circle />
          <Skeleton width={36} height={36} circle />
        </View>
      </View>
    );
  }

  if (variant === 'card') {
    return (
      <View style={styles.card} accessible={false}>
        <View style={styles.cardTop}>
          <Skeleton width="45%" height={spacing.sm} />
          <Skeleton width={64} height={spacing.lg} />
        </View>
        <Skeleton width="70%" height={spacing.md} />
        <Skeleton width="50%" height={spacing.sm} />
        <View style={styles.avatarRow}>
          <Skeleton width={36} height={36} circle />
          <Skeleton width={36} height={36} circle />
          <Skeleton width={36} height={36} circle />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.row} accessible={false}>
      <Skeleton width={36} height={36} circle />
      <View style={styles.rowLines}>
        <Skeleton width="70%" height={spacing.sm} />
        <Skeleton width="45%" height={spacing.sm} />
      </View>
    </View>
  );
}

export type SkeletonListProps = {
  count?: number;
  variant?: SkeletonVariant;
  label?: string;
};

/** Page-level placeholder: same rhythm as `ScreenList` with a loading label. */
export function SkeletonList({
  count = 5,
  variant = 'row',
  label = 'Memuat…',
}: SkeletonListProps) {
  return (
    <SkeletonGroup label={label}>
      <View style={styles.list}>
        {Array.from({ length: count }, (_, index) => (
          <SkeletonItem key={index} variant={variant} />
        ))}
      </View>
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.borderSubtle },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.panel,
  },
  rowLines: { flex: 1, gap: spacing.sm },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.panel,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  hero: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius['4xl'],
    backgroundColor: colors.lavenderSubtle,
  },
  avatarRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});
