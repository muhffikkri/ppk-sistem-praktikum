import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  colors,
  radius,
  shadow,
  spacing,
  typography,
} from '../../theme/tokens';

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
        onPress={() => onTabPress(tab.key)}
        style={styles.tabSlot}
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
        {fab ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={fab.label}
            onPress={fab.onPress}
            style={({ pressed }) => [
              styles.fabSlot,
              pressed && styles.fabSlotPressed,
            ]}
          >
            <View style={styles.fab}>
              <Ionicons name={fab.glyph} size={24} color={colors.ink} />
            </View>
          </Pressable>
        ) : null}
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
  tabGlyph: { ...typography.title, fontSize: 20 },
  tabLabel: { ...typography.caption, fontSize: 9, fontWeight: '600' },
  fabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabSlotPressed: { opacity: 0.85 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: radius['2xl'],
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.ink,
    marginTop: -24,
    ...shadow.elevated,
  },
  fabGlyph: { ...typography.title, fontSize: 24, color: colors.ink },
});
