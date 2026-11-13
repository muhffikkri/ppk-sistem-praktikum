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
  CardOverline,
  colors,
  Header,
  Screen,
  spacing,
  Text,
} from '../../shared/ui';
import { useAuth } from '../../state';

type Props = NativeStackScreenProps<AuthStackParamList, 'RoleSelection'>;

const ROLE_OPTIONS: {
  value: UserRole;
  overline: string;
  label: string;
  description: string;
}[] = [
  {
    value: 'student',
    overline: 'Untuk peserta praktikum',
    label: 'Praktikan',
    description: 'Lihat jadwal, presensi, dan ajukan izin.',
  },
  {
    value: 'assistant',
    overline: 'Untuk pendamping sesi',
    label: 'Asisten praktikum',
    description: 'Kelola kelas dan sesi, lihat rekap, dan periksa izin.',
  },
];

export function RoleSelectionScreen({ navigation }: Props) {
  const { setUserRole, error, clearError } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const activeError = roleError ?? error;

  const clearRoleError = () => {
    setRoleError(null);
    clearError();
  };

  const handleContinue = async () => {
    if (!role) return;
    clearRoleError();
    setSubmitting(true);
    try {
      await setUserRole(role);
      // AppNavigator re-renders and shows main stack once
      // authStatus becomes 'authenticated' and needsRoleSelection becomes false.
    } catch {
      // Error already set by setUserRole via AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen withDock={false}>
      <Header
        title="Pilih peran Anda"
        description="Peran menentukan akses fitur dan data di aplikasi."
      />

      {!isFirebaseConfigured ? (
        <Banner
          title="Konfigurasi Firebase belum diisi"
          message="Salin .env.example menjadi .env dan isi EXPO_PUBLIC_FIREBASE_* sebelum mendaftar."
          tone="warning"
        />
      ) : null}

      {activeError ? (
        <Banner
          title="Gagal"
          message={activeError}
          tone="danger"
          onDismiss={clearRoleError}
        />
      ) : null}

      <View style={styles.roles}>
        {ROLE_OPTIONS.map((option) => {
          const selected = role === option.value;
          return (
            <Card
              key={option.value}
              variant="panel"
              interactive={false}
              style={selected ? styles.roleSelected : undefined}
            >
              <CardContent>
                <CardOverline>{option.overline}</CardOverline>
                <Text variant="title">{option.label}</Text>
                <Text variant="body" tone="muted">
                  {option.description}
                </Text>
                <View style={styles.roleAction}>
                  <Button
                    label={selected ? 'Terpilih' : 'Pilih'}
                    variant={selected ? 'primary' : 'outline'}
                    icon={selected ? 'checkmark-circle-outline' : undefined}
                    disabled={submitting}
                    onPress={() => setRole(option.value)}
                  />
                </View>
              </CardContent>
            </Card>
          );
        })}
      </View>

      <Text variant="caption" tone="muted">
        Peran tidak bisa diganti sendiri. Pilih dengan benar.
      </Text>

      <View style={styles.actions}>
        <Button
          label="Lanjutkan"
          variant="primary"
          icon="arrow-forward-outline"
          loading={submitting}
          disabled={!role || submitting}
          onPress={handleContinue}
        />
        <Button
          label="Daftar dengan email"
          variant="soft"
          icon="mail-outline"
          disabled={submitting}
          onPress={() => navigation.navigate('Register')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  roles: { gap: spacing.md },
  roleSelected: { borderWidth: 2, borderColor: colors.violet },
  roleAction: { marginTop: spacing.xs },
  actions: { gap: spacing.sm },
});
