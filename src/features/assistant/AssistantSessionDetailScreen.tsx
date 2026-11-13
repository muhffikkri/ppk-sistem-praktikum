import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Button,
  Card,
  ConfirmSheet,
  EmptyState,
  Header,
  LegacyStatusBadge,
  Screen,
  colors,
  typography,
} from '../../shared/ui';
import { FeedbackBanner } from './components/FeedbackBanner';
import { formatClock, formatSessionDate, formatTimeRange } from './formatters';
import { useAssistantSessionDetail } from './useAssistantSessionDetail';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'AssistantSessionDetail'
>;

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

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
      <Screen>
        <EmptyState
          title="Sesi tidak ditemukan"
          description="Sesi ini tidak tersedia pada data demo asisten."
          action={
            <Button
              label="Kembali ke jadwal"
              variant="outline"
              onPress={() => navigation.goBack()}
            />
          }
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
    <Screen>
      <Header
        eyebrow="MODE ASISTEN · DETAIL SESI"
        title={session.courseName}
        description={session.groupName}
      />

      {feedback ? (
        <FeedbackBanner feedback={feedback} onDismiss={dismissFeedback} />
      ) : null}

      <Card>
        <View style={styles.cardInner}>
          <View style={styles.statusRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <LegacyStatusBadge status={session.status} />
          </View>
          <InfoRow
            label="Tanggal"
            value={formatSessionDate(session.startsAt)}
          />
          <InfoRow
            label="Waktu"
            value={formatTimeRange(session.startsAt, session.endsAt)}
          />
          {session.openedAt ? (
            <InfoRow
              label="Dibuka pukul"
              value={formatClock(session.openedAt)}
            />
          ) : null}
          {session.closedAt ? (
            <InfoRow
              label="Ditutup pukul"
              value={formatClock(session.closedAt)}
            />
          ) : null}
          <InfoRow
            label="Jumlah hadir"
            value={`${attendees.length} praktikan`}
          />
        </View>
      </Card>

      <View style={styles.actions}>
        <Text style={styles.hint}>{statusHint}</Text>
        {canOpen ? (
          <Button
            label="Buka sesi"
            accessibilityHint="Mengubah status sesi menjadi terbuka"
            onPress={() => setSheet('open')}
          />
        ) : null}
        {canClose ? (
          <Button
            label="Tutup sesi"
            accessibilityHint="Mengubah status sesi menjadi tertutup. Sesi tidak dapat dibuka kembali."
            onPress={() => setSheet('close')}
          />
        ) : null}
        <Button
          label={`Lihat rekap kehadiran (${attendees.length})`}
          variant="outline"
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
  cardInner: {
    padding: 18,
    gap: 14,
  },
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
  actions: { gap: 12 },
  hint: { ...typography.body, color: colors.inkMuted },
});
