import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Banner,
  Button,
  Card,
  CardContent,
  colors,
  ConfirmSheet,
  Header,
  LegacyStatusBadge,
  Screen,
  typography,
} from '../../shared/ui';
import { useStudentLeaveViewModel } from '../leave';
import { useStudentAttendanceViewModel } from '../../state';
import { formatClock, formatSessionDate, formatTimeRange } from './formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentSessionDetail'>;

type Feedback =
  { kind: 'ok'; message: string } | { kind: 'error'; message: string } | null;

const LEAVE_STATUS_LABEL = {
  pending: 'Menunggu',
  approved: 'Diterima',
  rejected: 'Ditolak',
} as const;

export function StudentSessionDetailScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const {
    getSessionById,
    getAttendanceForSession,
    checkIn,
    currentStudent,
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
        <View style={styles.stateBlock}>
          <ActivityIndicator color={colors.violet} />
          <Text style={styles.stateText}>Memuat jadwal…</Text>
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <Banner
          title="Gagal memuat jadwal"
          message={error}
          tone="danger"
          action={
            <Button label="Coba lagi" variant="outline" onPress={retry} />
          }
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
        <Header
          eyebrow="MODE PRAKTIKAN · DETAIL SESI"
          title="Sesi tidak ditemukan"
          description="Sesi tidak ditemukan atau kamu bukan peserta kelas ini."
        />
        <Button
          label="Kembali ke jadwal"
          variant="outline"
          onPress={() => navigation.goBack()}
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
      <Header
        eyebrow="MODE PRAKTIKAN · DETAIL SESI"
        title={session.courseName}
        description={session.groupName}
      />

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
          <View style={styles.statusRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <LegacyStatusBadge status={session.status} />
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tanggal</Text>
            <Text style={styles.infoValue}>
              {formatSessionDate(session.startsAt)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Waktu</Text>
            <Text style={styles.infoValue}>
              {formatTimeRange(session.startsAt, session.endsAt)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Presensi kamu</Text>
            <Text style={[styles.infoValue, record && styles.infoValueOk]}>
              {record ? `Hadir ${formatClock(record.checkedInAt)}` : 'Belum'}
            </Text>
          </View>
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
          <Text style={styles.hint}>
            {session.status === 'scheduled'
              ? 'Sesi belum dibuka'
              : 'Sesi sudah ditutup'}
          </Text>
        )}
        {existingLeave ? (
          <Text style={styles.hint}>
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

      <Text style={styles.note}>
        {currentStudent?.email ?? '-'} • {currentStudent?.displayName ?? '-'}
      </Text>

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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  infoLabel: { ...typography.label, color: colors.inkMuted },
  infoValue: {
    flex: 1,
    flexShrink: 1,
    textAlign: 'right',
    ...typography.bodyStrong,
    color: colors.ink,
  },
  infoValueOk: { color: colors.successInk },
  stateBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 48,
  },
  stateText: { ...typography.body, color: colors.inkMuted },
  actions: { gap: 12 },
  hint: { ...typography.body, color: colors.inkMuted },
  note: { ...typography.caption, color: colors.inkMuted, marginTop: 4 },
});
