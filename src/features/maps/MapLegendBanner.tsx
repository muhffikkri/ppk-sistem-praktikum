/**
 * MapLegendBanner — Sprint 3 (SRS-3.3)
 * Menampilkan petunjuk warna marker dan filter status keterisian laboratorium.
 */
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../theme/tokens';
import { Text } from '../../shared/ui/Text';
import type { LabMapFilter } from '../../domain/geoTypes';

type Props = {
  activeFilter: LabMapFilter;
  onFilterChange: (filter: LabMapFilter) => void;
  stats: {
    total: number;
    occupied: number;
    available: number;
  };
};

export function MapLegendBanner({
  activeFilter,
  onFilterChange,
  stats,
}: Props) {
  return (
    <View style={styles.container}>
      {/* Baris Keterangan Marker */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, styles.dotSuccess]} />
          <Text variant="caption" tone="muted">
            Tersedia
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.dot, styles.dotOccupied]} />
          <Text variant="caption" tone="muted">
            Sedang Berlangsung
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.dot, styles.dotUser]} />
          <Text variant="caption" tone="muted">
            Posisi Anda
          </Text>
        </View>
      </View>

      {/* Baris Filter Chip */}
      <View style={styles.filterRow}>
        <Pressable
          style={[
            styles.chip,
            activeFilter === 'all' ? styles.chipActive : styles.chipInactive,
          ]}
          onPress={() => onFilterChange('all')}
          accessibilityRole="button"
          accessibilityLabel="Tampilkan semua laboratorium"
        >
          <Text
            variant="caption"
            style={
              activeFilter === 'all'
                ? styles.chipTextActive
                : styles.chipTextInactive
            }
          >
            Semua ({stats.total})
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.chip,
            activeFilter === 'occupied'
              ? styles.chipActive
              : styles.chipInactive,
          ]}
          onPress={() => onFilterChange('occupied')}
          accessibilityRole="button"
          accessibilityLabel="Filter laboratorium yang sedang digunakan"
        >
          <Text
            variant="caption"
            style={
              activeFilter === 'occupied'
                ? styles.chipTextActive
                : styles.chipTextInactive
            }
          >
            Aktif ({stats.occupied})
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.chip,
            activeFilter === 'available'
              ? styles.chipActive
              : styles.chipInactive,
          ]}
          onPress={() => onFilterChange('available')}
          accessibilityRole="button"
          accessibilityLabel="Filter laboratorium yang kosong"
        >
          <Text
            variant="caption"
            style={
              activeFilter === 'available'
                ? styles.chipTextActive
                : styles.chipTextInactive
            }
          >
            Kosong ({stats.available})
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
  },
  dotSuccess: {
    backgroundColor: colors.success,
  },
  dotOccupied: {
    backgroundColor: colors.violet,
  },
  dotUser: {
    backgroundColor: colors.blue,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: colors.violet,
    borderColor: colors.violet,
  },
  chipInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  chipTextActive: {
    color: colors.onPrimary,
  },
  chipTextInactive: {
    color: colors.inkMuted,
  },
});
