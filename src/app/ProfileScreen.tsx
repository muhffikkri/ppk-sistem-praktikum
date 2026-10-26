import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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
import { usePov } from '../state';
import type { RootStackParamList } from './navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

/** Dummy profile data — swap with real user profile when API lands. */
const DEMO_IDENTITY = {
  name: 'Saburo Ardiansyah',
  nim: '2301010123',
  program: 'Teknik Informatika',
  department: 'Fakultas Teknik Informatika',
};

const MENU_ITEMS = [
  { label: 'Jadwal Praktikum', sub: '4 sesi minggu ini', glyph: '▦' },
  { label: 'Riwayat Presensi', sub: '12 sesi tercatat', glyph: '✦' },
  { label: 'Modul & Materi', sub: '8 modul tersedia', glyph: '≡' },
  { label: 'Pengaturan', sub: 'Notifikasi & preferensi', glyph: '⚙' },
] as const;

export function ProfileScreen({ navigation }: Props) {
  const { pov, setPov } = usePov();

  return (
    <Screen>
      <View style={styles.headRow}>
        <Text accessibilityRole="header" style={styles.title}>
          Profil
        </Text>
        <StatusBadge label="DEMO" tone="violet" dot live />
      </View>

      {/* Avatar + identity card */}
      <Card variant="heroViolet" interactive={false}>
        <CardContent>
          <View style={styles.identityRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText} accessible={false}>
                SA
              </Text>
            </View>
            <View style={styles.identityText}>
              <Text style={styles.identityName}>{DEMO_IDENTITY.name}</Text>
              <Text style={styles.identitySub}>NIM {DEMO_IDENTITY.nim}</Text>
              <Text style={styles.identitySub}>
                {DEMO_IDENTITY.program} · {DEMO_IDENTITY.department}
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Role selector */}
      <View style={styles.roleSection}>
        <Text style={styles.roleTitle} accessibilityRole="header">
          Pilih Peran
        </Text>
        <Text style={styles.roleSubtitle}>
          Beranda dan menu dock mengikuti peran aktif ini.
        </Text>
        <View style={styles.roleRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: pov === 'praktikan' }}
            onPress={() => setPov('praktikan')}
            style={({ pressed }) => [
              styles.roleCard,
              pov === 'praktikan' && styles.roleCardActive,
              pressed && styles.roleCardPressed,
            ]}
          >
            <Text
              style={[
                styles.roleCardLabel,
                pov === 'praktikan' && styles.roleCardLabelActive,
              ]}
            >
              Praktikan
            </Text>
            <Text style={styles.roleCardCaption}>Presensi & riwayat</Text>
            {pov === 'praktikan' ? (
              <Text style={styles.roleCheck} accessible={false}>
                ✓ Aktif
              </Text>
            ) : null}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: pov === 'asisten' }}
            onPress={() => setPov('asisten')}
            style={({ pressed }) => [
              styles.roleCard,
              pov === 'asisten' && styles.roleCardActive,
              pressed && styles.roleCardPressed,
            ]}
          >
            <Text
              style={[
                styles.roleCardLabel,
                pov === 'asisten' && styles.roleCardLabelActive,
              ]}
            >
              Asisten
            </Text>
            <Text style={styles.roleCardCaption}>Kelola sesi & rekap</Text>
            {pov === 'asisten' ? (
              <Text style={styles.roleCheck} accessible={false}>
                ✓ Aktif
              </Text>
            ) : null}
          </Pressable>
        </View>
      </View>

      {/* Role + attendance summary */}
      <View style={styles.metricsGrid}>
        <Card variant="panel" interactive={false}>
          <CardContent>
            <Text style={styles.metricLabel}>Peran Aktif</Text>
            <Text style={styles.metricValue}>
              {pov === 'asisten' ? 'Asisten' : 'Praktikan'}
            </Text>
          </CardContent>
        </Card>
        <Card variant="panel" interactive={false}>
          <CardContent>
            <Text style={styles.metricLabel}>Hadir</Text>
            <Text style={[styles.metricValue, { color: colors.successInk }]}>
              92%
            </Text>
          </CardContent>
        </Card>
      </View>

      {/* Menu */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Menu
        </Text>
        <View style={styles.menuList}>
          {MENU_ITEMS.map((item, index) => (
            <View
              key={item.label}
              style={[
                styles.menuRow,
                index < MENU_ITEMS.length - 1 && styles.menuRowDivider,
              ]}
            >
              <View style={styles.menuGlyph}>{item.glyph}</View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <Text style={styles.menuChevron} accessible={false}>
                ›
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Button
        label="Ke Beranda"
        variant="soft"
        onPress={() => navigation.navigate('Home')}
      />

      <Banner
        title="Profil demo"
        message="Data di atas adalah dummy untuk uji tampilan. Ganti dengan profil riil saat API siap."
        tone="warning"
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
    opacity: 0.8,
  },

  roleSection: { gap: 8 },
  roleTitle: { ...typography.overline, color: colors.inkMuted },
  roleSubtitle: { ...typography.caption, color: colors.inkMuted },
  roleRow: { flexDirection: 'row', gap: 12 },
  roleCard: {
    flex: 1,
    gap: 4,
    padding: 14,
    borderRadius: radius['2xl'],
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleCardActive: {
    backgroundColor: colors.violet,
    borderColor: colors.violet,
  },
  roleCardPressed: { opacity: 0.85 },
  roleCardLabel: {
    ...typography.bodyStrong,
    color: colors.ink,
    fontSize: 14,
  },
  roleCardLabelActive: { color: colors.onPrimary },
  roleCardCaption: { ...typography.caption, color: colors.inkMuted },
  roleCheck: {
    ...typography.label,
    color: colors.onPrimary,
    fontWeight: '700',
  },

  metricsGrid: { flexDirection: 'row', gap: 8 },
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
});
