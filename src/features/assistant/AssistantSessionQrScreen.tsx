import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import { encodeSessionQr } from '../../domain/sessionQr';
import {
  Button,
  EmptyState,
  InfoRow,
  LoadingState,
  radius,
  Screen,
  spacing,
  StatCard,
  StatRow,
  Text,
  BackButton,
} from '../../shared/ui';
import {
  requestAttendanceQr,
  type AttendanceQr,
} from '../../services/firestore/attendanceQrService';
import { SessionQrCode } from './components/SessionQrCode';
import { formatTimeRange } from './formatters';
import { useAssistantSessionDetail } from './useAssistantSessionDetail';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantSessionQr'>;

const MAX_QR_SIZE = 320;

export function AssistantSessionQrScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const { session, attendees } = useAssistantSessionDetail(sessionId);
  const { width } = useWindowDimensions();
  const qrSize = Math.min(width - spacing.lg * 2, MAX_QR_SIZE);
  const [qr, setQr] = useState<AttendanceQr | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const sessionOpen = session?.status === 'open';

  useEffect(() => {
    if (!sessionOpen) return;
    let active = true;
    const load = async () => {
      const result = await requestAttendanceQr(sessionId);
      if (!active) return;
      if (result.ok) {
        setQr(result.data);
        setQrError(null);
      } else {
        setQrError(result.message);
      }
    };
    void load();
    const timer = setInterval(load, 15_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [sessionId, sessionOpen, reloadKey]);

  if (!session || !sessionOpen) {
    return (
      <Screen withDock={false}>
        <BackButton onPress={() => navigation.goBack()} />
        <EmptyState
          icon="lock-closed-outline"
          title={session ? 'Sesi tidak sedang dibuka' : 'Sesi tidak ditemukan'}
          description={
            session
              ? 'Kode presensi hanya tersedia selama sesi berstatus dibuka.'
              : 'Sesi ini tidak tersedia atau sudah dihapus.'
          }
        />
      </Screen>
    );
  }

  const totalParticipants = Math.max(
    session.participantIds?.length ?? 0,
    attendees.length,
  );

  return (
    <Screen withDock={false}>
      <BackButton onPress={() => navigation.goBack()} />

      <View style={styles.qrWrap}>
        {qr ? (
          <SessionQrCode value={encodeSessionQr(qr.token)} size={qrSize} />
        ) : qrError ? (
          <EmptyState
            icon="refresh-outline"
            title="Kode belum tersedia"
            description={qrError}
            action={
              <Button
                label="Coba lagi"
                variant="outline"
                onPress={() => setReloadKey((value) => value + 1)}
              />
            }
          />
        ) : (
          <LoadingState label="Menyiapkan kode berputar…" />
        )}
      </View>

      <Text variant="caption" tone="muted" style={styles.hint}>
        Kode berubah tiap 30 detik. Praktikan wajib memindai kode ini, lalu
        presensi tetap divalidasi dari dalam area lab.
      </Text>

      <StatRow>
        <StatCard variant="panel" value={attendees.length} label="Hadir" />
        <StatCard variant="panel" value={totalParticipants} label="Peserta" />
      </StatRow>

      <View style={styles.info}>
        <InfoRow
          label="Waktu"
          value={formatTimeRange(session.startsAt, session.endsAt)}
        />
        {session.lab ? <InfoRow label="Lab" value={session.lab} /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  qrWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  hint: { textAlign: 'center' },
  info: { gap: spacing.sm },
});
