import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import type { Session } from '../../domain/types';
import {
  Banner,
  Button,
  Card,
  CardContent,
  ConfirmSheet,
  EmptyState,
  ErrorState,
  Header,
  InfoRow,
  LoadingState,
  Screen,
  spacing,
  Text,
  TopBar,
} from '../../shared/ui';
import { useStudentAttendanceViewModel } from '../../state';
import { useStudentLeaveViewModel } from '../leave';
import { formatClock, formatSessionDate, formatTimeRange } from './formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentSessionDetail'>;

type Feedback =
  { kind: 'ok'; message: string } | { kind: 'error'; message: string } | null;

const LEAVE_STATUS_LABEL = {
  pending: 'Menunggu',
  approved: 'Diterima',
  rejected: 'Ditolak',
} as const;

const SESSION_STATUS_LABEL: Record<Session['status'], string> = {
  open: 'Terbuka',
  scheduled: 'Terjadwal',
  closed: 'Tertutup',
};

export function StudentSessionDetailScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const {
    getSessionById,
    getAttendanceForSession,
    checkIn,
    submittingSessionId,
    loading,
    error,
    retry,
  } = useStudentAttendanceViewModel();
  const { getLeaveForSession } = useStudentLeaveViewModel();
  const [feedback, setFeedback] = useState<Feedback>(null);
  // Satu Modal untuk konfirmasi & sukses: iOS tidak bisa menampilkan Modal
  // kedua selagi Modal pertama masih beranimasi menutup.
  const [sheet, setSheet] = useState<
    { kind: 'confirm' } | { kind: 'success'; time: string } | null
  >(null);

  if (loading) {
    return (
      <Screen>
        <TopBar title="Detail sesi" onBack={() => navigation.goBack()} />
        <LoadingState label="Memuat jadwal…" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <TopBar title="Detail sesi" onBack={() => navigation.goBack()} />
        <ErrorState
          title="Gagal memuat jadwal"
          message={error}
          onRetry={retry}
        />
      </Screen>
    );
  }

  const session = getSessionById(sessionId);
  const record = getAttendanceForSession(sessionId);
  const existingLeave = getLeaveForSession(sessionId);

  if (!session) {
    return (
      <Screen>
        <TopBar title="Detail sesi" onBack={() => navigation.goBack()} />
        <EmptyState
          title="Sesi tidak ditemukan"
          description="Sesi tidak ditemukan atau kamu bukan peserta kelas ini."
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

  const onCheckIn = async () => {
    const result = await checkIn(session.id);
    if (!result.ok) {
      setSheet(null);
      setFeedback({ kind: 'error', message: result.message });
      return;
    }
    setFeedback(null);
    setSheet({ kind: 'success', time: formatClock(new Date().toISOString()) });
  };

  return (
    <Screen>
      <TopBar title="Detail sesi" onBack={() => navigation.goBack()} />
      <Header title={session.courseName} description={session.groupName} />

      {feedback ? (
        <Banner
          title={feedback.kind === 'ok' ? 'Berhasil' : 'Gagal presensi'}
          message={feedback.message}
          tone={feedback.kind === 'ok' ? 'success' : 'danger'}
          onDismiss={() => setFeedback(null)}
        />
      ) : null}

      <Card interactive={false}>
        <CardContent>
          <InfoRow
            label="Status"
            value={SESSION_STATUS_LABEL[session.status]}
          />
          <InfoRow
            label="Tanggal"
            value={formatSessionDate(session.startsAt)}
          />
          <InfoRow
            label="Waktu"
            value={formatTimeRange(session.startsAt, session.endsAt)}
          />
          <InfoRow
            label="Presensi kamu"
            value={
              record ? `Hadir ${formatClock(record.checkedInAt)}` : 'Belum'
            }
          />
        </CardContent>
      </Card>

      <View style={styles.actions}>
        {record ? (
          <Banner
            title="Presensi tercatat"
            message={`Presensi tercatat pukul ${formatClock(record.checkedInAt)}.`}
            tone="success"
          />
        ) : session.status === 'open' ? (
          <Button
            label={
              submittingSessionId === session.id
                ? 'Memproses…'
                : 'Presensi sekarang'
            }
            variant="accent"
            icon="checkmark"
            disabled={submittingSessionId === session.id}
            accessibilityHint="Mencatat kehadiran di sesi ini"
            onPress={() => setSheet({ kind: 'confirm' })}
          />
        ) : (
          <Text tone="muted">
            {session.status === 'scheduled'
              ? 'Sesi belum dibuka'
              : 'Sesi sudah ditutup'}
          </Text>
        )}
        {existingLeave ? (
          <Text tone="muted">
            Status izin: {LEAVE_STATUS_LABEL[existingLeave.status]}
          </Text>
        ) : !record && session.status !== 'closed' ? (
          <Button
            label="Ajukan izin"
            variant="outline"
            onPress={() =>
              navigation.navigate('StudentLeaveRequestForm', {
                sessionId: session.id,
              })
            }
          />
        ) : null}
        <Button
          label="Lihat riwayat kehadiran"
          variant="outline"
          onPress={() => navigation.navigate('StudentAttendanceHistory')}
        />
      </View>

      {sheet?.kind === 'success' ? (
        <ConfirmSheet
          visible
          title="Presensi berhasil"
          description={`Tercatat pukul ${sheet.time}.`}
          confirmLabel="Selesai"
          cancelLabel=""
          onConfirm={() => setSheet(null)}
          onCancel={() => setSheet(null)}
        />
      ) : (
        <ConfirmSheet
          visible={sheet?.kind === 'confirm'}
          title="Konfirmasi presensi"
          description={`${session.courseName} · ${session.groupName}. Waktu kehadiran akan dicatat sekarang.`}
          confirmLabel="Presensi"
          loading={submittingSessionId === session.id}
          onConfirm={() => {
            void onCheckIn();
          }}
          onCancel={() => setSheet(null)}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.md },
});
