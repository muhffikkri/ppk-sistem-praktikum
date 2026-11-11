import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Card,
  colors,
  Header,
  radius,
  Screen,
  StatusBadge,
  typography,
} from '../../shared/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantSettings'>;

type ToggleKey = 'notifikasi' | 'geofence' | 'autoLunch' | 'ringkasan';

const TOGGLE_STATE: Record<ToggleKey, boolean> = {
  notifikasi: true,
  geofence: true,
  autoLunch: false,
  ringkasan: true,
};

const TOGGLE_META: Record<ToggleKey, { label: string; sub: string }> = {
  notifikasi: {
    label: 'Notifikasi Sesi',
    sub: 'Ingatkan 15 menit sebelum sesi dimulai',
  },
  geofence: {
    label: 'Validasi Geofence',
    sub: 'Sesuaikan radius beacon laboratorium',
  },
  autoLunch: {
    label: 'Buka Sesi Otomatis',
    sub: 'Buka sesi tepat pada jam dimulai',
  },
  ringkasan: {
    label: 'Ringkasan Akhiri',
    sub: 'Kirim rekap kehadiran ke grup asisten',
  },
};

export function AssistantSettingsScreen({ navigation }: Props) {
  const keys = Object.keys(TOGGLE_META) as ToggleKey[];

  return (
    <Screen>
      <Header
        eyebrow="MODE ASISTEN · PENGATURAN"
        title="Pengaturan"
        description="Preferensi sesi dan notifikasi (data dummy)"
      />

      <Card interactive={false}>
        <View style={styles.list}>
          {keys.map((key, index) => {
            const on = TOGGLE_STATE[key];
            const meta = TOGGLE_META[key];
            return (
              <Pressable
                key={key}
                accessibilityRole="switch"
                accessibilityState={{ checked: on }}
                accessibilityLabel={meta.label}
                style={[styles.row, index < keys.length - 1 && styles.divider]}
              >
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{meta.label}</Text>
                  <Text style={styles.rowSub}>{meta.sub}</Text>
                </View>
                <View style={[styles.pill, on && styles.pillOn]}>
                  <View style={styles.pillKnob} />
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <View style={styles.cardGroup}>
        <Text style={styles.sectionLabel}>Zona Waktu</Text>
        <Text style={styles.cardValue}>WIB (UTC+7) · Laboratorium</Text>
      </View>

      <Card interactive={false}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Versi Aplikasi</Text>
            <Text style={styles.rowSub}>LabPresensi demo v1.2</Text>
          </View>
          <StatusBadge label="DEMO" tone="violet" dot />
        </View>
      </Card>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Kembali ke profil"
        onPress={() => navigation.goBack()}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      >
        <Text style={styles.backLabel}>Kembali</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
    backgroundColor: colors.panel,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  rowText: { flex: 1, gap: 3 },
  rowLabel: { ...typography.bodyStrong, color: colors.ink, fontSize: 14 },
  rowSub: { ...typography.caption, color: colors.inkMuted },

  pill: {
    width: 40,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    padding: 3,
  },
  pillOn: { backgroundColor: colors.violet },
  pillKnob: {
    width: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.panel,
  },

  cardGroup: { gap: 4 },
  sectionLabel: { ...typography.overline, color: colors.inkMuted },
  cardValue: { ...typography.bodyStrong, color: colors.ink },

  back: {
    minHeight: 48,
    borderRadius: radius['2xl'],
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.9 },
  backLabel: { ...typography.label, color: colors.violet },
});
