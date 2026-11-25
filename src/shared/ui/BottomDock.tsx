import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  colors,
  radius,
  ripple,
  shadow,
  spacing,
  typography,
} from '../../theme/tokens';
import { usePressFeedback } from './usePressFeedback';

// Borderless so the ripple reads as a circle on the dark dock.
const TAB_RIPPLE = { color: ripple.onDark, borderless: true, radius: 28 };
const FAB_RIPPLE = { color: ripple.onLight, borderless: true, radius: 36 };

/** How far the center FAB rises above the dock into the screen content. */
export const DOCK_FAB_OVERLAP = 30;

export type DockTab = {
  key: string;
  label: string;
  /** Ionicons icon name, e.g. 'grid', 'calendar', 'finger-print', 'person'. */
  glyph: ComponentProps<typeof Ionicons>['name'];
};

type BottomDockProps = {
  tabs: DockTab[];
  activeKey: string;
  onTabPress: (key: string) => void;
  /** Center floating action button (QR scanner placeholder). */
  fab?: {
    glyph: ComponentProps<typeof Ionicons>['name'];
    label: string;
    onPress: () => void;
  };
};

/** Center action. Scales on press via a shared value (UI thread). */
function DockFab({
  glyph,
  label,
  onPress,
}: NonNullable<BottomDockProps['fab']>) {
  const { scaleStyle, handlers } = usePressFeedback();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      android_ripple={FAB_RIPPLE}
      style={styles.fabSlot}
      {...handlers}
    >
      <Animated.View style={[styles.fab, scaleStyle]}>
        <Ionicons name={glyph} size={32} color={colors.ink} />
      </Animated.View>
    </Pressable>
  );
}

/**
 * Mobile bottom dock (sticker sheet "BottomNavigationPreview").
 * 5 slots: [tab] [tab] [FAB] [tab] [tab].
 * Ink background, rounded top, active tab = lime. Responsive:
 * flex-based layout so it adapts to any screen width.
 */
export function BottomDock({
  tabs,
  activeKey,
  onTabPress,
  fab,
}: BottomDockProps) {
  const insets = useSafeAreaInsets();

  // Split the 4 tabs so the row reads [tab] [tab] [FAB] [tab] [tab].
  // Pass an even-length tab list (4) to get a centered FAB slot.
  const half = Math.floor(tabs.length / 2);
  const leftTabs = tabs.slice(0, half);
  const rightTabs = tabs.slice(half);

  const renderTab = (tab: DockTab) => {
    const active = tab.key === activeKey;
    const iconColor = active ? colors.lime : colors.inkMuted;
    return (
      <Pressable
        key={tab.key}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={() => {
          // One selection tick per actual tab change; the ripple is the
          // visual that stands on its own when haptics are off.
          if (!active) void Haptics.selectionAsync();
          onTabPress(tab.key);
        }}
        android_ripple={TAB_RIPPLE}
        style={({ pressed }) => [
          styles.tabSlot,
          pressed && styles.tabSlotPressed,
        ]}
      >
        <Ionicons name={tab.glyph} size={22} color={iconColor} />
        <Text style={[styles.tabLabel, { color: iconColor }]}>{tab.label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.row}>
        {leftTabs.map(renderTab)}
        {fab ? <DockFab {...fab} /> : null}
        {rightTabs.map(renderTab)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    backgroundColor: colors.ink,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    paddingTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Each tab + the FAB slot get equal horizontal space.
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: spacing.sm,
    minHeight: 52,
  },
  tabSlotPressed: { opacity: 0.7 },
  tabGlyph: { ...typography.title, fontSize: 20 },
  tabLabel: { ...typography.caption, fontSize: 9, fontWeight: '600' },
  fabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 72,
    height: 72,
    borderRadius: radius['2xl'],
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.ink,
    marginTop: -DOCK_FAB_OVERLAP,
    ...shadow.elevated,
  },
  fabGlyph: { ...typography.title, fontSize: 24, color: colors.ink },
});
