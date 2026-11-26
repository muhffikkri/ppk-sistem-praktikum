import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { spacing } from './theme';

export type StackGap = keyof typeof spacing;

export type StackProps = {
  children?: ReactNode;
  direction?: 'vertical' | 'horizontal';
  /** Nama token spacing, bukan angka mentah. */
  gap?: StackGap;
  style?: StyleProp<ViewStyle>;
};

const directionStyles = StyleSheet.create({
  vertical: { flexDirection: 'column' },
  horizontal: { flexDirection: 'row' },
});

const gapStyles = StyleSheet.create({
  xs: { gap: spacing.xs },
  sm: { gap: spacing.sm },
  md: { gap: spacing.md },
  lg: { gap: spacing.lg },
  xl: { gap: spacing.xl },
  '2xl': { gap: spacing['2xl'] },
  '3xl': { gap: spacing['3xl'] },
  '4xl': { gap: spacing['4xl'] },
});

/** Layout helper untuk gap/direction yang sebelumnya ditulis inline. */
export function Stack({
  children,
  direction = 'vertical',
  gap = 'md',
  style,
}: StackProps) {
  return (
    <View style={[directionStyles[direction], gapStyles[gap], style]}>
      {children}
    </View>
  );
}
