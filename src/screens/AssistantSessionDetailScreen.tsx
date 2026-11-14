import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Banner,
  Button,
  ConfirmSheet,
  EmptyState,
  Header,
  InfoRow,
  Screen,
  spacing,
  StatCard,
  StatRow,
  StatusBadge,
  Text,
  TopBar,
} from '../../shared/ui';
import {
  sessionStatusLabel,
  sessionStatusTone,
} from './components/AssistantSessionCard';
import { formatClock, formatSessionDate, formatTimeRange } from './formatters';
import { useAssistantSessionDetail } from './useAssistantSessionDetail';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'AssistantSessionDetail'
>;

export function AssistantSessionDetailScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const {
    session,
    attendees,
    canOpen,
    canClose,
    statusHint,
    feedback,
    openSession,
    closeSession,
    dismissFeedback,
  } = useAssistantSessionDetail(sessionId);
  const [sheet, setSheet] = useState<'open' | 'close' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!session) {
    return (
      <Screen withDock={false}>
        <TopBar onBack={() => navigation.goBack()} />
        <EmptyState
          icon="alert-circle-outline"
          title="Sesi tidak ditemukan"
          description="Sesi ini tidak tersedia atau sudah dihapus."
        />
      </Screen>
    );
  }

  const totalParticipants = Math.max(
    session.participantIds?.length ?? 0,
    attendees.length,
  );

  const confirmAction = async () => {
    if (!sheet) return;
    setSubmitting(true);
    try {
      if (sheet === 'open') {
        await openSession();
      } else {
        await closeSession();
      }
    } finally {
      setSubmitting(false);
      setSheet(null);
    }
  };

  return (
    <Screen withDock={false}>
      <TopBar
        onBack={() => navigation.goBack()}
        trailing={
          <StatusBadge
            label={sessionStatusLabel[session.status]}
            tone={sessionStatusTone[session.status]}
          />
        }
      />
      <Header title={session.courseName} description={session.groupName} />

      {feedback ? (
        <Banner
          title={feedback.kind === 'success' ? 'Berhasil' : 'Gagal'}
          message={feedback.message}
          tone={feedback.kind === 'success' ? 'success' : 'danger'}
          onDismiss={dismissFeedback}
        />
      ) : null}

      <StatRow>
        <StatCard variant="panel" value={attendees.length} label="Hadir" />
        <StatCard variant="panel" value={totalParticipants} label="Peserta" />
      </StatRow>

      <View style={styles.info}>
        <InfoRow label="Tanggal" value={formatSessionDate(session.startsAt)} />
        <InfoRow
          label="Waktu"
          value={formatTimeRange(session.startsAt, session.endsAt)}
        />
        {session.openedAt ? (
          <InfoRow label="Dibuka" value={formatClock(session.openedAt)} />
        ) : null}
        {session.closedAt ? (
          <InfoRow label="Ditutup" value={formatClock(session.closedAt)} />
        ) : null}
      </View>

      <View style={styles.actions}>
        <Text variant="caption" tone="muted">
          {statusHint}
        </Text>
        {canOpen ? (
          <Button label="Buka sesi" onPress={() => setSheet('open')} />
        ) : null}
        {canClose ? (
          <Button
            label="Tutup sesi"
            variant="outline"
            onPress={() => setSheet('close')}
          />
        ) : null}
        <Button
          label={`Lihat rekap kehadiran (${attendees.length})`}
          variant="soft"
          onPress={() =>
            navigation.navigate('AssistantAttendanceRoster', { sessionId })
          }
        />
      </View>

      <ConfirmSheet
        visible={sheet !== null}
        title={sheet === 'open' ? 'Buka sesi sekarang?' : 'Tutup sesi?'}
        description={
          sheet === 'open'
            ? `${session.courseName} · ${session.groupName} · ${formatTimeRange(session.startsAt, session.endsAt)}. Praktikan dapat langsung melakukan presensi.`
            : `Praktikan tidak bisa presensi lagi. Tercatat ${attendees.length} dari ${totalParticipants} peserta.`
        }
        tone={sheet === 'close' ? 'danger' : 'default'}
        confirmLabel={sheet === 'open' ? 'Buka sesi' : 'Tutup sesi'}
        loading={submitting}
        onConfirm={() => {
          void confirmAction();
        }}
        onCancel={() => setSheet(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  info: { gap: spacing.sm },
  actions: { gap: spacing.sm },
});