import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { Button, colors, Header, Screen } from '../shared/ui';
import type { RootStackParamList } from './navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSelect'>;

export function RoleSelectScreen({ navigation }: Props) {
  return (
    <Screen>
      <Header
        eyebrow="SISTEM PRAKTIKUM"
        title="Pilih sudut pandang."
        description="Jelajahi alur praktikum melalui mode yang ingin kamu coba."
      />

      <View style={styles.cards}>
        <View style={styles.card}>
          <Text style={styles.number}>01 / PRAKTIKAN</Text>
          <Text accessibilityRole="header" style={styles.cardTitle}>
            Siap untuk praktikum
          </Text>
          <Text style={styles.description}>
            Lihat jadwal, lakukan presensi, dan telusuri riwayat kehadiranmu.
          </Text>
          <Button
            label="Masuk mode Praktikan"
            onPress={() => navigation.navigate('StudentSchedule')}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.number}>02 / ASISTEN</Text>
          <Text accessibilityRole="header" style={styles.cardTitle}>
            Kelola jalannya sesi
          </Text>
          <Text style={styles.description}>
            Tinjau jadwal, buka atau tutup sesi, dan pantau rekap kehadiran.
          </Text>
          <Button
            label="Masuk mode Asisten"
            variant="secondary"
            onPress={() => navigation.navigate('AssistantSchedule')}
          />
        </View>
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>MODE DEMO LOKAL</Text>
        <Text style={styles.noticeText}>
          Pemilihan mode bukan login. Data demo berada di perangkat dan dapat
          direset saat aplikasi dimulai ulang.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cards: { gap: 16 },
  card: {
    backgroundColor: colors.surface,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    gap: 16,
  },
  number: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '600',
  },
  description: { color: colors.muted, fontSize: 15, lineHeight: 24 },
  notice: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingLeft: 16,
    gap: 8,
  },
  noticeTitle: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  noticeText: { color: colors.muted, fontSize: 14, lineHeight: 22 },
});
