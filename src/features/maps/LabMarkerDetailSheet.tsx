/**
 * LabMarkerDetailSheet — Sprint 3 (SRS-3.3)
 * Menampilkan detail laboratorium, informasi praktikum yang sedang berlangsung,
 * dan jadwal praktikum berikutnya per laboratorium.
 */
import { Pressable, StyleSheet, View } from 'react-native';
import { formatHourMinute } from '../../shared/format/date';
import { colors, radius, shadow, spacing } from '../../theme/tokens';
import { Text } from '../../shared/ui/Text';
import { StatusBadge } from '../../shared/ui/StatusBadge';
import { IconButton } from '../../shared/ui/IconButton';
import {
  calculateDistanceMeters,
  formatDistance,
} from '../../domain/geofenceRules';
import type { GeoCoordinates, LabActivity } from '../../domain/geoTypes';

type Props = {
  activity: LabActivity | null;
  userCoords: GeoCoordinates | null;
  onClose: () => void;
  onSelectSession?: (sessionId: string) => void;
};

function formatTime(isoString: string): string {
  return formatHourMinute(new Date(isoString));
}

export function LabMarkerDetailSheet({
  activity,
  userCoords,
  onClose,
  onSelectSession,
}: Props) {
  if (!activity) return null;

  const { lab, currentSession, nextSession, isOccupied } = activity;

  // Jarak dari posisi pengguna
  const distance = userCoords
    ? calculateDistanceMeters(userCoords, lab.coordinates)
    : null;
  const isInsideRadius =
    distance !== null ? distance <= lab.radiusMeters : null;

  return (
    <View style={styles.sheetContainer}>
      {/* Header Lab */}
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <Text variant="title">{lab.name}</Text>
          <Text variant="caption" tone="muted">
            {lab.building}
            {lab.floor ? ` · ${lab.floor}` : ''}
            {distance !== null ? ` · ${formatDistance(distance)} dari Anda` : ''}
          </Text>
        </View>

        <View style={styles.headerActionGroup}>
          <StatusBadge
            label={isOccupied ? 'Sedang Digunakan' : 'Tersedia'}
            tone={isOccupied ? 'violet' : 'success'}
            dot={isOccupied}
            live={isOccupied}
          />
          <IconButton
            icon="close-outline"
            accessibilityLabel="Tutup detail lab"
            onPress={onClose}
          />
        </View>
      </View>

      {/* Info Status Radius Presensi */}
      <View
        style={[
          styles.radiusBadge,
          isInsideRadius === true
            ? styles.radiusInside
            : styles.radiusOutside,
        ]}
      >
        <Text
          variant="caption"
          style={
            isInsideRadius === true
              ? styles.radiusTextInside
              : styles.radiusTextOutside
          }
        >
          {isInsideRadius === true
            ? `Dalam jangkauan presensi (Radius ${lab.radiusMeters} m)`
            : isInsideRadius === false
              ? `Di luar jangkauan presensi (Radius ${lab.radiusMeters} m)`
              : `Batas radius presensi: ${lab.radiusMeters} meter`}
        </Text>
      </View>

      {/* Bagian 1: Praktikum Sedang Berlangsung */}
      <View style={styles.sessionSection}>
        <Text variant="overline" tone="muted">
          Praktikum Sedang Berlangsung
        </Text>
        {currentSession ? (
          <Pressable
            style={styles.sessionCard}
            onPress={() => onSelectSession?.(currentSession.id)}
            accessibilityRole="button"
            accessibilityLabel={`Detail sesi ${currentSession.courseName}`}
          >
            <View style={styles.sessionCardTop}>
              <Text variant="bodyStrong">{currentSession.courseName}</Text>
              <StatusBadge
                label={
                  currentSession.status === 'open' ? 'Buka' : 'Berlangsung'
                }
                tone="violet"
                dot
                live
              />
            </View>
            <Text variant="caption" tone="muted">
              {currentSession.groupName}
              {currentSession.title ? ` · ${currentSession.title}` : ''}
            </Text>
            <Text variant="caption" tone="violet">
              Waktu: {formatTime(currentSession.startsAt)} -{' '}
              {formatTime(currentSession.endsAt)} WIB
            </Text>
          </Pressable>
        ) : (
          <View style={styles.emptySessionBox}>
            <Text variant="caption" tone="muted">
              Tidak ada aktivitas praktikum yang sedang berlangsung di lab ini.
            </Text>
          </View>
        )}
      </View>

      {/* Bagian 2: Praktikum Berikutnya */}
      <View style={styles.sessionSection}>
        <Text variant="overline" tone="muted">
          Praktikum Berikutnya
        </Text>
        {nextSession ? (
          <Pressable
            style={styles.sessionCard}
            onPress={() => onSelectSession?.(nextSession.id)}
            accessibilityRole="button"
            accessibilityLabel={`Detail sesi ${nextSession.courseName}`}
          >
            <View style={styles.sessionCardTop}>
              <Text variant="bodyStrong">{nextSession.courseName}</Text>
              <StatusBadge label="Terjadwal" tone="neutral" />
            </View>
            <Text variant="caption" tone="muted">
              {nextSession.groupName}
              {nextSession.title ? ` · ${nextSession.title}` : ''}
            </Text>
            <Text variant="caption" tone="muted">
              Waktu: {formatTime(nextSession.startsAt)} -{' '}
              {formatTime(nextSession.endsAt)} WIB
            </Text>
          </Pressable>
        ) : (
          <View style={styles.emptySessionBox}>
            <Text variant="caption" tone="muted">
              Tidak ada jadwal praktikum berikutnya untuk hari ini.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: colors.panel,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    padding: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadow.elevated,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerTextGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  headerActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  radiusBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  radiusInside: {
    backgroundColor: colors.successSoft,
  },
  radiusOutside: {
    backgroundColor: colors.surface,
  },
  radiusTextInside: {
    color: colors.successInk,
  },
  radiusTextOutside: {
    color: colors.inkMuted,
  },
  sessionSection: {
    gap: spacing.xs,
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  sessionCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptySessionBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
