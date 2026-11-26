import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Banner,
  Button,
  ConfirmSheet,
  EmptyState,
  InfoRow,
  Screen,
  spacing,
  StatCard,
  StatRow,
  Text,
  BackButton,
} from '../../shared/ui';
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
    recap,
    canOpen,
    canClose,
    canEdit,
    canCancel,
    statusHint,
    feedback,
    openSession,
    closeSession,
    cancelSession,
    dismissFeedback,
  } = useAssistantSessionDetail(sessionId);
  const [sheet, setSheet] = useState<'open' | 'close' | 'cancel' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!session) {
    return (
      <Screen withDock={false}>
        <BackButton onPress={() => navigation.goBack()} />
        <EmptyState
          icon="alert-circle-outline"
          title="Sesi tidak ditemukan"
          description="Sesi ini tidak tersedia atau sudah dihapus."
        />
      </Screen>
    );
  }

  const confirmAction = async () => {
    if (!sheet) return;
    setSubmitting(true);
    try {
      if (sheet === 'open') {
        await openSession();
      } else if (sheet === 'close') {
        await closeSession();
      } else if (sheet === 'cancel') {
        await cancelSession();
      }
    } finally {
      setSubmitting(false);
      setSheet(null);
    }
  };

  return (
    <Screen withDock={false}>
      <BackButton onPress={() => navigation.goBack()} />

      {feedback ? (
        <Banner
          title={feedback.kind === 'success' ? 'Berhasil' : 'Gagal'}
          message={feedback.message}
          tone={feedback.kind === 'success' ? 'success' : 'danger'}
          onDismiss={dismissFeedback}
        />
      ) : null}

      <StatRow>
        <StatCard
          variant="panel"
          value={recap.summary.presentCount}
          label="Hadir"
        />
        <StatCard
          variant="panel"
          value={recap.summary.excusedCount}
          label="Izin"
        />
        <StatCard
          variant="panel"
          value={recap.summary.absentCount}
          label="Belum hadir"
        />
      </StatRow>

      <View style={styles.info}>
        <InfoRow label="Tanggal" value={formatSessionDate(session.startsAt)} />
        <InfoRow
          label="Waktu"
          value={formatTimeRange(session.startsAt, session.endsAt)}
        />
        <InfoRow
          label="Toleransi"
          value={`${session.toleranceMinutes ?? 15} menit`}
        />
        {session.openedAt ? (
          <InfoRow label="Dibuka" value={formatClock(session.openedAt)} />
        ) : null}
        {session.closedAt ? (
          <InfoRow label="Ditutup" value={formatClock(session.closedAt)} />
        ) : null}
        {session.cancelledAt ? (
          <InfoRow
            label="Dibatalkan"
            value={formatClock(session.cancelledAt)}
          />
        ) : null}
      </View>

      <View style={styles.actions}>
        <Text variant="caption" tone="muted">
          {statusHint}
        </Text>
        {canOpen ? (
          <Button label="Buka sesi" onPress={() => setSheet('open')} />
        ) : null}
        {session.status === 'open' ? (
          <Button
            label="Tampilkan kode presensi"
            onPress={() =>
              navigation.navigate('AssistantSessionQr', { sessionId })
            }
          />
        ) : null}
        {canClose ? (
          <Button
            label="Tutup sesi"
            variant="outline"
            onPress={() => setSheet('close')}
          />
        ) : null}
        {canEdit ? (
          <Button
            label="Edit sesi"
            variant="soft"
            onPress={() =>
              navigation.navigate('AssistantSessionForm', { sessionId })
            }
          />
        ) : null}
        {canCancel ? (
          <Button
            label="Batalkan sesi"
            variant="destructive"
            onPress={() => setSheet('cancel')}
          />
        ) : null}
        <Button
          label={`Lihat rekap kehadiran (${recap.summary.presentCount}/${recap.summary.total})`}
          variant="soft"
          onPress={() =>
            navigation.navigate('AssistantAttendanceRoster', { sessionId })
          }
        />
      </View>

      <ConfirmSheet
        visible={sheet !== null}
        title={
          sheet === 'open'
            ? 'Buka sesi sekarang?'
            : sheet === 'cancel'
              ? 'Batalkan sesi?'
              : 'Tutup sesi?'
        }
        description={
          sheet === 'open'
            ? `${session.courseName} · ${session.groupName} · ${formatTimeRange(session.startsAt, session.endsAt)}. Praktikan dapat langsung melakukan presensi.`
            : sheet === 'cancel'
              ? 'Sesi tetap terlihat di jadwal praktikan dengan status dibatalkan dan tidak bisa dibuka.'
              : `Praktikan tidak bisa presensi lagi. Tercatat ${recap.summary.presentCount} dari ${recap.summary.total} peserta.`
        }
        tone={sheet === 'close' || sheet === 'cancel' ? 'danger' : 'default'}
        confirmLabel={
          sheet === 'open'
            ? 'Buka sesi'
            : sheet === 'cancel'
              ? 'Batalkan sesi'
              : 'Tutup sesi'
        }
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
