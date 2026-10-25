import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import {
  Button,
  Card,
  CardOverline,
  colors,
  Header,
  Screen,
  typography,
} from '../shared/ui';
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
        <Card>
          <View style={styles.cardInner}>
            <CardOverline>01 / PRAKTIKAN</CardOverline>
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
        </Card>

        <Card>
          <View style={styles.cardInner}>
            <CardOverline>02 / ASISTEN</CardOverline>
            <Text accessibilityRole="header" style={styles.cardTitle}>
              Kelola jalannya sesi
            </Text>
            <Text style={styles.description}>
              Tinjau jadwal, buka atau tutup sesi, dan pantau rekap kehadiran.
            </Text>
            <Button
              label="Masuk mode Asisten"
              variant="soft"
              onPress={() => navigation.navigate('AssistantDashboard')}
            />
          </View>
        </Card>
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
  cardInner: { gap: 12 },
  cardTitle: {
    ...typography.title,
    color: colors.ink,
  },
  description: { ...typography.body, color: colors.inkMuted },
  notice: {
    borderLeftWidth: 3,
    borderLeftColor: colors.violet,
    paddingLeft: 16,
    gap: 8,
  },
  noticeTitle: {
    ...typography.overline,
    color: colors.violet,
  },
  noticeText: { ...typography.body, color: colors.inkMuted },
});
