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

type GeofenceTone = 'inside' | 'inaccurate' | 'outside';

const toneBoxStyles = StyleSheet.create({
  inside: { backgroundColor: colors.successSoft },
  inaccurate: { backgroundColor: colors.pink },
  outside: { backgroundColor: colors.dangerSoft },
});

const toneTitleStyles = StyleSheet.create({
  inside: { color: colors.successInk },
  inaccurate: { color: colors.pinkInk },
  outside: { color: colors.dangerInk },
});

const toneIconColors = {
  inside: colors.successInk,
  inaccurate: colors.pinkInk,
  outside: colors.dangerInk,
} as const;

export function GeofenceStatusCard({
  geofence,
  checkingLocation = false,
}: GeofenceStatusCardProps) {
  if (checkingLocation) {
    return (
      <Card interactive={false}>
        <CardContent>
          <View style={styles.row}>
            <View style={[styles.iconBox, styles.checkingBox]}>
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
            <View style={[styles.iconBox, styles.unknownBox]}>
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

  const tone: GeofenceTone = isInside
    ? 'inside'
    : isInaccurate
      ? 'inaccurate'
      : 'outside';

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
          <View style={[styles.iconBox, toneBoxStyles[tone]]}>
            <Ionicons name={iconName} size={22} color={toneIconColors[tone]} />
          </View>
          <View style={styles.textContainer}>
            <Text variant="captionStrong" style={toneTitleStyles[tone]}>
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
  checkingBox: {
    backgroundColor: colors.lavenderSubtle,
  },
  unknownBox: {
    backgroundColor: colors.borderSubtle,
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
