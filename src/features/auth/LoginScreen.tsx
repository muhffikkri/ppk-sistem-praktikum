import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import type { RootStackParamList } from '../../app/navigation';
import { useAuth } from '../../state';
import { Button, StatusBadge } from '../shared/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login, authStatus, user, error } = useAuth();
  const [isGoogleSignIn, setIsGoogleSignIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleSignIn(true);
    try {
      await login({
        email: '',
        password: '',
        // Google auth will be handled natively
      });
      // After Google sign-in, navigate based on role
      navigation.replace(
        user?.role === 'assistant'
          ? 'AssistantSchedule'
          : 'StudentSchedule',
      );
    } catch (e) {
      console.error('Google sign-in failed:', e);
    } finally {
      setIsGoogleSignIn(false);
    }
  };

  if (authStatus === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Aplikasi PPK</Text>
        <Text style={styles.subtitle}>Sistem Praktikum Kelas</Text>
        <View style={styles.divider} />
        <Button
          label="Masuk dengan Google"
          variant="primary"
          onPress={handleGoogleSignIn}
          loading={isGoogleSignIn}
          accessibilityLabel="Masuk dengan akun Google"
        />
        <Text style={styles.dividerText}>atau</Text>
        <Button
          label="Masuk dengan Email"
          variant="soft"
          onPress={() => navigation.navigate('Login')}
          accessibilityLabel="Masuk dengan email dan password"
        />
        <Text style={styles.forgotText}>Lupa password?</Text>
        <StatusBadge
          label="Belum memiliki akun?"
          tone="info"
          hidden
        />
      </View>
    );
  }

  // authenticated state - redirect to appropriate role screen
  if (user) {
    navigation.replace(
      user.role === 'assistant' ? 'AssistantSchedule' : 'StudentSchedule',
    );
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aplikasi PPK</Text>
      <Text style={styles.subtitle}>Sistem Praktikum Kelas</Text>
      <View style={styles.divider} />
      <Button
        label="Masuk dengan Google"
        variant="primary"
        onPress={handleGoogleSignIn}
        loading={isGoogleSignIn}
        accessibilityLabel="Masuk dengan akun Google"
      />
      <Text style={styles.dividerText}>atau</Text>
      <View style={styles.emailInputWrapper}>
        <Text style={styles.emailLabel}}>Email</Text>
        <Text style={styles.emailPlaceholder}}>masuk@email.edu</Text>
      </View>
      <Button
        label="Masuk dengan Email & Password"
        variant="soft"
        onPress={() => navigation.navigate('Login')}
        accessibilityLabel="Masuk dengan email dan password"
      />
      <Text style={styles.forgotText}>Lupa password?</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    ...typography.display,
    color: colors.ink,
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    ...typography.label,
    color: colors.inkMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  dividerText: {
    textAlign: 'center',
    color: colors.inkMuted,
    marginVertical: 8,
    fontStyle: 'italic',
  },
  forgotText: {
    ...typography.caption,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: 16,
  },
  emailInputWrapper: {
    marginBottom: 16,
  },
  emailLabel: {
    ...typography.caption,
    color: colors.inkMuted,
    marginBottom: 4,
    textAlign: 'center',
  },
  emailPlaceholder: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
});