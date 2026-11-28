import { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { PaidFine } from '../../domain/fineFinanceRules';
import { formatDayMonth, formatHourMinute } from '../../shared/format/date';
import {
  EmptyState,
  ErrorState,
  ListRow,
  SectionHeader,
  SkeletonList,
  StatCard,
  StatRow,
  Text,
} from '../../shared/ui';
import { spacing } from '../../theme/tokens';
import { formatRupiah } from '../fines/fineFormat';
import type { AslabFinanceViewModel } from './useAslabFinance';

const PREVIEW = 5;

const PaidFineRow = memo(function PaidFineRow({ fine }: { fine: PaidFine }) {
  const paidAt = new Date(fine.paidAtMs);
  const course = [fine.courseName, fine.groupName].filter(Boolean).join(' · ');
  return (
    <ListRow
      title={fine.studentName || 'Praktikan'}
      meta={[
        course,
        `Dibayar ${formatDayMonth(paidAt)}, ${formatHourMinute(paidAt)}`,
      ]
        .filter(Boolean)
        .join(' · ')}
      trailing={
        <Text variant="bodyStrong" numberOfLines={1}>
          {formatRupiah(fine.amount)}
        </Text>
      }
    />
  );
});

/** Riwayat keuangan denda pada periode terpilih (SRS-4.14). */
export function FinanceSection({
  finance,
  periodTitle,
}: {
  finance: AslabFinanceViewModel;
  periodTitle: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { summary } = finance;
  const rows = expanded ? summary.paid : summary.paid.slice(0, PREVIEW);

  return (
    <View style={styles.section}>
      <SectionHeader
        title={`Keuangan denda · ${periodTitle}`}
        actionLabel={
          summary.paid.length > PREVIEW
            ? expanded
              ? 'Ringkas'
              : 'Lihat semua'
            : undefined
        }
        onAction={() => setExpanded((value) => !value)}
      />
      {finance.error ? (
        <ErrorState
          title="Gagal memuat keuangan"
          message={finance.error}
          onRetry={finance.retry}
        />
      ) : finance.loading ? (
        <SkeletonList count={2} label="Memuat riwayat keuangan…" />
      ) : (
        <>
          <StatCard
            variant="ink"
            value={formatRupiah(summary.receivedAmount)}
            label={`Dana diterima dari ${summary.paidCount} tagihan lunas terverifikasi`}
          />
          <StatRow>
            <StatCard
              variant="panel"
              value={summary.outstandingCount}
              suffix={formatRupiah(summary.outstandingAmount)}
              label="Belum dibayar saat ini"
            />
            <StatCard
              variant="panel"
              value={summary.waivedCount}
              label="Dibebaskan karena izin"
            />
          </StatRow>
          {rows.length > 0 ? (
            rows.map((fine) => <PaidFineRow key={fine.id} fine={fine} />)
          ) : (
            <EmptyState
              icon="wallet-outline"
              title="Belum ada pembayaran"
              description="Tidak ada denda yang lunas pada periode ini."
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
});
