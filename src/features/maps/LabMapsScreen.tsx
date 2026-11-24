/**
 * LabMapsScreen — Sprint 3 (SRS-3.3)
 * Peta laboratorium interaktif menampilkan marker laboratorium, marker posisi pengguna real-time,
 * radius batas presensi, serta detail praktikum aktif & mendatang.
 */
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, shadow, spacing } from '../../theme/tokens';
import { Banner } from '../../shared/ui/Banner';
import { Button } from '../../shared/ui/Button';
import { IconButton } from '../../shared/ui/IconButton';
import { Text } from '../../shared/ui/Text';
import { LoadingState } from '../../shared/ui/LoadingState';
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

  // Pusatkan peta ke lokasi pengguna ketika pertama kali didapatkan
  useEffect(() => {
    if (userLocation.coordinates && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.coordinates.latitude,
          longitude: userLocation.coordinates.longitude,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        },
        800,
      );
    }
  }, [userLocation.coordinates?.latitude, userLocation.coordinates?.longitude]);

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
    if (user?.role === 'assistant') {
      navigation.navigate('AssistantSessionDetail', { sessionId });
    } else {
      navigation.navigate('StudentSessionDetail', { sessionId });
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingState label="Memuat peta laboratorium…" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Peta Interaktif */}
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
            radius={act.lab.radiusMeters}
            fillColor={
              act.isOccupied ? colors.lavenderSubtle : colors.onSiteSoft
            }
            strokeColor={act.isOccupied ? colors.violet : colors.success}
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
            pinColor={colors.violetDark}
          />
        )}
      </MapView>

      {/* Floating Header & Legend */}
      <View
        style={[styles.topOverlay, { paddingTop: insets.top + spacing.sm }]}
      >
        <View style={styles.topBar}>
          <IconButton
            icon="arrow-back-outline"
            accessibilityLabel="Kembali"
            onPress={() => navigation.goBack()}
          />
          <View style={styles.titleBox}>
            <Text variant="title">Peta Laboratorium</Text>
            <Text variant="caption" tone="muted">
              Informatika · Real-time
            </Text>
          </View>
          <IconButton
            icon="refresh-outline"
            accessibilityLabel="Perbarui posisi GPS"
            onPress={refreshLocation}
          />
        </View>

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
      <View
        style={[
          styles.fabColumn,
          { bottom: selectedLab ? 320 : insets.bottom + spacing.lg },
        ]}
      >
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.subtle,
  },
  titleBox: {
    flex: 1,
    paddingHorizontal: spacing.sm,
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
