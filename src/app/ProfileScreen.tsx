import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Avatar,
  Banner,
  Card,
  CardContent,
  colors,
  ConfirmSheet,
  Header,
  ListRow,
  radius,
  Screen,
  SectionHeader,
  spacing,
  Text,
} from '../shared/ui';
import { useAuth } from '../state';
import type { RootStackParamList } from './navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

type ProfileMenuItem = {
  label: string;
  sub: string;
  icon: 'calendar-outline' | 'finger-print-outline';
  onPress: () => void;
};

export function ProfileScreen({ navigation }: Props) {
  const { user, logout, error, clearError } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
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
          icon: 'calendar-outline',
          onPress: () => navigation.navigate('AssistantSchedule'),
        },
        {
          label: 'Rekap Presensi',
          sub: 'Daftar kehadiran sesi praktikum',
          icon: 'finger-print-outline',
          onPress: () => navigation.navigate('AssistantAllAttendance'),
        },
      ]
    : [
        {
          label: 'Jadwal Praktikum',
          sub: 'Lihat jadwal dan status sesi',
          icon: 'calendar-outline',
          onPress: () => navigation.navigate('StudentSchedule'),
        },
        {
          label: 'Riwayat Presensi',
          sub: 'Rekap kehadiran praktikan',
          icon: 'finger-print-outline',
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
      setConfirmLogout(false);
    }
  };

  return (
    <Screen>
      <Header title="Profil" />

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

      <Card variant="heroViolet" interactive={false}>
        <CardContent>
          <View style={styles.identity}>
            <Avatar name={displayName} size={44} tone="lime" />
            <View style={styles.identityText}>
              <Text variant="subtitle" tone="onDark" numberOfLines={1}>
                {displayName}
              </Text>
              <Text variant="caption" tone="onDarkMuted" numberOfLines={1}>
                {email}
              </Text>
              <Text variant="captionStrong" tone="onDark">
                {roleLabel}
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>

      <View style={styles.section}>
        <SectionHeader title={`Menu ${roleLabel}`} />
        {menuItems.map((item) => (
          <ListRow
            key={item.label}
            title={item.label}
            meta={item.sub}
            onPress={item.onPress}
            leading={
              <View style={styles.iconBox}>
                <Ionicons name={item.icon} size={18} color={colors.violet} />
              </View>
            }
            trailing={
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.inkMuted}
              />
            }
          />
        ))}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Akun" />
        <ListRow
          title="Edit profil"
          onPress={() => navigation.navigate('ProfileEdit')}
          leading={
            <View style={styles.iconBox}>
              <Ionicons name="create-outline" size={18} color={colors.violet} />
            </View>
          }
          trailing={
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.inkMuted}
            />
          }
        />
        <ListRow
          title="Keluar"
          tone="danger"
          onPress={() => setConfirmLogout(true)}
          leading={
            <View style={styles.iconBox}>
              <Ionicons
                name="log-out-outline"
                size={18}
                color={colors.dangerInk}
              />
            </View>
          }
        />
      </View>

      <ConfirmSheet
        visible={confirmLogout}
        title="Keluar dari akun?"
        confirmLabel="Keluar"
        cancelLabel="Batal"
        tone="danger"
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identityText: { flex: 1, gap: spacing.xs },
  section: { gap: spacing.sm },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: radius.lg,
    backgroundColor: colors.lavenderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
