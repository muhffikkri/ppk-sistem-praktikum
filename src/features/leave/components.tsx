import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import type { AiClassificationResult, LeaveRequest } from '../../domain/types';
import { Banner, Button, Card, CardContent, EmptyState } from '../../shared/ui';
import { colors, radius, spacing, typography } from '../../theme/tokens';

export const leaveLabels = {
  pending: 'Menunggu',
  approved: 'Diterima',
  rejected: 'Ditolak',
};
export function AiResult({
  prediction,
}: {
  prediction: AiClassificationResult;
}) {
  return prediction.status === 'unavailable' ? (
    <Banner
      tone="warning"
      title="AI tidak tersedia"
      message="Klasifikasi AI tidak tersedia saat ini. Pengajuan tetap dapat disimpan untuk diperiksa asisten."
    />
  ) : (
    <Text style={styles.body}>
      Kategori AI: {prediction.category}
      {prediction.confidence !== null
        ? ` (${Math.round(prediction.confidence * 100)}%)`
        : ''}
      . Hasil ini hanya informasi pendukung; keputusan dibuat asisten.
    </Text>
  );
}
export function RequestCard({ item }: { item: LeaveRequest }) {
  return (
    <Card>
      <CardContent>
        <Text style={styles.subtitle}>
          {item.courseName} · {item.groupName}
        </Text>
        <Text style={styles.body}>
          {item.studentName} ·{' '}
          {new Date(item.sessionStartsAt).toLocaleString('id-ID')}
        </Text>
        <Text style={styles.subtitle}>Status: {leaveLabels[item.status]}</Text>
        <Text style={styles.body}>{item.reason}</Text>
        <AiResult prediction={item.aiPrediction} />
        {item.decisionNote ? (
          <Text style={styles.body}>Catatan asisten: {item.decisionNote}</Text>
        ) : null}
        {item.reviewedAt ? (
          <Text style={styles.body}>
            Diperiksa: {new Date(item.reviewedAt).toLocaleString('id-ID')}
          </Text>
        ) : null}
      </CardContent>
    </Card>
  );
}
export function ListFeedback({
  loading,
  error,
  empty,
  retry,
}: {
  loading: boolean;
  error: string | null;
  empty: boolean;
  retry: () => void;
}) {
  return (
    <>
      {loading && empty ? (
        <>
          <ActivityIndicator />
          <Text style={styles.body}>Memuat pengajuan izin…</Text>
        </>
      ) : null}
      {error ? (
        <>
          <Banner tone="danger" title="Gagal memuat izin" message={error} />
          <Button label="Coba Lagi" onPress={retry} />
        </>
      ) : null}
      {!loading && !error && empty ? (
        <EmptyState
          title="Belum ada pengajuan izin"
          description="Pengajuan izin akan muncul di sini setelah dikirim oleh praktikan."
        />
      ) : null}
    </>
  );
}
export const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.ink },
  subtitle: { ...typography.bodyStrong, color: colors.ink },
  body: { ...typography.body, color: colors.ink },
  input: {
    ...typography.body,
    color: colors.ink,
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  group: { gap: spacing.md },
});
