import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { AuthStackParamList } from '../../app/navigation';
import { isFirebaseConfigured } from '../../services/firebase';
import {
  Banner,
  Button,
  Card,
  CardContent,
  CardOverline,
  colors,
  radius,
  Screen,
  spacing,
  typography,
} from '../../shared/ui';
import { useAuth } from '../../state';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeError = localError ?? error;

  const handleLogin = async () => {
    setLocalError(null);
    clearError();

    if (!email.trim()) {
      setLocalError('Email wajib diisi.');
      return;
    }
    if (!password) {
      setLocalError('Password wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await login(email, password);
      if (!res.ok) {
        setLocalError(res.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.heroHeader}>
        <CardOverline>
          <Text>LABPRESENSI · SPRINT 2</Text>
        </CardOverline>
        <Text accessibilityRole="header" style={styles.title}>
          Masuk ke Akun
        </Text>
        <Text style={styles.subtitle}>
          Gunakan akun praktikan atau asisten untuk mengakses jadwal, presensi,
          dan pengajuan izin secara real-time.
        </Text>
      </View>

      {!isFirebaseConfigured ? (
        <Banner
          title="Konfigurasi Firebase belum diisi"
          message="Salin .env.example menjadi .env dan isi EXPO_PUBLIC_FIREBASE_* sebelum login."
          tone="warning"
        />
      ) : null}

      {activeError ? (
        <Banner
          title="Gagal masuk"
          message={activeError}
          tone="danger"
          onDismiss={() => {
            setLocalError(null);
            clearError();
          }}
        />
      ) : null}

      <Card variant="panel" interactive={false}>
        <CardContent>
          <CardOverline>
            <Text>KREDENSIAL</Text>
          </CardOverline>

          <View style={styles.fieldGroup}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (localError) setLocalError(null);
                }}
                placeholder="nama@kampus.ac.id"
                placeholderTextColor={colors.inkMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!submitting}
                style={styles.input}
                accessibilityLabel="Email"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (localError) setLocalError(null);
                  }}
                  placeholder="Minimal 6 karakter"
                  placeholderTextColor={colors.inkMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!submitting}
                  style={styles.passwordInput}
                  accessibilityLabel="Password"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword ? 'Sembunyikan password' : 'Tampilkan password'
                  }
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.inkMuted}
                  />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.submitWrap}>
            <Button
              label={submitting ? 'Memproses...' : 'Masuk'}
              variant="primary"
              icon="log-in-outline"
              loading={submitting}
              onPress={handleLogin}
            />
          </View>
        </CardContent>
      </Card>

      <Card variant="surface" interactive={false}>
        <CardContent>
          <Text style={styles.switchTitle}>Belum memiliki akun?</Text>
          <Text style={styles.switchCaption}>
            Daftarkan akun baru sebagai Praktikan atau Asisten praktikum.
          </Text>
          <Button
            label="Daftar Akun Baru"
            variant="soft"
            icon="person-add-outline"
            disabled={submitting}
            onPress={() => {
              setLocalError(null);
              clearError();
              navigation.navigate('Register');
            }}
          />
        </CardContent>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroHeader: {
    gap: spacing.xs,
    paddingTop: spacing.md,
  },
  title: {
    ...typography.display,
    color: colors.ink,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkMuted,
  },
  fieldGroup: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.ink,
  },
  input: {
    ...typography.body,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    minHeight: 48,
  },
  passwordInput: {
    ...typography.body,
    color: colors.ink,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  eyeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitWrap: {
    marginTop: spacing.md,
  },
  switchTitle: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  switchCaption: {
    ...typography.caption,
    color: colors.inkMuted,
    marginBottom: spacing.xs,
  },
});
