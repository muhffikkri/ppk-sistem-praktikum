import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatSessionDate } from '../../app/formatters';
import type { RootStackParamList } from '../../app/navigation';
import {
  Banner,
  Button,
  Card,
  CardContent,
  ConfirmSheet,
  EmptyState,
  ErrorState,
  Header,
  ListRow,
  LoadingState,
  Screen,
  SectionHeader,
  spacing,
  StatCard,
  StatRow,
  StatusBadge,
  Text,
} from '../../shared/ui';
import { useAssistantSessionsViewModel, useAuth } from '../../state';
import { useAssistantLeaveViewModel } from '../leave';
import { formatClock, formatTimeRange } from '../student/formatters';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;
type Feedback = { tone: 'success' | 'danger'; title: string; message: string };

const RECENT_LIMIT = 5;

export function AssistantHome({ navigation }: { navigation: Nav }) {
  const { user } = useAuth();
  const vm = useAssistantSessionsViewModel();
  const leave = useAssistantLeaveViewModel();
  const [confirmClose, setConfirmClose] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  if (vm.loading) {
    return (
      <Screen>
        <LoadingState label="Memuat sesi…" />
      </Screen>
    );
  }
  if (vm.error) {
    return (
      <Screen>
        <ErrorState
          title="Gagal memuat sesi"
          message={vm.error}
          onRetry={vm.retry}
        />
      </Screen>
    );
  }

  const firstName = user?.displayName?.trim().split(/\s+/)[0] || 'Asisten';
  const byStart = [...vm.sessions].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
  const active =
    byStart.find((s) => s.status === 'open') ??
    byStart.find((s) => s.status === 'scheduled');

  const pending = leave.leaveRequests.filter((r) => r.status === 'pending');
  const records = active ? vm.getAttendanceForSession(active.id) : [];
  const participants = active
    ? (active.participantIds ??
      vm.getClassById(active.classId ?? '')?.participantIds ??
      [])
    : [];
  const absent = Math.max(0, participants.length - records.length);
  const pendingHere = active
    ? pending.filter((r) => r.sessionId === active.id).length
    : 0;
  const recent = [...records]
    .sort(
      (a, b) =>
        new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime(),
    )
    .slice(0, RECENT_LIMIT);

  const run = async (kind: 'open' | 'close') => {
    if (!active || busy) return;
    setBusy(true);
    const result =
      kind === 'open'
        ? await vm.openSession(active.id)
        : await vm.closeSession(active.id);
    setBusy(false);
    setConfirmClose(false);
    setFeedback(
      result.ok
        ? {
            tone: 'success',
            title: kind === 'open' ? 'Sesi dibuka' : 'Sesi ditutup',
            message: active.courseName,
          }
        : { tone: 'danger', title: 'Aksi gagal', message: result.message },
    );
  };

  return (
    <Screen>
      <Header
        eyebrow={formatSessionDate(new Date().toISOString())}
        title={`Halo, ${firstName}`}
      />

      {feedback ? (
        <Banner
          tone={feedback.tone}
          title={feedback.title}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      ) : null}

      {active ? (
        <Card variant="heroInk" interactive={false}>
          <CardContent>
            <StatusBadge
              label={
                active.status === 'open'
                  ? 'Sesi berlangsung'
                  : 'Sesi berikutnya'
              }
              tone="lavender"
            />
            <Text variant="subtitle" tone="onDark">
              {active.courseName}
            </Text>
            <Text variant="caption" tone="onDarkMuted">
              {`${active.groupName} · ${formatTimeRange(active.startsAt, active.endsAt)}${active.lab ? ` · ${active.lab}` : ''}`}
            </Text>
            <StatCard
              variant="ink"
              value={records.length}
              suffix={`/ ${participants.length}`}
              label="Praktikan hadir"
            />
            <StatRow>
              <StatCard
                variant="panel"
                value={pendingHere}
                label="Izin menunggu"
              />
              <StatCard variant="panel" value={absent} label="Belum hadir" />
            </StatRow>
            {active.status === 'scheduled' ? (
              <Button
                label="Buka sesi"
                variant="primary"
                loading={busy}
                onPress={() => run('open')}
              />
            ) : (
              <Button
                label="Tutup sesi"
                variant="outline"
                onPress={() => setConfirmClose(true)}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon="calendar-outline"
          title="Belum ada sesi"
          description="Buat sesi praktikum dari kelas yang kamu kelola."
          action={
            <Button
              label="Buat sesi"
              variant="primary"
              onPress={() => navigation.navigate('AssistantSessionForm', {})}
            />
          }
        />
      )}

      {active && recent.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader
            title="Kehadiran terbaru"
            actionLabel="Lihat semua"
            onAction={() => navigation.navigate('AssistantAllAttendance')}
          />
          {recent.map((r) => (
            <ListRow
              key={r.id}
              title={r.studentName}
              meta={`NIM ${r.studentId}`}
              trailing={
                <Text variant="bodyStrong">{formatClock(r.checkedInAt)}</Text>
              }
            />
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Pintasan" />
        <ListRow
          title="Kelola kelas"
          onPress={() => navigation.navigate('AssistantClassList')}
        />
        <ListRow
          title="Buat sesi"
          onPress={() => navigation.navigate('AssistantSessionForm', {})}
        />
        <ListRow
          title="Semua sesi"
          onPress={() => navigation.navigate('AssistantAllSessions')}
        />
        <ListRow
          title="Pemeriksaan izin"
          onPress={() => navigation.navigate('AssistantLeaveReviewList')}
          trailing={
            pending.length > 0 ? (
              <StatusBadge label={`${pending.length} menunggu`} tone="pink" />
            ) : undefined
          }
        />
      </View>

      <ConfirmSheet
        visible={confirmClose}
        title="Tutup sesi?"
        description="Praktikan tidak bisa presensi lagi setelah sesi ditutup."
        confirmLabel="Tutup sesi"
        tone="danger"
        loading={busy}
        onConfirm={() => run('close')}
        onCancel={() => setConfirmClose(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
});
