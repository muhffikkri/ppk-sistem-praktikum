import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';

import type { RootStackParamList } from '../../app/navigation';
import type { PaymentTransaction } from '../../domain/types';
import { subscribeStudentPayments } from '../../services/firestore/paymentService';
import { useAuth } from '../../state';
import {
  EmptyState,
  ErrorState,
  Header,
  ListRow,
  LoadingState,
  Screen,
  ScreenList,
  SectionHeader,
  StatusBadge,
  TopBar,
} from '../../shared/ui';
import {
  formatRupiah,
  paymentStatusLabel,
  paymentStatusTone,
} from './fineFormat';
import { formatSessionDate } from '../student/formatters';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'StudentPaymentHistory'
>;

export function StudentPaymentHistoryScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!user) return;
    return subscribeStudentPayments(
      user.uid,
      (data) => {
        setItems(data);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      },
    );
  }, [user, retry]);

  const doRetry = () => {
    setLoading(true);
    setError(null);
    setRetry((v) => v + 1);
  };

  if (loading) {
    return (
      <Screen>
        <TopBar onBack={() => navigation.goBack()} />
        <Header title="Riwayat pembayaran" description="Memuat..." />
        <LoadingState label="Memuat riwayat pembayaran…" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <TopBar onBack={() => navigation.goBack()} />
        <Header title="Riwayat pembayaran" />
        <ErrorState
          title="Gagal memuat riwayat"
          message={error}
          onRetry={doRetry}
        />
      </Screen>
    );
  }

  return (
    <ScreenList
      data={items}
      keyExtractor={(item) => item.id}
      header={
        <>
          <TopBar onBack={() => navigation.goBack()} />
          <Header
            title="Riwayat pembayaran"
            description={`${items.length} transaksi`}
          />
        </>
      }
      sectionHeader={<SectionHeader title="Semua transaksi" />}
      empty={
        <EmptyState
          icon="card-outline"
          title="Belum ada transaksi"
          description="Riwayat pembayaran denda akan muncul di sini."
        />
      }
      renderItem={({ item }) => (
        <ListRow
          title={formatRupiah(item.amount)}
          meta={`${item.createdAt ? formatSessionDate(item.createdAt) : '-'}${item.sessionId ? ' · Sesi ' + item.sessionId.slice(0, 8) : ''}`}
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
      )}
    />
  );
}
