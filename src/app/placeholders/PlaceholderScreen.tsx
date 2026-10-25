import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import {
  Button,
  colors,
  EmptyState,
  Header,
  Screen,
  typography,
} from '../../shared/ui';
import type { RootStackParamList } from '../navigation';

type PlaceholderRoute = Exclude<keyof RootStackParamList, 'RoleSelect'>;
type Props = {
  [Name in PlaceholderRoute]: NativeStackScreenProps<RootStackParamList, Name>;
}[PlaceholderRoute];

const pages = {
  StudentSchedule: {
    title: 'Jadwal praktikum',
    emptyTitle: 'Jadwal belum tersedia',
    description:
      'Daftar sesi praktikum akan ditampilkan di sini. Untuk saat ini, kamu bisa mencoba navigasi ke contoh detail dan riwayat.',
  },
  StudentSessionDetail: {
    title: 'Detail sesi',
    emptyTitle: 'Detail sesi sedang disiapkan',
    description:
      'Informasi jadwal, status sesi, dan aksi presensi akan tersedia di halaman ini.',
  },
  StudentAttendanceHistory: {
    title: 'Riwayat kehadiran',
    emptyTitle: 'Riwayat belum tersedia',
    description:
      'Catatan kehadiran praktikan akan ditampilkan di sini setelah alur presensi tersedia.',
  },
  AssistantSchedule: {
    title: 'Jadwal pendampingan',
    emptyTitle: 'Jadwal belum tersedia',
    description:
      'Daftar sesi yang kamu dampingi akan ditampilkan di sini. Coba navigasi ke contoh detail untuk melihat alur menuju rekap.',
  },
  AssistantSessionDetail: {
    title: 'Detail sesi',
    emptyTitle: 'Pengelolaan sesi sedang disiapkan',
    description:
      'Informasi sesi serta kontrol buka dan tutup akan tersedia di halaman ini.',
  },
  AssistantAttendanceRoster: {
    title: 'Rekap kehadiran',
    emptyTitle: 'Rekap belum tersedia',
    description:
      'Daftar praktikan dan waktu presensi akan ditampilkan di sini setelah alur kehadiran tersedia.',
  },
} satisfies Record<
  PlaceholderRoute,
  { title: string; emptyTitle: string; description: string }
>;

// Navigation-only identifier; this is not a session fixture or a stored attendance record.
const previewSessionId = 'preview-session';

export function PlaceholderScreen({ route, navigation }: Props) {
  const page = pages[route.name];

  return (
    <Screen>
      <Header eyebrow="PRATINJAU ALUR" title={page.title} />
      <EmptyState title={page.emptyTitle} description={page.description} />

      <View style={styles.actions}>
        {route.name === 'StudentSchedule' ? (
          <>
            <Button
              label="Lihat contoh detail sesi"
              onPress={() =>
                navigation.navigate('StudentSessionDetail', {
                  sessionId: previewSessionId,
                })
              }
            />
            <Button
              label="Lihat riwayat kehadiran"
              variant="outline"
              onPress={() => navigation.navigate('StudentAttendanceHistory')}
            />
          </>
        ) : null}
        {route.name === 'AssistantSchedule' ? (
          <Button
            label="Lihat contoh detail sesi"
            onPress={() =>
              navigation.navigate('AssistantSessionDetail', {
                sessionId: previewSessionId,
              })
            }
          />
        ) : null}
        {route.name === 'AssistantSessionDetail' ? (
          <Button
            label="Lihat rekap kehadiran"
            onPress={() =>
              navigation.navigate('AssistantAttendanceRoster', {
                sessionId: route.params.sessionId,
              })
            }
          />
        ) : null}
        <Button
          label="Kembali"
          variant="outline"
          onPress={() => navigation.goBack()}
        />
      </View>

      <Text style={styles.note}>
        Ini halaman pratinjau navigasi. Data dan aksi praktikum belum
        dihubungkan.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 12 },
  note: { ...typography.label, color: colors.inkMuted },
});
