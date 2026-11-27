import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';

import type { RootStackParamList } from '../../app/navigation';
import type { Fine, PaymentTransaction } from '../../domain/types';
import { subscribeStudentFines } from '../../services/firestore/fineSubscriptionService';
import { subscribeStudentPayments } from '../../services/firestore/paymentService';
import { formatDayMonth, formatHourMinute } from '../../shared/format/date';
import { useAuth } from '../../state';
import {
  BackButton,
  EmptyState,
  ErrorState,
  ListRow,
  Screen,
  ScreenList,
  SectionHeader,
  SkeletonList,
  StatusBadge,
} from '../../shared/ui';
import {
  formatRupiah,
  paymentStatusLabel,
  paymentStatusTone,
} from './fineFormat';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'StudentPaymentHistory'
>;

function formatMoment(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${formatDayMonth(date)}, ${formatHourMinute(date)}`;
}

/** Sesi, tanggal tagihan, nominal, dan waktu transaksi (SRS-4.19). */
function transactionMeta(item: PaymentTransaction, fine?: Fine): string {
  const issued = fine?.issuedAt ? new Date(fine.issuedAt) : null;
  return [
    formatRupiah(item.amount),
    `Transaksi ${formatMoment(item.createdAt) ?? '-'}`,
    issued ? `Tagihan ${formatDayMonth(issued)}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function StudentPaymentHistoryScreen({ navigation }: Props) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [items, setItems] = useState<PaymentTransaction[] | null>(null);
  const [fines, setFines] = useState<Fine[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!uid) return;
    const offPayments = subscribeStudentPayments(uid, setItems, setError);
    const offFines = subscribeStudentFines(uid, setFines, setError);
    return () => {
      offPayments();
      offFines();
    };
  }, [uid, retry]);

  const fineById = useMemo(
    () => new Map((fines ?? []).map((fine) => [fine.id, fine])),
    [fines],
  );

  const doRetry = () => {
    setItems(null);
    setFines(null);
    setError(null);
    setRetry((v) => v + 1);
  };

  const back = <BackButton onPress={() => navigation.goBack()} />;

  if (error) {
    return (
      <Screen>
        {back}
        <ErrorState
          title="Gagal memuat riwayat"
          message={error}
          onRetry={doRetry}
        />
      </Screen>
    );
  }

  if (items === null || fines === null) {
    return (
      <Screen>
        {back}
        <SkeletonList
          variant="row"
          count={5}
          label="Memuat riwayat pembayaran…"
        />
      </Screen>
    );
  }

  return (
    <ScreenList
      data={items}
      keyExtractor={(item) => item.id}
      header={back}
      sectionHeader={<SectionHeader title="Semua transaksi" />}
      empty={
        <EmptyState
          icon="card-outline"
          title="Belum ada transaksi"
          description="Riwayat pembayaran denda akan muncul di sini."
        />
      }
      renderItem={({ item }) => {
        const fine = fineById.get(item.fineId);
        const session = [fine?.courseName, fine?.groupName]
          .filter(Boolean)
          .join(' · ');
        return (
          <ListRow
            title={session || 'Sesi praktikum'}
            meta={transactionMeta(item, fine)}
            accessibilityHint="Membuka detail tagihan"
            trailing={
              <StatusBadge
                label={paymentStatusLabel(item.status)}
                tone={paymentStatusTone(item.status)}
              />
            }
            onPress={() =>
              navigation.navigate('StudentFineDetail', { fineId: item.fineId })
            }
          />
        );
      }}
    />
  );
}
