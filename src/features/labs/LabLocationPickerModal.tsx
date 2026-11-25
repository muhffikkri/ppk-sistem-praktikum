/**
 * LabLocationPickerModal — Pemilihan Titik Laboratorium Interaktif (Ala Gojek)
 * Memungkinkan asisten memilih lokasi lab langsung di peta dengan tap, drag marker,
 * atau tombol GPS lokasi saat ini beserta visualisasi radius presensi.
 */
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  View,
} from 'react-native';
import MapView, { Circle, Marker, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DEFAULT_CAMPUS_CENTER } from '../../domain/geoTypes';
import { getCurrentDeviceLocation } from '../../services/location/deviceLocationService';
import { Button, IconButton, Text } from '../../shared/ui';
import { colors, radius, spacing } from '../../theme/tokens';

type Props = {
  visible: boolean;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  radiusMeters?: number;
  onConfirm: (coords: { latitude: number; longitude: number }) => void;
  onClose: () => void;
};

export function LabLocationPickerModal({
  visible,
  initialLatitude,
  initialLongitude,
  radiusMeters = 50,
  onConfirm,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const hasInitial =
    typeof initialLatitude === 'number' &&
    Number.isFinite(initialLatitude) &&
    typeof initialLongitude === 'number' &&
    Number.isFinite(initialLongitude);

  const [selectedCoords, setSelectedCoords] = useState<{
    latitude: number;
    longitude: number;
  }>({
    latitude: hasInitial ? initialLatitude : DEFAULT_CAMPUS_CENTER.latitude,
    longitude: hasInitial ? initialLongitude : DEFAULT_CAMPUS_CENTER.longitude,
  });

  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (visible) {
      const coords = {
        latitude: hasInitial ? initialLatitude : DEFAULT_CAMPUS_CENTER.latitude,
        longitude: hasInitial
          ? initialLongitude
          : DEFAULT_CAMPUS_CENTER.longitude,
      };
      setSelectedCoords(coords);
      setTimeout(() => {
        mapRef.current?.animateToRegion(
          {
            ...coords,
            latitudeDelta: 0.0035,
            longitudeDelta: 0.0035,
          },
          400,
        );
      }, 200);
    }
  }, [visible, hasInitial, initialLatitude, initialLongitude]);

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    try {
      const res = await getCurrentDeviceLocation();
      if (res.ok && res.fix) {
        const next = {
          latitude: res.fix.latitude,
          longitude: res.fix.longitude,
        };
        setSelectedCoords(next);
        mapRef.current?.animateToRegion(
          {
            ...next,
            latitudeDelta: 0.0025,
            longitudeDelta: 0.0025,
          },
          400,
        );
      }
    } finally {
      setLocating(false);
    }
  };

  const handleSelect = () => {
    onConfirm(selectedCoords);
    onClose();
  };

  const validRadius = Math.min(Math.max(radiusMeters, 10), 500);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Peta Interaktif Layar Penuh */}
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: selectedCoords.latitude,
            longitude: selectedCoords.longitude,
            latitudeDelta: 0.0035,
            longitudeDelta: 0.0035,
          }}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass
          toolbarEnabled={false}
          onPress={(e) => setSelectedCoords(e.nativeEvent.coordinate)}
        >
          {/* Lingkaran Radius Presensi Visual */}
          <Circle
            center={selectedCoords}
            radius={validRadius}
            fillColor={colors.mapCircleAvailable}
            strokeColor={colors.mapCircleAvailableBorder}
            strokeWidth={1.5}
          />

          {/* Marker Pin yang Bisa Di-drag */}
          <Marker
            coordinate={selectedCoords}
            draggable
            pinColor={colors.violet}
            title="Titik Laboratorium"
            description="Tahan lalu geser untuk memindahkan posisi"
            onDragEnd={(e) => setSelectedCoords(e.nativeEvent.coordinate)}
          />
        </MapView>

        {/* Floating Top Bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <IconButton
            icon="close-outline"
            accessibilityLabel="Tutup peta"
            onPress={onClose}
          />
          <View style={styles.topBarCard}>
            <Text variant="title">Tentukan Titik Lab</Text>
            <Text variant="caption" tone="muted">
              Ketuk peta atau geser pin ke gedung lab
            </Text>
          </View>
        </View>

        {/* Floating GPS Button */}
        <View
          style={[
            styles.gpsContainer,
            { bottom: insets.bottom + 180 },
          ]}
        >
          <IconButton
            icon={locating ? 'sync-outline' : 'locate-outline'}
            accessibilityLabel="Gunakan lokasi saya sekarang"
            onPress={handleUseCurrentLocation}
          />
        </View>

        {/* Floating Bottom Card Konfirmasi */}
        <View
          style={[
            styles.bottomCard,
            { paddingBottom: insets.bottom + spacing.md },
          ]}
        >
          <View style={styles.coordRow}>
            <View style={styles.coordInfo}>
              <Text variant="caption" tone="muted">
                Koordinat Terpilih
              </Text>
              <Text variant="body">
                {selectedCoords.latitude.toFixed(6)},{' '}
                {selectedCoords.longitude.toFixed(6)}
              </Text>
            </View>
            <View style={styles.radiusPill}>
              <Text variant="caption" tone="violet">
                Radius {validRadius}m
              </Text>
            </View>
          </View>

          <Button
            label="Gunakan Titik Ini"
            variant="accent"
            icon="checkmark-outline"
            onPress={handleSelect}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topBarCard: {
    flex: 1,
    backgroundColor: colors.panel,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  gpsContainer: {
    position: 'absolute',
    right: spacing.md,
    backgroundColor: colors.panel,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    elevation: 4,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.panel,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    elevation: 8,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordInfo: {
    gap: 2,
  },
  radiusPill: {
    backgroundColor: colors.lavenderSubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
});
