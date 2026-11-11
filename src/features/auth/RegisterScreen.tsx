import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import type { RootStackParamList } from '../../app/navigation';
import { useAuth } from '../../state';
import { Button } from '../shared/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { register, authStatus, user, error } = useAuth();
  const [isGoogleSignIn, setIsGoogleSignIn] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'assistant'>('student');

  const handleGoogleSignIn = async () => {
    setIsGoogleSignIn(true);
    try {
      await register({
        displayName: '',
        email: '',
        password: '',
        role: 'student',
      });
      // After Google sign-in, navigate based on role
      navigation.replace(
        role === 'assistant'
          ? 'AssistantSchedule'
          : 'StudentSchedule',
      );
    } catch (e) {
      console.error('Google registration failed:', e);
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
        <Text style={styles.title>Aplikasi PPK</Text>
        <Text style={styles.subtitle>Daftar Akun Baru</Text>
        <View style={styles.divider} />
        <Button
          label="Daftar dengan Google"
          variant="primary"
          onPress={handleGoogleSignIn}
          loading={isGoogleSignIn}
          accessibilityLabel="Daftar dengan akun Google"
        />
        <Text style={styles.dividerText}>atau</Text>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel>Nama Lengkap</Text>
          <TextInput
            style={styles.input}
            placeholder="Nama lengkap"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@universitas.edu"
            value={email}
            onChangeText={setEmail}
            keyboardType="emailAddress"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Minimal 6 karakter"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel>Peran</Text>
          <Button
            label="Mahasiswa"
            variant={role === 'student' ? 'primary' : 'soft'}
            onPress={() => setRole('student')}
            accessibilityLabel="Pilih peran Mahasiswa"
          />
          <Button
            label="Asisten"
            variant={role === 'assistant' ? 'primary' : 'soft'}
            onPress={() => setRole('assistant')}
            accessibilityLabel="Pilih peran Asisten"
          />
        </View>
        <Button
          label="Daftar"
          variant="primary"
          onPress={handleGoogleSignIn}
          loading={isGoogleSignIn}
          accessibilityLabel="Daftar akun baru"
          disabled={isGoogleSignIn}
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
      <Text style={styles.title>Aplikasi PPK</Text>
      <Text style={styles.subtitle>Daftar Akun Baru</Text>
      <View style={styles.divider} />
      <Button
        label="Daftar dengan Google"
        variant="primary"
        onPress={handleGoogleSignIn}
        loading={isGoogleSignIn}
        accessibilityLabel="Daftar dengan akun Google"
      />
      <Text style={styles.dividerText}>atau</Text>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel>Nama Lengkap</Text>
        <TextInput
          style={styles.input}
          placeholder="Nama lengkap"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="email@universitas.edu"
          value={email}
          onChangeText={setEmail}
          keyboardType="emailAddress"
          autoCapitalize="none"
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Minimal 6 karakter"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel>Peran</Text>
        <Button
          label="Mahasiswa"
          variant={role === 'student' ? 'primary' : 'soft'}
          onPress={() => setRole('student')}
          accessibilityLabel="Pilih peran Mahasiswa"
        />
        <Button
          label="Asisten"
          variant={role === 'assistant' ? 'primary' : 'soft'}
          onPress={() => setRole('assistant')}
          accessibilityLabel="Pilih peran Asisten"
        />
      </View>
      <Button
        label="Daftar"
        variant="primary"
        onPress={handleGoogleSignIn}
        loading={isGoogleSignIn}
        accessibilityLabel="Daftar akun baru"
        disabled={isGoogleSignIn}
      />
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
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    ...typography.caption,
    color: colors.inkMuted,
    marginBottom: 4,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
});