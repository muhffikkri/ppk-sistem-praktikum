import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '../../theme/tokens';

export type DockTab = {
  key: string;
  label: string;
  /** Simple glyph. Use an icon-font char or unicode for now. */
  glyph: string;
};

type BottomDockProps = {
  tabs: DockTab[];
  activeKey: string;
  onTabPress: (key: string) => void;
  /** Optional center floating action. */
  fab?: { glyph: string; label: string; onPress: () => void };
};

/**
 * Mobile bottom dock (sticker sheet "BottomNavigationPreview").
 * Ink background, rounded top, active tab = lime. Responsive: flex-based
 * layout so it adapts to any screen width.
 */
export function BottomDock({
  tabs,
  activeKey,
  onTabPress,
  fab,
}: BottomDockProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.row}>
        {tabs.map((tab, index) => {
          const active = tab.key === activeKey;
          // FAB replaces the middle slot visually.
          const isFabSlot = fab ? index === Math.floor(tabs.length / 2) : false;
          if (isFabSlot && fab) {
            return (
              <Pressable
                key={tab.key}
                accessibilityRole="button"
                accessibilityLabel={fab.label}
                onPress={fab.onPress}
                style={({ pressed }) => [
                  styles.fab,
                  pressed && styles.fabPressed,
                ]}
              >
                <Text style={styles.fabGlyph} accessible={false}>
                  {fab.glyph}
                </Text>
              </Pressable>
            );
          }
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onTabPress(tab.key)}
              style={styles.tab}
            >
              <Text
                style={[
                  styles.tabGlyph,
                  { color: active ? colors.lime : colors.inkMuted },
                ]}
                accessible={false}
              >
                {tab.glyph}
              </Text>
              <Text
                style={[
                  styles.tabLabel,
                  { color: active ? colors.lime : colors.inkMuted },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
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
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    minHeight: 48,
    justifyContent: 'center',
  },
  tabGlyph: { ...typography.title, fontSize: 18 },
  tabLabel: { ...typography.caption, fontSize: 9, fontWeight: '600' },
  fab: {
    width: 52,
    height: 52,
    borderRadius: radius['2xl'],
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.ink,
    marginTop: -20,
  },
  fabPressed: { backgroundColor: colors.limeHover },
  fabGlyph: { fontSize: 22, color: colors.ink },
});
