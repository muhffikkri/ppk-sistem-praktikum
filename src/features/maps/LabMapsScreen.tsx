/**
 * LabMapsScreen — Sprint 3 (SRS-3.3)
 * Peta laboratorium interaktif menampilkan marker laboratorium, marker posisi pengguna real-time,
 * radius batas presensi, serta detail praktikum aktif & mendatang.
 */
import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, shadow, spacing } from '../../theme/tokens';
import { BackButton } from '../../shared/ui/BackButton';
import { Banner } from '../../shared/ui/Banner';
import { Button } from '../../shared/ui/Button';
import { IconButton } from '../../shared/ui/IconButton';
import { Text } from '../../shared/ui/Text';
import { LoadingState } from '../../shared/ui/LoadingState';
import { useTransitionReady } from '../../shared/navigation/useTransitionReady';
import { isAssistantRole } from '../../domain/asprakScope';
import { useAuth } from '../../state';
import type { RootStackParamList } from '../../app/navigation';
import { useLabMapsViewModel } from './useLabMapsViewModel';
import { MapLegendBanner } from './MapLegendBanner';
import { LabMarkerDetailSheet } from './LabMarkerDetailSheet';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export function LabMapsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const mapRef = useRef<MapView | null>(null);
  // Mount the native map after the push animation so it does not stall it.
  const mapReady = useTransitionReady();

  const {
    activities,
    filteredActivities,
    selectedLab,
    filter,
    loading,
    error,
    userLocation,
    stats,
    defaultCenter,
    setSelectedLab,
    setFilter,
    refreshLocation,
    retry,
  } = useLabMapsViewModel();

  const fabColumnStyle = useMemo(
    () => ({ bottom: selectedLab ? 320 : insets.bottom + spacing.lg }),
    [insets.bottom, selectedLab],
  );

  // Pusatkan peta ke lokasi pengguna ketika pertama kali didapatkan, sekali
  // saja: setiap update GPS sebelumnya menarik peta kembali ke pengguna dan
  // menjalankan animasi kamera 800 ms walau pengguna sedang menggeser peta.
  const centeredOnUser = useRef(false);
  const userCoords = userLocation.coordinates;
  useEffect(() => {
    if (centeredOnUser.current || !userCoords || !mapReady) return;
    if (!mapRef.current) return;
    centeredOnUser.current = true;
    mapRef.current.animateToRegion(
      {
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      },
      800,
    );
  }, [userCoords, mapReady]);

  const handleCenterUser = () => {
    refreshLocation();
    if (userLocation.coordinates && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.coordinates.latitude,
          longitude: userLocation.coordinates.longitude,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        },
        500,
      );
    }
  };

  const handleCenterCampus = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: defaultCenter.latitude,
          longitude: defaultCenter.longitude,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        },
        500,
      );
    }
  };

  const handleSelectSession = (sessionId: string) => {
    if (isAssistantRole(user?.role)) {
      navigation.navigate('AssistantSessionDetail', { sessionId });
    } else {
      navigation.navigate('StudentSessionDetail', { sessionId });
    }
  };

  const topBar = (
    <BackButton label="Tutup peta" onPress={() => navigation.goBack()} />
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {topBar}
        <View style={styles.centerContainer}>
          <LoadingState label="Memuat peta laboratorium…" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Peta Interaktif */}
      {mapReady ? (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: defaultCenter.latitude,
            longitude: defaultCenter.longitude,
            latitudeDelta: 0.0035,
            longitudeDelta: 0.0035,
          }}
          showsUserLocation={userLocation.permissionGranted === true}
          showsMyLocationButton={false}
          showsCompass
          toolbarEnabled={false}
        >
          {/* Lingkaran Radius Presensi Laboratorium */}
          {filteredActivities.map((act) => (
            <Circle
              key={`radius-${act.lab.id}`}
              center={act.lab.coordinates}
              radius={Math.min(act.lab.radiusMeters, 35)}
              fillColor={
                act.isOccupied
                  ? colors.mapCircleOccupied
                  : colors.mapCircleAvailable
              }
              strokeColor={
                act.isOccupied
                  ? colors.mapCircleOccupiedBorder
                  : colors.mapCircleAvailableBorder
              }
              strokeWidth={1.5}
            />
          ))}

          {/* Marker Laboratorium */}
          {filteredActivities.map((act) => (
            <Marker
              key={`marker-${act.lab.id}`}
              coordinate={act.lab.coordinates}
              title={act.lab.name}
              description={
                act.currentSession
                  ? `Berlangsung: ${act.currentSession.courseName}`
                  : 'Tersedia'
              }
              pinColor={act.isOccupied ? colors.violet : colors.success}
              onPress={() => setSelectedLab(act)}
            />
          ))}

          {/* Marker Posisi Pengguna Khusus (jika belum muncul di native) */}
          {userLocation.coordinates && (
            <Marker
              coordinate={userLocation.coordinates}
              title="Lokasi Anda"
              pinColor={colors.blue}
            />
          )}
        </MapView>
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.mapPlaceholder]} />
      )}

      {/* Header & Legend */}
      <View style={[styles.topOverlay, { paddingTop: insets.top }]}>
        {topBar}

        {/* Banner Keterangan Warna & Filter */}
        <MapLegendBanner
          activeFilter={filter}
          onFilterChange={setFilter}
          stats={stats}
        />

        {/* Data lab/sesi gagal dimuat (mis. koneksi terputus) */}
        {error ? (
          <Banner
            tone="danger"
            title="Data laboratorium gagal dimuat"
            message={`${error} Periksa koneksi lalu coba lagi.`}
            action={<Button label="Coba lagi" variant="soft" onPress={retry} />}
          />
        ) : activities.length === 0 ? (
          <Banner
            tone="warning"
            title="Belum ada laboratorium"
            message="Asisten belum menambahkan lokasi laboratorium."
          />
        ) : null}

        {/* Banner Peringatan Lokasi jika Izin Ditolak */}
        {userLocation.error ? (
          <View style={styles.warningBanner}>
            <Text variant="caption" tone="danger">
              {userLocation.error} Peta menampilkan posisi acuan laboratorium.
            </Text>
          </View>
        ) : null}
      </View>

      {/* Floating Action Buttons (Kanan Bawah) */}
      <View style={[styles.fabColumn, fabColumnStyle]}>
        <View style={styles.mapFab}>
          <IconButton
            icon="locate-outline"
            accessibilityLabel="Pusatkan ke lokasi saya"
            onPress={handleCenterUser}
          />
        </View>
        <View style={styles.mapFab}>
          <IconButton
            icon="business-outline"
            accessibilityLabel="Pusatkan ke laboratorium"
            onPress={handleCenterCampus}
          />
        </View>
      </View>

      {/* Detail Bottom Sheet ketika Marker Lab dipilih */}
      {selectedLab ? (
        <View
          style={[styles.bottomSheetWrapper, { paddingBottom: insets.bottom }]}
        >
          <LabMarkerDetailSheet
            activity={selectedLab}
            userCoords={userLocation.coordinates}
            onClose={() => setSelectedLab(null)}
            onSelectSession={handleSelectSession}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  mapPlaceholder: { backgroundColor: colors.surface },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: spacing.lg,
    right: spacing.lg,
    gap: spacing.sm,
  },
  warningBanner: {
    backgroundColor: colors.dangerSoft,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  fabColumn: {
    position: 'absolute',
    right: spacing.lg,
    gap: spacing.sm,
  },
  mapFab: {
    backgroundColor: colors.panel,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.elevated,
  },
  bottomSheetWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
