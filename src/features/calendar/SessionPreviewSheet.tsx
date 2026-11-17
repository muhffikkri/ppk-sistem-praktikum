import { StyleSheet, View } from 'react-native';

import type { Session } from '../../domain/types';
import { Button, ConfirmSheet, InfoRow, spacing } from '../../shared/ui';
import { formatSessionDate, formatTimeRange } from '../student/formatters';

const STATUS_LABEL: Record<Session['status'], string> = {
  open: 'Terbuka',
  scheduled: 'Terjadwal',
  closed: 'Tertutup',
};

type Props = {
  session: Session | null;
  isAssistant: boolean;
  busy: boolean;
  onClose: () => void;
  onDetail: (session: Session) => void;
  onOpenSession: (session: Session) => void;
  onCloseSession: (session: Session) => void;
};

/** Pratinjau sesi: info ringkas + aksi sesuai peran. */
export function SessionPreviewSheet({
  session,
  isAssistant,
  busy,
  onClose,
  onDetail,
  onOpenSession,
  onCloseSession,
}: Props) {
  return (
    <ConfirmSheet
      visible={session !== null}
      title={session?.courseName ?? ''}
      description={session ? formatSessionDate(session.startsAt) : undefined}
      confirmLabel="Detail sesi"
      cancelLabel="Tutup"
      loading={busy}
      onConfirm={() => session && onDetail(session)}
      onCancel={onClose}
    >
      {session ? (
        <View style={styles.info}>
          <InfoRow
            label="Waktu"
            value={formatTimeRange(session.startsAt, session.endsAt)}
          />
          <InfoRow label="Kelas" value={session.groupName} />
          <InfoRow label="Status" value={STATUS_LABEL[session.status]} />
          {session.lab ? <InfoRow label="Lokasi" value={session.lab} /> : null}
          {isAssistant && session.status === 'scheduled' ? (
            <Button
              label="Buka sesi"
              variant="primary"
              onPress={() => onOpenSession(session)}
            />
          ) : null}
          {isAssistant && session.status === 'open' ? (
            <Button
              label="Tutup sesi"
              variant="destructive"
              onPress={() => onCloseSession(session)}
            />
          ) : null}
        </View>
      ) : null}
    </ConfirmSheet>
  );
}

const styles = StyleSheet.create({
  info: { gap: spacing.sm },
});
