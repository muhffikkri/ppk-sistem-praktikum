import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Banner,
  Button,
  Card,
  CardContent,
  colors,
  Header,
  LegacyStatusBadge,
  Screen,
  typography,
} from '../../shared/ui';
import { useStudentAttendanceViewModel } from '../../state';
import { formatClock, formatSessionDate, formatTimeRange } from './formatters';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'StudentSessionDetail'
>;

type Feedback =
  | { kind: 'ok'; message: string }
  | { kind: 'error'; message: string }
  | null;

export function StudentSessionDetailScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const {
    getSessionById,
    getAttendanceForSession,
    checkIn,
    currentStudent,
  } = useStudentAttendanceViewModel();
  const [feedback, setFeedback] = useState<Feedback>(null);

  const session = getSessionById(sessionId);
  const record = getAttendanceForSession(sessionId);

  if (!session) {
    return (
      <Screen>
        <Header
          eyebrow="MODE PRAKTIKAN · DETAIL SESI"
          title="Sesi tidak ditemukan"
          description="Sesi ini tidak tersedia pada data demo praktikan."
        />
        <Button
          label="Kembali ke jadwal"
          variant="outline"
          onPress={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const onCheckIn = () => {
    const result = checkIn(session.id);
    if (result.ok) {
      setFeedback({
        kind: 'ok',
        message: `Presensi tercatat pukul ${formatClock(new Date().toISOString())}.`,
      });
    } else if (result.reason === 'already_checked_in') {
      setFeedback({
        kind: 'error',
        message: 'Kamu sudah presensi di sesi ini.',
      });
    } else if (result.reason === 'invalid_status') {
      setFeedback({
        kind: 'error',
        message: 'Sesi belum / sudah tidak terbuka untuk presensi.',
      });
    } else {
      setFeedback({ kind: 'error', message: 'Sesi tidak ditemukan.' });
    }
  };

  return (
    <Screen>
      <Header
        eyebrow="MODE PRAKTIKAN · DETAIL SESI"
        title={session.courseName}
        description={session.groupName}
      />

      {feedback ? (
        <Banner
          title={feedback.kind === 'ok' ? 'Berhasil' : 'Gagal presensi'}
          message={feedback.message}
          tone={feedback.kind === 'ok' ? 'success' : 'danger'}
          onDismiss={() => setFeedback(null)}
        />
      ) : null}

      <Card interactive={false}>
        <CardContent>
          <View style={styles.statusRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <LegacyStatusBadge status={session.status} />
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tanggal</Text>
            <Text style={styles.infoValue}>
              {formatSessionDate(session.startsAt)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Waktu</Text>
            <Text style={styles.infoValue}>
              {formatTimeRange(session.startsAt, session.endsAt)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Presensi kamu</Text>
            <Text style={[styles.infoValue, record && styles.infoValueOk]}>
              {record ? `Hadir ${formatClock(record.checkedInAt)}` : 'Belum'}
            </Text>
          </View>
        </CardContent>
      </Card>

      <View style={styles.actions}>
        {record ? (
          <Banner
            title="Sudah presensi"
            message={`Kamu tercatat hadir pukul ${formatClock(record.checkedInAt)}.`}
            tone="success"
          />
        ) : session.status === 'open' ? (
          <Button
            label="Presensi sekarang"
            variant="accent"
            leadingIcon="✓"
            accessibilityHint="Mencatat kehadiran di sesi ini"
            onPress={onCheckIn}
          />
        ) : (
          <Text style={styles.hint}>
            {session.status === 'scheduled'
              ? 'Sesi belum mulai. Tombol presensi akan aktif setelah sesi dibuka asisten.'
              : 'Sesi sudah ditutup. Presensi tidak dapat lagi dilakukan.'}
          </Text>
        )}
        <Button
          label="Lihat riwayat kehadiran"
          variant="outline"
          onPress={() => navigation.navigate('StudentAttendanceHistory')}
        />
      </View>

      <Text style={styles.note}>
        NIM {currentStudent.id} • {currentStudent.displayName}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  infoLabel: { ...typography.label, color: colors.inkMuted },
  infoValue: {
    flex: 1,
    flexShrink: 1,
    textAlign: 'right',
    ...typography.bodyStrong,
    color: colors.ink,
  },
  infoValueOk: { color: colors.successInk },
  actions: { gap: 12 },
  hint: { ...typography.body, color: colors.inkMuted },
  note: { ...typography.caption, color: colors.inkMuted, marginTop: 4 },
});
