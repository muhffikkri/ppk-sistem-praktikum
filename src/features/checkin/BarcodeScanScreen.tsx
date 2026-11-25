import { CameraView, useCameraPermissions } from 'expo-camera';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Banner,
  Button,
  EmptyState,
  Header,
  LoadingState,
  Screen,
  spacing,
  Text,
  TopBar,
} from '../../shared/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'BarcodeScan'>;

export function BarcodeScanScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [value, setValue] = useState<string | null>(null);

  if (!permission) {
    return (
      <Screen withDock={false}>
        <TopBar onBack={() => navigation.goBack()} />
        <LoadingState label="Memeriksa izin kamera…" />
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen withDock={false}>
        <TopBar onBack={() => navigation.goBack()} />
        <Header
          title="Scan Presensi"
          description="Kamera diperlukan untuk memindai barcode presensi."
        />
        <EmptyState
          title="Izin kamera belum diberikan"
          description="Izinkan akses kamera agar bisa memindai barcode presensi."
          action={<Button label="Izinkan Kamera" variant="primary" onPress={requestPermission} />}
        />
      </Screen>
    );
  }

  return (
    <Screen withDock={false} scroll={false}>
      <TopBar onBack={() => navigation.goBack()} />
      <Header title="Scan Presensi" description="Arahkan kamera ke barcode presensi." />
      <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFill}
          barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8'] }}
          onBarcodeScanned={
            scanned
              ? undefined
              : ({ data }) => {
                  setScanned(true);
                  setValue(data);
                }
          }
        />
      </View>
      {value ? (
        <View style={styles.result}>
          <Banner
            tone="success"
            title="Barcode terbaca"
            message={value}
          />
          <Button
            label="Gunakan untuk Presensi"
            variant="primary"
            onPress={() => navigation.navigate('StudentCheckIn', { sessionId: value })}
          />
          <Button
            label="Scan Lagi"
            variant="outline"
            onPress={() => {
              setScanned(false);
              setValue(null);
            }}
          />
        </View>
      ) : (
        <Text variant="caption" tone="muted" style={styles.hint}>
          Barcode akan terbaca otomatis.
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cameraWrap: {
    flex: 1,
    minHeight: 320,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  result: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  hint: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
