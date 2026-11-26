import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import type { Fine } from '../../domain/types';
import { subscribeFine } from '../../services/firestore/fineService';
import { createFineCheckout } from '../../services/firestore/paymentService';
import { useAuth } from '../../state';
import {
  Banner,
  Button,
  Card,
  CardContent,
  ErrorState,
  Header,
  InfoRow,
  LoadingState,
  Screen,
  StatusBadge,
  Text,
  TopBar,
  spacing,
} from '../../shared/ui';
import { fineStatusLabel, fineStatusTone, formatRupiah } from './fineFormat';
import { formatSessionDate } from '../student/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentFineDetail'>;

export function StudentFineDetailScreen({ navigation, route }: Props) {
  const { fineId } = route.params;
  const { user } = useAuth();
  const [fine, setFine] = useState<Fine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!user) return;
    return subscribeFine(
      fineId,
      (data) => {
        if (data && data.studentId !== user.uid) {
          setFine(null);
          setError('Tagihan tidak ditemukan.');
        } else {
          setFine(data);
          if (!data) setError('Tagihan tidak ditemukan.');
        }
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      },
    );
  }, [fineId, user, retry]);

  const doRetry = () => {
    setLoading(true);
    setError(null);
    setRetry((v) => v + 1);
  };

  const onPay = async () => {
    if (!fine || paying || fine.status !== 'unpaid') return;
    setPaying(true);
    setPayError(null);
    const result = await createFineCheckout(fine.id);
    setPaying(false);
    if (!result.ok) {
      setPayError(result.message);
      return;
    }
    await Linking.openURL(result.data.redirectUrl);
  };

  return (
    <Screen>
      <TopBar onBack={() => navigation.goBack()} />
      <Header
        title="Detail tagihan"
        description="Informasi denda keterlambatan"
      />

      {loading ? <LoadingState label="Memuat detail tagihan…" /> : null}

      {!loading && error ? (
        <ErrorState
          title="Gagal memuat tagihan"
          message={error}
          onRetry={doRetry}
        />
      ) : null}

      {!loading && fine ? (
        <View style={{ gap: spacing.md }}>
          <Card>
            <CardContent>
              <View style={{ gap: spacing.sm }}>
                <StatusBadge
                  label={fineStatusLabel(fine.status)}
                  tone={fineStatusTone(fine.status)}
                />
                <Text variant="title">{formatRupiah(fine.amount)}</Text>
              </View>
              <InfoRow label="Sesi" value={fine.courseName ?? fine.sessionId} />
              {fine.groupName ? (
                <InfoRow label="Kelompok" value={fine.groupName} />
              ) : null}
              {fine.lab ? <InfoRow label="Lab" value={fine.lab} /> : null}
              <InfoRow
                label="Tanggal tagihan"
                value={fine.issuedAt ? formatSessionDate(fine.issuedAt) : '-'}
              />
              <InfoRow label="Status" value={fineStatusLabel(fine.status)} />
            </CardContent>
          </Card>

          {payError ? (
            <Banner
              tone="danger"
              title="Pembayaran gagal dimulai"
              message={payError}
            />
          ) : null}

          {fine.status === 'unpaid' ? (
            <Button
              label={paying ? 'Menyiapkan pembayaran…' : 'Bayar sekarang'}
              onPress={onPay}
              loading={paying}
              disabled={paying}
            />
          ) : null}

          {fine.status === 'paid' ? (
            <Banner
              tone="success"
              title="Tagihan lunas"
              message="Pembayaran sudah diverifikasi."
            />
          ) : null}

          {fine.status === 'waived' ? (
            <Banner
              tone="warning"
              title="Tagihan dibebaskan"
              message="Denda ini dibebaskan sesuai keputusan izin."
            />
          ) : null}

          <Button
            label="Lihat riwayat pembayaran"
            variant="outline"
            onPress={() => navigation.navigate('StudentPaymentHistory')}
          />
        </View>
      ) : null}
    </Screen>
  );
}
