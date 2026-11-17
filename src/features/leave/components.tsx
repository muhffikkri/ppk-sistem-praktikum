import { StyleSheet, View } from 'react-native';
import type { AiClassificationResult, LeaveRequest } from '../../domain/types';
import {
  Banner,
  Button,
  Card,
  CardContent,
  EmptyState,
  LoadingState,
  spacing,
  StatusBadge,
  Text,
  type BadgeTone,
} from '../../shared/ui';
import { colors, radius, typography } from '../../theme/tokens';

export const leaveLabels = {
  pending: 'Menunggu',
  approved: 'Diterima',
  rejected: 'Ditolak',
};

// Label manusia untuk kategori AI (model EDOM lokal).
export const aiCategoryLabels: Record<string, string> = {
  alasan_strong: 'Alasan Kuat',
  alasan_netral: 'Alasan Netral',
  alasan_weak: 'Alasan Lemah',
};

const aiCategoryTone: Record<string, BadgeTone> = {
  alasan_strong: 'success',
  alasan_netral: 'lavender',
  alasan_weak: 'pink',
};

const leaveTone: Record<LeaveRequest['status'], BadgeTone> = {
  pending: 'lavender',
  approved: 'success',
  rejected: 'danger',
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
    <>
      <View style={styles.aiRow}>
        <StatusBadge
          label={aiCategoryLabels[prediction.category ?? ''] ?? 'Alasan Netral'}
          tone={aiCategoryTone[prediction.category ?? ''] ?? 'lavender'}
          dot
        />
        {prediction.confidence !== null ? (
          <Text variant="caption" tone="muted">
            keyakinan {Math.round(prediction.confidence * 100)}%
          </Text>
        ) : null}
      </View>
      <Text variant="caption" tone="muted">
        Hasil otomatis dari model lokal (EDOM). Hanya informasi pendukung;
        keputusan tetap ada pada asisten.
      </Text>
    </>
  );
}

export function RequestCard({ item }: { item: LeaveRequest }) {
  return (
    <Card>
      <CardContent>
        <View style={styles.requestHead}>
          <Text variant="bodyStrong" numberOfLines={2} style={styles.flex}>
            {item.courseName} · {item.groupName}
          </Text>
          <StatusBadge
            label={leaveLabels[item.status]}
            tone={leaveTone[item.status]}
          />
        </View>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {item.studentName} ·{' '}
          {new Date(item.sessionStartsAt).toLocaleString('id-ID')}
        </Text>
        <Text variant="body" numberOfLines={4}>
          {item.reason}
        </Text>
        <AiResult prediction={item.aiPrediction} />
        {item.decisionNote ? (
          <Text variant="caption" tone="muted">
            Catatan asisten: {item.decisionNote}
          </Text>
        ) : null}
        {item.reviewedAt ? (
          <Text variant="caption" tone="muted">
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
        <LoadingState label="Memuat pengajuan izin…" />
      ) : null}
      {error ? (
        <>
          <Banner tone="danger" title="Gagal memuat izin" message={error} />
          <Button label="Coba lagi" variant="outline" onPress={retry} />
        </>
      ) : null}
      {!loading && !error && empty ? (
        <EmptyState
          icon="document-text-outline"
          title="Belum ada pengajuan izin"
          description="Pengajuan izin akan muncul di sini setelah dikirim oleh praktikan."
        />
      ) : null}
    </>
  );
}

// Dipakai juga oleh layar asisten. Kunci title, subtitle, body, input, dan
// group tetap ada agar layar itu tidak berubah.
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
  flex: { flex: 1, flexShrink: 1 },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  requestHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  group: { gap: spacing.md },
});
