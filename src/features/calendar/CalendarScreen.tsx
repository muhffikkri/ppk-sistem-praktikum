import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import type { Session } from '../../domain/types';
import {
  Banner,
  Button,
  EmptyState,
  ErrorState,
  Header,
  ListRow,
  LoadingState,
  Screen,
  spacing,
  StatusBadge,
  Text,
  type BadgeTone,
} from '../../shared/ui';
import {
  useAssistantSessionsViewModel,
  useAuth,
  useStudentAttendanceViewModel,
} from '../../state';
import { formatClock } from '../student/formatters';
import { SessionPreviewSheet } from './SessionPreviewSheet';
import { useCalendarViewModel } from './useCalendarViewModel';
import { WeekStrip } from './WeekStrip';

type Props = NativeStackScreenProps<RootStackParamList, 'Calendar'>;

const STATUS_LABEL = {
  open: 'Terbuka',
  scheduled: 'Terjadwal',
  closed: 'Tertutup',
} as const;
const STATUS_TONE: Record<Session['status'], BadgeTone> = {
  open: 'violet',
  scheduled: 'lavender',
  closed: 'neutral',
};

export function CalendarScreen({ navigation }: Props) {
  const { user } = useAuth();
  const isAssistant = user?.role === 'assistant';
  const assistant = useAssistantSessionsViewModel();
  const student = useStudentAttendanceViewModel();
  const source = isAssistant ? assistant : student;

  const cal = useCalendarViewModel(source.sessions);
  const [preview, setPreview] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  if (source.loading) {
    return (
      <Screen>
        <LoadingState label="Memuat kalender…" />
      </Screen>
    );
  }
  if (source.error) {
    return (
      <Screen>
        <ErrorState
          title="Gagal memuat kalender"
          message={source.error}
          onRetry={source.retry}
        />
      </Screen>
    );
  }

  const openDetail = (session: Session) => {
    setPreview(null);
    if (isAssistant) {
      navigation.navigate('AssistantSessionDetail', { sessionId: session.id });
    } else {
      navigation.navigate('StudentSessionDetail', { sessionId: session.id });
    }
  };

  const act = async (session: Session, kind: 'open' | 'close') => {
    setBusy(true);
    const result =
      kind === 'open'
        ? await assistant.openSession(session.id)
        : await assistant.closeSession(session.id);
    setBusy(false);
    setPreview(null);
    setFeedback(
      result.ok
        ? {
            tone: 'success',
            title: kind === 'open' ? 'Sesi dibuka' : 'Sesi ditutup',
            message: session.courseName,
          }
        : { tone: 'danger', title: 'Aksi gagal', message: result.message },
    );
  };

  return (
    <Screen>
      <Header title={cal.monthYear} />

      <WeekStrip
        days={cal.days}
        onSelect={cal.select}
        onPrev={cal.prevWeek}
        onNext={cal.nextWeek}
      />
      {!cal.isCurrentWeek ? (
        <Button
          label="Kembali ke hari ini"
          variant="soft"
          size="sm"
          onPress={cal.goToday}
        />
      ) : null}

      {feedback ? (
        <Banner
          tone={feedback.tone}
          title={feedback.title}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      ) : null}

      <View style={styles.list}>
        {cal.daySessions.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Tidak ada sesi"
            description="Belum ada sesi praktikum pada tanggal ini."
          />
        ) : (
          cal.daySessions.map((s) => (
            <ListRow
              key={s.id}
              title={s.courseName}
              meta={`${s.groupName}${s.lab ? ` · ${s.lab}` : ''}`}
              leading={
                <Text variant="bodyStrong">{formatClock(s.startsAt)}</Text>
              }
              onPress={() => setPreview(s)}
              accessibilityHint="Membuka pratinjau sesi"
              trailing={
                <StatusBadge
                  label={STATUS_LABEL[s.status]}
                  tone={STATUS_TONE[s.status]}
                />
              }
            />
          ))
        )}
      </View>

      <SessionPreviewSheet
        session={preview}
        isAssistant={isAssistant}
        busy={busy}
        onClose={() => setPreview(null)}
        onDetail={openDetail}
        onOpenSession={(s) => act(s, 'open')}
        onCloseSession={(s) => act(s, 'close')}
      />
    </Screen>
  );
}

type Feedback = { tone: 'success' | 'danger'; title: string; message: string };

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
});
