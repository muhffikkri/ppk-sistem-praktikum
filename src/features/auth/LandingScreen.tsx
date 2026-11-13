import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, View } from 'react-native';

import type { AuthStackParamList } from '../../app/navigation';
import { isFirebaseConfigured } from '../../services/firebase';
import {
  Banner,
  Button,
  colors,
  Header,
  type IconName,
  radius,
  Screen,
  spacing,
  Text,
} from '../../shared/ui';
import { useAuth } from '../../state';

type Props = NativeStackScreenProps<AuthStackParamList, 'Landing'>;

// Only features that exist in Sprint 2 (docs/sprint-2-prd.md).
const FEATURES: { icon: IconName; label: string }[] = [
  { icon: 'calendar-outline', label: 'Jadwal sesi per kelas' },
  { icon: 'checkmark-circle-outline', label: 'Presensi saat sesi dibuka' },
  { icon: 'document-text-outline', label: 'Pengajuan izin ke asisten' },
];

export function LandingScreen({ navigation }: Props) {
  const { loginWithGoogle, error, clearError } = useAuth();

  const handleGoogleLogin = async () => {
    clearError();
    await loginWithGoogle();
  };

  return (
    <Screen withDock={false} contentStyle={styles.fill}>
      <StatusBar style="dark" />

      <View style={styles.intro}>
        <View style={styles.wordmark}>
          <View style={styles.dot} />
          <Text variant="overline" tone="violet">
            LabPresensi
          </Text>
        </View>

        <Header
          title="Presensi praktikum,"
          accent="tanpa kertas absen."
          description="Lihat jadwal sesi, catat kehadiran saat sesi dibuka, dan ajukan izin bila berhalangan."
        />

        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View key={feature.label} style={styles.feature}>
              <Ionicons name={feature.icon} size={20} color={colors.violet} />
              <Text variant="body">{feature.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        {!isFirebaseConfigured ? (
          <Banner
            tone="warning"
            title="Konfigurasi Firebase belum diisi"
            message="Salin .env.example menjadi .env dan isi EXPO_PUBLIC_FIREBASE_* sebelum masuk."
          />
        ) : null}
        {error ? (
          <Banner
            tone="danger"
            title="Gagal masuk"
            message={error}
            onDismiss={clearError}
          />
        ) : null}

        <Button
          label="Masuk dengan email"
          icon="mail-outline"
          onPress={() => navigation.navigate('Login')}
        />
        <Button
          label="Masuk dengan Google"
          variant="outline"
          icon="logo-google"
          onPress={handleGoogleLogin}
        />

        <View style={styles.register}>
          <Text variant="caption" tone="muted">
            Belum punya akun?
          </Text>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Daftar akun baru"
            onPress={() => navigation.navigate('Register')}
            style={styles.registerLink}
          >
            <Text variant="bodyStrong" tone="violet">
              Daftar
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flexGrow: 1, justifyContent: 'space-between' },
  intro: { gap: spacing['2xl'], paddingTop: spacing['3xl'] },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.lime,
  },
  features: { gap: spacing.md },
  feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  actions: { gap: spacing.md },
  register: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  registerLink: { minHeight: 44, justifyContent: 'center' },
});
