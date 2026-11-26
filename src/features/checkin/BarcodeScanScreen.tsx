import { CameraView, useCameraPermissions } from 'expo-camera';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import { parseSessionQr } from '../../domain/sessionQr';
import { useTransitionReady } from '../../shared/navigation/useTransitionReady';
import {
  Banner,
  Button,
  colors,
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
  // The camera can report several frames before `scanned` re-renders; the
  // ref drops those so only the first code navigates.
  const handled = useRef(false);
  const [invalid, setInvalid] = useState(false);
  // Start the camera after the push animation so it does not stall it.
  const cameraReady = useTransitionReady();

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
          description="Kamera diperlukan untuk memindai kode presensi dari asisten."
        />
        <EmptyState
          title="Izin kamera belum diberikan"
          description="Izinkan akses kamera agar bisa memindai kode presensi."
          action={
            <Button
              label="Izinkan Kamera"
              variant="primary"
              onPress={requestPermission}
            />
          }
        />
      </Screen>
    );
  }

  return (
    <Screen withDock={false} scroll={false}>
      <TopBar onBack={() => navigation.goBack()} />
      <Header
        title="Scan Presensi"
        description="Arahkan kamera ke kode presensi yang ditampilkan asisten."
      />
      <View style={styles.cameraWrap}>
        {cameraReady ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={
              scanned
                ? undefined
                : ({ data }) => {
                    if (handled.current) return;
                    handled.current = true;
                    setScanned(true);
                    const parsed = parseSessionQr(data);
                    if (parsed) {
                      navigation.replace('StudentCheckIn', {
                        sessionId: parsed.sessionId,
                        qrToken: parsed.token,
                      });
                    } else {
                      setInvalid(true);
                    }
                  }
            }
          />
        ) : null}
      </View>
      {invalid ? (
        <View style={styles.result}>
          <Banner
            tone="danger"
            title="Bukan kode presensi"
            message="Pindai kode presensi yang ditampilkan asisten pada sesi yang sedang dibuka."
          />
          <Button
            label="Scan Lagi"
            variant="outline"
            onPress={() => {
              handled.current = false;
              setInvalid(false);
              setScanned(false);
            }}
          />
        </View>
      ) : (
        <Text variant="caption" tone="muted" style={styles.hint}>
          Kode akan terbaca otomatis, lalu halaman presensi terbuka.
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
    backgroundColor: colors.ink,
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
