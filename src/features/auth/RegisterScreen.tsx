import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { AuthStackParamList } from '../../app/navigation';
import type { UserRole } from '../../domain/types';
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const ROLE_OPTIONS: {
  value: UserRole;
  label: string;
  description: string;
}[] = [
  {
    value: 'student',
    label: 'Praktikan',
    description: 'Lihat jadwal, presensi, & ajukan izin',
  },
  {
    value: 'assistant',
    label: 'Asisten',
    description: 'Kelola kelas/sesi, rekap, & periksa izin',
  },
];

export function RegisterScreen({ navigation }: Props) {
  const { register, error, clearError } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeError = localError ?? error;

  const handleRegister = async () => {
    setLocalError(null);
    clearError();

    if (displayName.trim().length < 2) {
      setLocalError('Nama lengkap minimal 2 karakter.');
      return;
    }
    if (!email.trim()) {
      setLocalError('Email wajib diisi.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password minimal 6 karakter.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await register({
        displayName,
        email,
        password,
        role,
      });
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
          <Text>REGISTRASI AKUN</Text>
        </CardOverline>
        <Text accessibilityRole="header" style={styles.title}>
          Buat Akun Baru
        </Text>
        <Text style={styles.subtitle}>
          Pilih peran Anda dengan benar. Peran menentukan akses fitur dan data
          di aplikasi.
        </Text>
      </View>

      {!isFirebaseConfigured ? (
        <Banner
          title="Konfigurasi Firebase belum diisi"
          message="Salin .env.example menjadi .env dan isi EXPO_PUBLIC_FIREBASE_* sebelum mendaftar."
          tone="warning"
        />
      ) : null}

      {activeError ? (
        <Banner
          title="Gagal mendaftar"
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
            <Text>IDENTITAS &amp; PERAN</Text>
          </CardOverline>

          <View style={styles.fieldGroup}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nama Lengkap</Text>
              <TextInput
                value={displayName}
                onChangeText={(val) => {
                  setDisplayName(val);
                  if (localError) setLocalError(null);
                }}
                placeholder="Contoh: Saburo Ardiansyah"
                placeholderTextColor={colors.inkMuted}
                editable={!submitting}
                style={styles.input}
                accessibilityLabel="Nama Lengkap"
              />
            </View>

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

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Daftar Sebagai</Text>
              <View style={styles.roleRow}>
                {ROLE_OPTIONS.map((option) => {
                  const selected = role === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      disabled={submitting}
                      onPress={() => setRole(option.value)}
                      style={({ pressed }) => [
                        styles.roleCard,
                        selected && styles.roleCardActive,
                        pressed && styles.roleCardPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleTitle,
                          selected && styles.roleTitleActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text
                        style={[
                          styles.roleDesc,
                          selected && styles.roleDescActive,
                        ]}
                      >
                        {option.description}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.submitWrap}>
            <Button
              label={submitting ? 'Mendaftarkan...' : 'Daftar Akun'}
              variant="accent"
              icon="checkmark-circle-outline"
              loading={submitting}
              onPress={handleRegister}
            />
          </View>
        </CardContent>
      </Card>

      <Button
        label="Sudah punya akun? Masuk"
        variant="outline"
        disabled={submitting}
        onPress={() => {
          setLocalError(null);
          clearError();
          navigation.goBack();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroHeader: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
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
  roleRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  roleCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius['2xl'],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  roleCardActive: {
    backgroundColor: colors.violet,
    borderColor: colors.violet,
  },
  roleCardPressed: {
    opacity: 0.9,
  },
  roleTitle: {
    ...typography.bodyStrong,
    color: colors.ink,
  },
  roleTitleActive: {
    color: colors.onPrimary,
  },
  roleDesc: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  roleDescActive: {
    color: colors.lavender,
  },
  submitWrap: {
    marginTop: spacing.md,
  },
});
