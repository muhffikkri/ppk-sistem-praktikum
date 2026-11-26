import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';

import type { RootStackParamList } from '../../app/navigation';
import type { Fine } from '../../domain/types';
import { subscribeStudentFines } from '../../services/firestore/fineSubscriptionService';
import { useAuth } from '../../state';
import {
  EmptyState,
  ErrorState,
  ListRow,
  LoadingState,
  Screen,
  ScreenList,
  SectionHeader,
  StatusBadge,
  BackButton,
} from '../../shared/ui';
import { fineStatusLabel, fineStatusTone, formatRupiah } from './fineFormat';
import { formatSessionDate } from '../student/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentFineList'>;

export function StudentFineListScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!user) return;
    return subscribeStudentFines(
      user.uid,
      (data) => {
        setFines(data);
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
        <BackButton onPress={() => navigation.goBack()} />

        <LoadingState label="Memuat tagihan…" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <BackButton onPress={() => navigation.goBack()} />

        <ErrorState
          title="Gagal memuat tagihan"
          message={error}
          onRetry={doRetry}
        />
      </Screen>
    );
  }

  return (
    <ScreenList
      data={fines}
      keyExtractor={(item) => item.id}
      header={
        <>
          <BackButton onPress={() => navigation.goBack()} />
        </>
      }
      sectionHeader={<SectionHeader title="Daftar tagihan" />}
      empty={
        <EmptyState
          icon="receipt-outline"
          title="Belum ada tagihan"
          description="Tagihan denda keterlambatan akan muncul di sini."
        />
      }
      renderItem={({ item }) => (
        <ListRow
          title={item.courseName ?? 'Sesi praktikum'}
          meta={`${item.groupName ? item.groupName + ' · ' : ''}${item.issuedAt ? formatSessionDate(item.issuedAt) : '-'} · ${formatRupiah(item.amount)}`}
          trailing={
            <StatusBadge
              label={fineStatusLabel(item.status)}
              tone={fineStatusTone(item.status)}
            />
          }
          onPress={() =>
            navigation.navigate('StudentFineDetail', { fineId: item.id })
          }
        />
      )}
    />
  );
}
