import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { canSubmitLeave } from '../../domain/leaveRules';
import type { Session } from '../../domain/types';
import { formatDateTime } from '../../shared/format/date';
import { Banner, SelectField, spacing } from '../../shared/ui';
import {
  leaveFailure,
  requireRole,
} from '../../services/firestore/leaveService';
import { useLeaveDependencies } from './LeaveProvider';
import { ListFeedback } from './components';

// Picker sesi untuk form izin; sumber data sesi sama dengan jadwal praktikan (Firestore).
export function StudentLeaveSessionPicker({
  onSelect,
}: {
  onSelect: (id: string) => void;
}) {
  const { user, service } = useLeaveDependencies();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    let stop: (() => void) | undefined;
    const fail = (cause: unknown) => {
      if (active) {
        setError(leaveFailure(cause).message);
        setLoading(false);
      }
    };
    try {
      requireRole(user, 'student');
      stop = service.subscribeStudentSessions(
        user,
        (items) => {
          if (active) {
            setSessions(items);
            setLoading(false);
            setError(null);
          }
        },
        fail,
      );
    } catch (cause) {
      fail(cause);
    }
    return () => {
      active = false;
      stop?.();
    };
  }, [user, service, revision]);

  // Sesi yang sudah ditutup/selesai tidak bisa diajukan izin.
  const eligible = sessions.filter((session) => canSubmitLeave(session));
  return (
    <View style={{ gap: spacing.md }}>
      <ListFeedback
        loading={loading}
        error={error}
        empty={loading && sessions.length === 0}
        retry={() => {
          setLoading(true);
          setError(null);
          setRevision((value) => value + 1);
        }}
      />
      {!loading && !error && eligible.length === 0 ? (
        <Banner
          tone="warning"
          title="Belum ada sesi yang bisa diajukan izin"
          message="Izin hanya tersedia untuk sesi yang belum selesai."
        />
      ) : null}
      {eligible.length > 0 ? (
        <SelectField<string>
          label="Sesi"
          placeholder="Pilih sesi untuk mengajukan izin"
          value={null}
          options={eligible.map((session) => ({
            value: session.id,
            label: `${session.courseName} · ${session.groupName}`,
            description: formatDateTime(new Date(session.startsAt)),
          }))}
          onChange={onSelect}
        />
      ) : null}
    </View>
  );
}
