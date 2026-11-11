import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

type Props = NativeStackScreenProps<AuthStackParamList, 'RoleSelection'>;

const ROLE_OPTIONS: {
  value: UserRole;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: 'student',
    label: 'Praktikan',
    description: 'Lihat jadwal, presensi, & ajukan izin',
    icon: 'person-outline',
  },
  {
    value: 'assistant',
    label: 'Asisten praktikum',
    description: 'Kelola kelas/sesi, rekap, & periksa izin',
    icon: 'school-outline',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Manajemen kelas, sesi, & pengguna',
    icon: 'lock-closed-outline',
  },
];

export function RoleSelectionScreen({ navigation }: Props) {
  const { setUserRole, error, clearError } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeError = error;

  const handleContinue = async () => {
    if (!role) return;
    clearError();
    setSubmitting(true);
    try {
      await setUserRole(role);
      // AppNavigator will re-render and show the main stack once
      // authStatus becomes 'authenticated' and needsRoleSelection becomes false.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <CardOverline>
          <Text>PILIH PERAN AKUN</Text>
        </CardOverline>
        <Text accessibilityRole="header" style={styles.title}>
          Daftar Sebagai Apa?
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
          title="Gagal"
          message={activeError}
          tone="danger"
          onDismiss={() => clearError()}
        />
      ) : null}

      <View style={styles.roleGrid}>
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
              <View style={styles.roleIconBox}>
                <Ionicons name={option.icon as any} size={24} color={colors.primary} />
              </View>
              <Text style={[styles.roleTitle, selected && styles.roleTitleActive]}>
                {option.label}
              </Text>
              <Text style={[styles.roleDesc, selected && styles.roleDescActive]}>
                {option.description}
              </Text>
              {selected && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Button
          label={submitting ? 'Memproses...' : 'Lanjutkan'}
          variant="primary"
          icon="arrow-forward-outline"
          loading={submitting}
          disabled={!role || submitting}
          onPress={handleContinue}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Daftar dengan Email"
          onPress={() => navigation.navigate('Register')}
          style={styles.registerLink}
        >
          <Text style={styles.registerLinkText}>
            Daftar dengan Email &amp; Password
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  title: {
    ...typography.display,
    color: colors.ink,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkMuted,
  },
  roleGrid: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleCardActive: {
    backgroundColor: colors.violet,
    borderColor: colors.violet,
  },
  roleCardPressed: {
    opacity: 0.9,
  },
  roleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.violetLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTitle: {
    ...typography.bodyStrong,
    color: colors.ink,
    fontSize: 16,
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
  checkmark: {
    marginLeft: 'auto',
  },
  actions: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  registerLink: {
    alignItems: 'center',
  },
  registerLinkText: {
    ...typography.bodyStrong,
    color: colors.primary,
    fontWeight: '600',
  },
});
