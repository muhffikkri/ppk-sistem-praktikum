import Ionicons from '@expo/vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import { isAssistantRole } from '../../domain/asprakScope';
import type { Session } from '../../domain/types';
import { colors, radius, spacing } from '../../theme/tokens';
import {
  Banner,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Header,
  LoadingState,
  Screen,
  SegmentedControl,
  StatusBadge,
  Text,
  BackButton,
  type BadgeTone,
  type SegmentedOption,
} from '../../shared/ui';
import { formatWeekdayDayMonth } from '../../shared/format/date';
import { useTransientFeedback } from '../../shared/navigation/useTransientFeedback';
import {
  useAssistantSessionsViewModel,
  useAuth,
  useStudentAttendanceViewModel,
} from '../../state';
import { formatClock } from '../student/formatters';
import { SessionPreviewSheet } from './SessionPreviewSheet';
import { RootTopBar } from '../shell/RootTopBar';
import { useCalendarViewModel } from './useCalendarViewModel';
import { WeekStrip } from './WeekStrip';

type Props = NativeStackScreenProps<RootStackParamList, 'Calendar'>;
type CalendarView = 'today' | 'week' | 'month';

const VIEWS: SegmentedOption<CalendarView>[] = [
  { value: 'today', label: 'Hari Ini' },
  { value: 'week', label: 'Mingguan' },
  { value: 'month', label: 'Bulan' },
];

const STATUS_LABEL = {
  open: 'Terbuka',
  scheduled: 'Terjadwal',
  closed: 'Tertutup',
  cancelled: 'Dibatalkan',
} as const;
const STATUS_TONE: Record<Session['status'], BadgeTone> = {
  open: 'violet',
  scheduled: 'lime',
  closed: 'neutral',
  cancelled: 'danger',
};

function TimelineCard({
  session,
  attendanceLabel,
  onPress,
}: {
  session: Session;
  attendanceLabel?: string;
  onPress: () => void;
}) {
  const isOpen = session.status === 'open';
  return (
    <Card
      onPress={onPress}
      accessibilityHint="Membuka pratinjau sesi"
      style={[styles.card, isOpen && styles.cardOpen]}
    >
      {isOpen ? (
        <View style={styles.accent} importantForAccessibility="no" />
      ) : null}
      <View style={styles.cardInner}>
        <View style={styles.timeColumn}>
          <Text variant="bodyStrong" tone={isOpen ? 'ink' : 'muted'}>
            {formatClock(session.startsAt)}
          </Text>
          <Text variant="caption" tone="muted">
            {formatClock(session.endsAt)}
          </Text>
        </View>
        <View
          style={[styles.divider, isOpen && styles.dividerOpen]}
          importantForAccessibility="no"
        />
        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <Text
              variant="bodyStrong"
              numberOfLines={1}
              style={styles.cardTitle}
            >
              {session.courseName}
            </Text>
            {session.title ? (
              <View
                style={[styles.moduleChip, isOpen && styles.moduleChipOpen]}
              >
                <Text
                  variant="caption"
                  tone={isOpen ? 'violet' : 'muted'}
                  numberOfLines={1}
                >
                  {session.title}
                </Text>
              </View>
            ) : null}
          </View>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {`${session.groupName}${session.lab ? ` · ${session.lab}` : ''}`}
          </Text>
          {attendanceLabel ? (
            <Text variant="caption" tone="violet" numberOfLines={1}>
              {attendanceLabel}
            </Text>
          ) : null}
        </View>
        <StatusBadge
          label={STATUS_LABEL[session.status]}
          tone={STATUS_TONE[session.status]}
        />
      </View>
    </Card>
  );
}

export function CalendarScreen({ navigation }: Props) {
  const { user } = useAuth();
  const isAssistant = isAssistantRole(user?.role);
  const assistant = useAssistantSessionsViewModel();
  const student = useStudentAttendanceViewModel();
  const source = isAssistant ? assistant : student;

  const cal = useCalendarViewModel(source.sessions);
  const [view, setView] = useState<CalendarView>('week');
  const [preview, setPreview] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const { feedback, showFeedback, clearFeedback } = useTransientFeedback();

  if (source.loading) {
    return (
      <Screen>
        <RootTopBar />
        <LoadingState label="Memuat kalender…" />
      </Screen>
    );
  }
  if (source.error) {
    return (
      <Screen>
        <RootTopBar />
        <ErrorState
          title="Gagal memuat kalender"
          message={source.error}
          onRetry={source.retry}
        />
      </Screen>
    );
  }

  const changeView = (next: CalendarView) => {
    setView(next);
    if (next === 'today') cal.goToday();
  };

  const visibleSessions =
    view === 'month'
      ? source.sessions
          .filter((s) => {
            const date = new Date(s.startsAt);
            return (
              date.getMonth() === cal.selected.getMonth() &&
              date.getFullYear() === cal.selected.getFullYear()
            );
          })
          .sort(
            (a, b) =>
              new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
          )
      : cal.daySessions;

  const hasOpenSession = visibleSessions.some((s) => s.status === 'open');
  const viewLabel =
    view === 'today' ? 'Hari Ini' : view === 'month' ? 'Bulan Ini' : 'Terpilih';

  const attendanceLabel = (session: Session) => {
    if (!isAssistant) return undefined;
    const present = assistant.getAttendanceForSession(session.id).length;
    const participants =
      session.participantIds ??
      assistant.getClassById(session.classId ?? '')?.participantIds ??
      [];
    return `Hadir ${present}/${participants.length}`;
  };

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
    showFeedback(
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
      {/* <RootTopBar /> */}

      <BackButton onPress={() => navigation.goBack()} />

      <Header title={cal.monthYear} />

      <SegmentedControl
        options={VIEWS}
        value={view}
        onChange={changeView}
        accessibilityLabel="Mode tampilan kalender"
      />

      {view === 'week' ? (
        <WeekStrip
          days={cal.days}
          onSelect={cal.select}
          onPrev={cal.prevWeek}
          onNext={cal.nextWeek}
        />
      ) : null}
      {view === 'week' && !cal.isCurrentWeek ? (
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
          onDismiss={clearFeedback}
        />
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text
            variant="bodyStrong"
            numberOfLines={1}
            style={styles.sectionTitle}
          >
            {isAssistant
              ? `${visibleSessions.length} sesi diampu ${viewLabel}`
              : `${visibleSessions.length} Sesi Praktikum ${viewLabel}`}
          </Text>
          {hasOpenSession ? (
            <StatusBadge label="Ada sesi aktif" tone="violet" />
          ) : (
            <StatusBadge
              label={formatWeekdayDayMonth(cal.selected)}
              tone="neutral"
            />
          )}
        </View>

        {visibleSessions.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Tidak ada sesi"
            description="Belum ada sesi praktikum pada rentang ini."
          />
        ) : (
          <View style={styles.list}>
            {visibleSessions.map((s) => (
              <TimelineCard
                key={s.id}
                session={s}
                attendanceLabel={attendanceLabel(s)}
                onPress={() => setPreview(s)}
              />
            ))}
          </View>
        )}
      </View>

      <Card variant="surface" interactive={false} style={styles.guidance}>
        <View style={styles.guidanceRow}>
          <View style={styles.guidanceIcon} importantForAccessibility="no">
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={colors.violet}
            />
          </View>
          <View style={styles.guidanceBody}>
            <Text variant="bodyStrong">
              {isAssistant
                ? 'Kelola Sesi Praktikum'
                : 'Tata Tertib Presensi Lab'}
            </Text>
            <Text variant="caption" tone="muted">
              {isAssistant
                ? 'Buka sesi maksimal 15 menit sebelum jadwal dan tutup setelah selesai. QR presensi hanya berlaku saat sesi terbuka.'
                : 'Presensi praktikum hanya dapat dilakukan melalui QR code di laboratorium maksimal 15 menit setelah sesi dimulai.'}
            </Text>
          </View>
        </View>
      </Card>

      <SessionPreviewSheet
        session={preview}
        isAssistant={isAssistant}
        busy={busy}
        onClose={() => setPreview(null)}
        onDetail={openDetail}
        onOpenSession={(s) => act(s, 'open')}
        onCloseSession={(s) => act(s, 'close')}
        onQr={(s) => {
          setPreview(null);
          navigation.navigate('AssistantSessionQr', { sessionId: s.id });
        }}
        onRecap={(s) => {
          setPreview(null);
          navigation.navigate('AssistantAttendanceRoster', { sessionId: s.id });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitle: { flexShrink: 1 },
  list: { gap: spacing.sm },

  card: { padding: spacing.md },
  cardOpen: {
    borderColor: colors.lavender,
    borderWidth: 1,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.violet,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timeColumn: { minWidth: 48, gap: spacing.xs },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  dividerOpen: { backgroundColor: colors.lavender },
  cardBody: { flex: 1, gap: spacing.xs },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardTitle: { flexShrink: 1 },
  moduleChip: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  moduleChipOpen: { backgroundColor: colors.lavenderSubtle },

  guidance: { padding: spacing.md },
  guidanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  guidanceIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    backgroundColor: colors.lavenderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidanceBody: { flex: 1, gap: spacing.xs },
});
