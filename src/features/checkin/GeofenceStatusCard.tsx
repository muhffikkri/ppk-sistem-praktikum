import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { GeofenceCheckResult } from '../../domain/geoTypes';
import {
  Card,
  CardContent,
  colors,
  radius,
  spacing,
  Text,
} from '../../shared/ui';

type GeofenceStatusCardProps = {
  geofence: GeofenceCheckResult | null;
  checkingLocation?: boolean;
};

export function GeofenceStatusCard({
  geofence,
  checkingLocation = false,
}: GeofenceStatusCardProps) {
  if (checkingLocation) {
    return (
      <Card interactive={false}>
        <CardContent>
          <View style={styles.row}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: colors.lavenderSubtle },
              ]}
            >
              <Ionicons
                name="navigate-outline"
                size={20}
                color={colors.violet}
              />
            </View>
            <View style={styles.textContainer}>
              <Text variant="captionStrong">Mendeteksi Posisi GPS…</Text>
              <Text variant="caption" tone="muted">
                Memverifikasi apakah perangkat berada di dalam lab.
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>
    );
  }

  if (!geofence) {
    return (
      <Card interactive={false}>
        <CardContent>
          <View style={styles.row}>
            <View
              style={[styles.iconBox, { backgroundColor: colors.borderSubtle }]}
            >
              <Ionicons
                name="location-outline"
                size={20}
                color={colors.inkMuted}
              />
            </View>
            <View style={styles.textContainer}>
              <Text variant="captionStrong">Lokasi Belum Terverifikasi</Text>
              <Text variant="caption" tone="muted">
                Tekan tombol periksa lokasi atau presensi untuk verifikasi
                radius.
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>
    );
  }

  const isInside = geofence.status === 'inside';
  const isInaccurate = geofence.status === 'inaccurate';

  const iconName = isInside
    ? 'checkmark-circle-outline'
    : isInaccurate
      ? 'warning-outline'
      : 'close-circle-outline';

  const iconColor = isInside
    ? colors.successInk
    : isInaccurate
      ? colors.pinkInk
      : colors.dangerInk;

  const boxBg = isInside
    ? colors.successSoft
    : isInaccurate
      ? colors.pink
      : colors.dangerSoft;

  const headerTitle = isInside
    ? 'Dalam Radius Lab'
    : isInaccurate
      ? 'Akurasi GPS Rendah'
      : geofence.status === 'outside'
        ? 'Di Luar Radius Lab'
        : 'Lokasi Belum Siap';

  return (
    <Card interactive={false}>
      <CardContent>
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: boxBg }]}>
            <Ionicons name={iconName} size={22} color={iconColor} />
          </View>
          <View style={styles.textContainer}>
            <Text variant="captionStrong" style={{ color: iconColor }}>
              {headerTitle}
            </Text>
            <Text variant="caption" tone="muted">
              {geofence.message}
            </Text>

            {geofence.distanceMeters != null && (
              <View style={styles.detailRow}>
                <Text variant="caption" tone="muted">
                  Jarak:{' '}
                  <Text variant="captionStrong">
                    {geofence.distanceMeters} m
                  </Text>
                </Text>
                {geofence.radiusMeters != null && (
                  <Text variant="caption" tone="muted">
                    Batas:{' '}
                    <Text variant="captionStrong">
                      {geofence.radiusMeters} m
                    </Text>
                  </Text>
                )}
                {geofence.accuracyMeters != null && (
                  <Text variant="caption" tone="muted">
                    Akurasi: ±
                    <Text variant="captionStrong">
                      {Math.round(geofence.accuracyMeters)} m
                    </Text>
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
});
