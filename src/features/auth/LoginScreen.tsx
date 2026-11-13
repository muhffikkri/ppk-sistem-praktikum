import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { AuthStackParamList } from '../../app/navigation';
import { isFirebaseConfigured } from '../../services/firebase';
import {
  Banner,
  Button,
  Header,
  IconButton,
  Screen,
  spacing,
  TextField,
  TopBar,
} from '../../shared/ui';
import { useAuth } from '../../state';
import { AuthSwitchLink } from './AuthSwitchLink';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const EMAIL_REQUIRED = 'Email wajib diisi.';
const PASSWORD_REQUIRED = 'Password wajib diisi.';
const FIELD_MESSAGES: string[] = [EMAIL_REQUIRED, PASSWORD_REQUIRED];

export function LoginScreen({ navigation }: Props) {
  const { login, loginWithGoogle, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeError = localError ?? error;
  // Validation messages render under their own field; everything else is a banner.
  const bannerError =
    localError && FIELD_MESSAGES.includes(localError) ? null : activeError;
  const emailError = localError === EMAIL_REQUIRED ? localError : undefined;
  const passwordError =
    localError === PASSWORD_REQUIRED ? localError : undefined;

  const handleLogin = async () => {
    setLocalError(null);
    clearError();

    if (!email.trim()) {
      setLocalError(EMAIL_REQUIRED);
      return;
    }
    if (!password) {
      setLocalError(PASSWORD_REQUIRED);
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

  const handleGoogleLogin = async () => {
    setLocalError(null);
    clearError();
    await loginWithGoogle();
  };

  const handleBack = () => {
    clearError();
    navigation.goBack();
  };

  return (
    <Screen withDock={false}>
      <TopBar title="Masuk" onBack={handleBack} />

      <Header
        title="Masuk ke akun"
        description="Gunakan email dan password akun praktikan atau asisten."
      />

      {!isFirebaseConfigured ? (
        <Banner
          title="Konfigurasi Firebase belum diisi"
          message="Salin .env.example menjadi .env dan isi EXPO_PUBLIC_FIREBASE_* sebelum masuk."
          tone="warning"
        />
      ) : null}

      <View style={styles.fields}>
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
      </View>

      {bannerError ? (
        <Banner
          title="Gagal masuk"
          message={bannerError}
          tone="danger"
          onDismiss={() => {
            setLocalError(null);
            clearError();
          }}
        />
      ) : null}

      <View style={styles.actions}>
        <Button
          label="Masuk"
          variant="primary"
          icon="log-in-outline"
          loading={submitting}
          onPress={handleLogin}
        />
        <Button
          label="Masuk dengan Google"
          variant="outline"
          icon="logo-google"
          disabled={submitting}
          onPress={handleGoogleLogin}
        />
      </View>

      <AuthSwitchLink
        prompt="Belum punya akun?"
        linkLabel="Daftar"
        accessibilityLabel="Daftar akun baru"
        disabled={submitting}
        onPress={() => {
          setLocalError(null);
          clearError();
          navigation.navigate('Register');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.md },
  actions: { gap: spacing.sm },
});
