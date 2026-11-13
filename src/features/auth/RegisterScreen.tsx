import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { AuthStackParamList } from '../../app/navigation';
import type { UserRole } from '../../domain/types';
import { isFirebaseConfigured } from '../../services/firebase';
import {
  Banner,
  Button,
  Card,
  CardContent,
  colors,
  Header,
  IconButton,
  Screen,
  spacing,
  Text,
  TextField,
  TopBar,
} from '../../shared/ui';
import { useAuth } from '../../state';
import { AuthSwitchLink } from './AuthSwitchLink';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const NAME_TOO_SHORT = 'Nama lengkap minimal 2 karakter.';
const EMAIL_REQUIRED = 'Email wajib diisi.';
const PASSWORD_TOO_SHORT = 'Password minimal 6 karakter.';
const FIELD_MESSAGES: string[] = [
  NAME_TOO_SHORT,
  EMAIL_REQUIRED,
  PASSWORD_TOO_SHORT,
];

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
    label: 'Asisten praktikum',
    description: 'Kelola kelas/sesi, rekap, & periksa izin',
  },
];

export function RegisterScreen({ navigation }: Props) {
  const { register, clearError } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const activeError = localError ?? registerError;
  // Validation messages render under their own field; everything else is a banner.
  const bannerError =
    localError && FIELD_MESSAGES.includes(localError) ? null : activeError;
  const nameError = localError === NAME_TOO_SHORT ? localError : undefined;
  const emailError = localError === EMAIL_REQUIRED ? localError : undefined;
  const passwordError =
    localError === PASSWORD_TOO_SHORT ? localError : undefined;

  const clearRegisterError = () => {
    setRegisterError(null);
    clearError();
  };

  const leaveScreen = () => {
    setLocalError(null);
    setRegisterError(null);
    clearError();
    navigation.goBack();
  };

  const handleRegister = async () => {
    setLocalError(null);
    setRegisterError(null);

    if (displayName.trim().length < 2) {
      setLocalError(NAME_TOO_SHORT);
      return;
    }
    if (!email.trim()) {
      setLocalError(EMAIL_REQUIRED);
      return;
    }
    if (password.length < 6) {
      setLocalError(PASSWORD_TOO_SHORT);
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
        setRegisterError(res.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen withDock={false}>
      <TopBar title="Daftar" onBack={leaveScreen} />

      <Header
        title="Buat akun"
        description="Pilih peran dengan benar. Peran menentukan akses fitur dan data di aplikasi."
      />

      {!isFirebaseConfigured ? (
        <Banner
          title="Konfigurasi Firebase belum diisi"
          message="Salin .env.example menjadi .env dan isi EXPO_PUBLIC_FIREBASE_* sebelum mendaftar."
          tone="warning"
        />
      ) : null}

      <View style={styles.fields}>
        <TextField
          label="Nama lengkap"
          value={displayName}
          onChangeText={(val) => {
            setDisplayName(val);
            if (localError) setLocalError(null);
          }}
          placeholder="Nama lengkap Anda"
          editable={!submitting}
          error={nameError}
        />

        <TextField
          label="Email"
          value={email}
          onChangeText={(val) => {
            setEmail(val);
            if (localError) setLocalError(null);
          }}
          placeholder="nama@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          editable={!submitting}
          error={emailError}
        />

        <TextField
          label="Password"
          value={password}
          onChangeText={(val) => {
            setPassword(val);
            if (localError) setLocalError(null);
          }}
          placeholder="Minimal 6 karakter"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          editable={!submitting}
          error={passwordError}
          rightAccessory={
            <IconButton
              icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
              variant="ghost"
              accessibilityLabel={
                showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'
              }
              onPress={() => setShowPassword((prev) => !prev)}
            />
          }
        />

        <View style={styles.roleBlock}>
          <Text variant="overline" tone="muted">
            Daftar sebagai
          </Text>
          <View style={styles.roleRow}>
            {ROLE_OPTIONS.map((option) => {
              const selected = role === option.value;
              return (
                <Card
                  key={option.value}
                  variant="panel"
                  accessibilityState={{ selected }}
                  disabled={submitting}
                  onPress={() => setRole(option.value)}
                  style={[
                    styles.roleCard,
                    selected ? styles.roleSelected : styles.roleIdle,
                  ]}
                >
                  <CardContent>
                    <Text variant="bodyStrong" tone="ink">
                      {option.label}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {option.description}
                    </Text>
                  </CardContent>
                  {selected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.violet}
                      style={styles.check}
                    />
                  ) : null}
                </Card>
              );
            })}
          </View>
        </View>
      </View>

      {bannerError ? (
        <Banner
          title="Gagal mendaftar"
          message={bannerError}
          tone="danger"
          onDismiss={clearRegisterError}
        />
      ) : null}

      <View style={styles.actions}>
        <Button
          label="Buat akun"
          variant="primary"
          icon="checkmark-circle-outline"
          loading={submitting}
          onPress={handleRegister}
        />
      </View>

      <AuthSwitchLink
        prompt="Sudah punya akun?"
        linkLabel="Masuk"
        accessibilityLabel="Kembali ke halaman masuk"
        disabled={submitting}
        onPress={leaveScreen}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.md },
  roleBlock: { gap: spacing.xs },
  roleRow: { flexDirection: 'row', gap: spacing.md },
  roleCard: { flex: 1, borderWidth: 2 },
  // Same 2px border in both states so the card height never jumps.
  roleSelected: {
    backgroundColor: colors.lavenderSubtle,
    borderColor: colors.violet,
  },
  roleIdle: { borderColor: colors.border },
  check: { position: 'absolute', top: spacing.sm, right: spacing.sm },
  actions: { gap: spacing.sm },
});
