import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Banner,
  Button,
  Card,
  CardContent,
  colors,
  radius,
  Screen,
  StatusBadge,
  typography,
} from '../shared/ui';
import { useAuth } from '../state';
import type { RootStackParamList } from './navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

type ProfileMenuItem = {
  label: string;
  sub: string;
  glyph: string;
  onPress: () => void;
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export function ProfileScreen({ navigation }: Props) {
  const { user, logout, error, clearError } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isAssistant = user?.role === 'assistant';
  const roleLabel = isAssistant ? 'Asisten' : 'Praktikan';
  const displayName = user?.displayName ?? 'Pengguna';
  const email = user?.email ?? '-';
  const activeError = localError ?? error;

  const menuItems: ProfileMenuItem[] = isAssistant
    ? [
        {
          label: 'Jadwal & Sesi Asisten',
          sub: 'Kelola sesi praktikum',
          glyph: '▦',
          onPress: () => navigation.navigate('AssistantSchedule'),
        },
        {
          label: 'Rekap Presensi',
          sub: 'Daftar kehadiran sesi praktikum',
          glyph: '✦',
          onPress: () => navigation.navigate('AssistantAllAttendance'),
        },
        {
          label: 'Modul & Materi',
          sub: 'Daftar modul praktikum',
          glyph: '≡',
          onPress: () => navigation.navigate('AssistantModuleList'),
        },
        {
          label: 'Pengaturan',
          sub: 'Preferensi akun & tampilan',
          glyph: '⚙',
          onPress: () => navigation.navigate('AssistantSettings'),
        },
      ]
    : [
        {
          label: 'Jadwal Praktikum',
          sub: 'Lihat jadwal dan status sesi',
          glyph: '▦',
          onPress: () => navigation.navigate('StudentSchedule'),
        },
        {
          label: 'Riwayat Presensi',
          sub: 'Rekap kehadiran praktikan',
          glyph: '✦',
          onPress: () => navigation.navigate('StudentAttendanceHistory'),
        },
      ];

  const handleLogout = async () => {
    setLocalError(null);
    clearError();
    setLoggingOut(true);
    try {
      const res = await logout();
      if (!res.ok) {
        setLocalError(res.message);
      }
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <Screen>
      <View style={styles.headRow}>
        <Text accessibilityRole="header" style={styles.title}>
          Profil
        </Text>
        <StatusBadge
          label={roleLabel}
          tone={isAssistant ? 'violet' : 'success'}
          dot
          live={isAssistant}
        />
      </View>

      {activeError ? (
        <Banner
          title="Gagal memproses akun"
          message={activeError}
          tone="danger"
          onDismiss={() => {
            setLocalError(null);
            clearError();
          }}
        />
      ) : null}

      {/* Avatar + real user identity card */}
      <Card variant="heroViolet" interactive={false}>
        <CardContent>
          <View style={styles.identityRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText} accessible={false}>
                {initialsOf(displayName)}
              </Text>
            </View>
            <View style={styles.identityText}>
              <Text style={styles.identityName}>{displayName}</Text>
              <Text style={styles.identitySub}>{email}</Text>
              <Text style={styles.identitySub}>Peran: {roleLabel}</Text>
            </View>
          </View>
          <View style={styles.editRow}>
            <Button
              label="Edit Profil"
              variant="accent"
              iconOnly
              icon="create"
              onPress={() => navigation.navigate('ProfileEdit')}
              accessibilityLabel="Edit profil"
              accessibilityHint="Membuka form edit profil"
            />
          </View>
        </CardContent>
      </Card>

      {/* Account info summary (role locked to registered account) */}
      <View style={styles.metricsGrid}>
        <Card variant="panel" interactive={false} style={styles.shrinkCard}>
          <CardContent>
            <Text style={styles.metricLabel}>Peran Akun</Text>
            <Text style={styles.metricValue}>{roleLabel}</Text>
          </CardContent>
        </Card>
        <Card variant="panel" interactive={false} style={styles.shrinkCard}>
          <CardContent>
            <Text style={styles.metricLabel}>Status Sesi</Text>
            <Text style={[styles.metricValue, { color: colors.successInk }]}>
              Terautentikasi
            </Text>
          </CardContent>
        </Card>
      </View>

      {/* Role-scoped menu */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Menu {roleLabel}
        </Text>
        <View style={styles.menuList}>
          {menuItems.map((item, index) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.menuRow,
                index < menuItems.length - 1 && styles.menuRowDivider,
                pressed && styles.menuRowPressed,
              ]}
            >
              <View style={styles.menuGlyph}>
                <Text style={styles.menuGlyphText} accessible={false}>
                  {item.glyph}
                </Text>
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <Text style={styles.menuChevron} accessible={false}>
                ›
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Button
        label="Ke Beranda"
        variant="soft"
        onPress={() => navigation.navigate('Home')}
      />

      <Button
        label={loggingOut ? 'Keluar...' : 'Keluar (Logout)'}
        variant="destructive"
        icon="log-out-outline"
        loading={loggingOut}
        onPress={handleLogout}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: { ...typography.title, color: colors.ink },

  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.title,
    color: colors.violet,
    fontSize: 18,
  },
  identityText: { flex: 1, gap: 2 },
  identityName: {
    ...typography.subtitle,
    color: colors.onPrimary,
    fontSize: 17,
  },
  identitySub: {
    ...typography.caption,
    color: colors.onPrimary,
    opacity: 0.85,
  },
  editRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },

  metricsGrid: { flexDirection: 'row', gap: 8 },
  shrinkCard: { flex: 1 },
  metricLabel: { ...typography.caption, color: colors.inkMuted },
  metricValue: { ...typography.title, color: colors.ink, fontSize: 18 },

  sectionBlock: { gap: 12 },
  sectionTitle: { ...typography.overline, color: colors.inkMuted },
  menuList: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius['3xl'],
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  menuRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  menuGlyph: {
    width: 34,
    height: 34,
    borderRadius: radius.lg,
    backgroundColor: colors.lavenderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuGlyphText: { ...typography.label, color: colors.violet },
  menuText: { flex: 1, gap: 1 },
  menuLabel: { ...typography.bodyStrong, color: colors.ink },
  menuSub: { ...typography.caption, color: colors.inkMuted },
  menuChevron: { ...typography.bodyStrong, color: colors.inkMuted },
  menuRowPressed: { backgroundColor: colors.lavenderSubtle },
});
