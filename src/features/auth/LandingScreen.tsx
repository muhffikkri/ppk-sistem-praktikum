import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AuthStackParamList } from '../../app/navigation';
import { isFirebaseConfigured } from '../../services/firebase';
import {
  Banner,
  Button,
  colors,
  Screen,
  spacing,
  typography,
} from '../../shared/ui';
import { useAuth } from '../../state';

type Props = NativeStackScreenProps<AuthStackParamList, 'Landing'>;

export function LandingScreen({ navigation }: Props) {
  const { loginWithGoogle, error, clearError } = useAuth();

  const handleGoogleLogin = async () => {
    clearError();
    await loginWithGoogle();
  };

  return (
    <Screen withDock={false}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Copywriting */}
        <View style={styles.copySection}>
          <Text style={styles.headline}>
            Satu ritme praktikum,{' '}
            <Text style={styles.headlineEmphasis}>di setiap sudut lab.</Text>
          </Text>
          <Text style={styles.subhead}>
            Lihat jadwal sesi, catat kehadiran saat sesi dibuka, dan ajukan izin
            bila berhalangan.
          </Text>
        </View>

        {/* Firebase Warning */}
        {!isFirebaseConfigured ? (
          <Banner
            title="Konfigurasi Firebase belum diisi"
            message="Salin .env.example menjadi .env dan isi EXPO_PUBLIC_FIREBASE_* sebelum login."
            tone="warning"
          />
        ) : null}

        {/* Error Banner */}
        {error ? (
          <Banner
            title="Gagal"
            message={error}
            tone="danger"
            onDismiss={clearError}
          />
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <Button
            label="Masuk dengan Email Kampus"
            variant="primary"
            icon="mail-outline"
            onPress={() => navigation.navigate('Login')}
          />

          <Button
            label="Masuk dengan Akun Google"
            variant="outline"
            icon="logo-google"
            onPress={handleGoogleLogin}
          />

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Belum memiliki akun?</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Registrasi Akun Baru"
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerLinkText}>Registrasi Akun Baru</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  copySection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  headline: {
    ...typography.title,
    color: colors.ink,
    fontWeight: 'normal',
  },
  headlineEmphasis: {
    color: colors.primary,
    fontStyle: 'italic',
  },
  subhead: {
    ...typography.body,
    color: colors.inkMuted,
    lineHeight: 22,
  },
  actionsSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  registerText: {
    ...typography.body,
    color: colors.inkMuted,
  },
  registerLinkText: {
    ...typography.label,
    color: colors.primary,
    fontWeight: '500',
  },
});
