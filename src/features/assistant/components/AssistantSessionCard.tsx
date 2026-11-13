import type { Session } from '../../../domain/types';
import { ListRow, StatusBadge, type BadgeTone } from '../../../shared/ui';
import { formatSessionDate, formatTimeRange } from '../formatters';

type AssistantSessionCardProps = {
  session: Session;
  attendeeCount: number;
  onPress: () => void;
};

export const sessionStatusLabel: Record<Session['status'], string> = {
  scheduled: 'Terjadwal',
  open: 'Terbuka',
  closed: 'Tertutup',
};

export const sessionStatusTone: Record<Session['status'], BadgeTone> = {
  scheduled: 'lavender',
  open: 'success',
  closed: 'neutral',
};

export function AssistantSessionCard({
  session,
  attendeeCount,
  onPress,
}: AssistantSessionCardProps) {
  const date = formatSessionDate(session.startsAt);
  const time = formatTimeRange(session.startsAt, session.endsAt);
  return (
    <ListRow
      title={session.courseName}
      meta={`${session.groupName} · ${date} · ${time} · ${attendeeCount} hadir`}
      accessibilityLabel={`${session.courseName}, ${session.groupName}, ${date} ${time}, status ${sessionStatusLabel[session.status]}`}
      accessibilityHint="Membuka detail sesi"
      onPress={onPress}
      trailing={
        <StatusBadge
          label={sessionStatusLabel[session.status]}
          tone={sessionStatusTone[session.status]}
        />
      }
    />
  );
}
