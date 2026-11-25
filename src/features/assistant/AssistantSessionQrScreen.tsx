import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import { encodeSessionQr } from '../../domain/sessionQr';
import {
  EmptyState,
  Header,
  InfoRow,
  radius,
  Screen,
  spacing,
  StatCard,
  StatRow,
  Text,
  TopBar,
} from '../../shared/ui';
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

  if (!session || session.status !== 'open') {
    return (
      <Screen withDock={false}>
        <TopBar onBack={() => navigation.goBack()} />
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
      <TopBar onBack={() => navigation.goBack()} />
      <Header
        title="Kode presensi"
        description={`${session.courseName} · ${session.groupName}`}
      />

      <View style={styles.qrWrap}>
        <SessionQrCode value={encodeSessionQr(session.id)} size={qrSize} />
      </View>

      <Text variant="caption" tone="muted" style={styles.hint}>
        Praktikan memindai kode ini dari tombol kamera, lalu presensi tetap
        harus dilakukan dari dalam area lab.
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
