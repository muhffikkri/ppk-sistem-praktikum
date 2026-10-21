import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../../domain/types';
import { Button, EmptyState, Header, Screen, StatusBadge, colors } from '../../shared/ui';
import { FeedbackBanner } from './components/FeedbackBanner';
import { formatClock, formatSessionDate, formatTimeRange } from './formatters';
import { useAssistantSessionDetail } from './useAssistantSessionDetail';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantSessionDetail'>;

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

  if (!session) {
    return (
      <Screen>
        <EmptyState
          title="Sesi tidak ditemukan"
          description="Sesi ini tidak tersedia pada data demo asisten."
          action={<Button label="Kembali ke jadwal" variant="secondary" onPress={() => navigation.goBack()} />}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header eyebrow="MODE ASISTEN · DETAIL SESI" title={session.courseName} description={session.groupName} />

      {feedback ? <FeedbackBanner feedback={feedback} onDismiss={dismissFeedback} /> : null}

      <View style={styles.card}>
        <View style={styles.statusRow}>
          <Text style={styles.infoLabel}>Status</Text>
          <StatusBadge status={session.status} />
        </View>
        <InfoRow label="Tanggal" value={formatSessionDate(session.startsAt)} />
        <InfoRow label="Waktu" value={formatTimeRange(session.startsAt, session.endsAt)} />
        {session.openedAt ? <InfoRow label="Dibuka pukul" value={formatClock(session.openedAt)} /> : null}
        {session.closedAt ? <InfoRow label="Ditutup pukul" value={formatClock(session.closedAt)} /> : null}
        <InfoRow label="Jumlah hadir" value={`${attendees.length} praktikan`} />
      </View>

      <View style={styles.actions}>
        <Text style={styles.hint}>{statusHint}</Text>
        {canOpen ? (
          <Button
            label="Buka sesi"
            accessibilityHint="Mengubah status sesi menjadi terbuka"
            onPress={openSession}
          />
        ) : null}
        {canClose ? (
          <Button
            label="Tutup sesi"
            accessibilityHint="Mengubah status sesi menjadi tertutup. Sesi tidak dapat dibuka kembali."
            onPress={closeSession}
          />
        ) : null}
        <Button
          label={`Lihat rekap kehadiran (${attendees.length})`}
          variant="secondary"
          onPress={() => navigation.navigate('AssistantAttendanceRoster', { sessionId })}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  infoLabel: { fontSize: 14, color: colors.muted },
  infoValue: { flex: 1, flexShrink: 1, textAlign: 'right', fontSize: 15, fontWeight: '600', color: colors.ink },
  actions: { gap: 12 },
  hint: { fontSize: 15, lineHeight: 22, color: colors.muted },
});
