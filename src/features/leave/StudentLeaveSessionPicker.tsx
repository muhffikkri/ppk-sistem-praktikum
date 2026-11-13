import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import type { Session } from '../../domain/types';
import { Button, EmptyState } from '../../shared/ui';
import {
  leaveFailure,
  requireRole,
} from '../../services/firestore/leaveService';
import { useLeaveDependencies } from './LeaveProvider';
import { ListFeedback, styles } from './components';

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
  return (
    <View style={styles.group}>
      <Text style={styles.subtitle}>Pilih sesi untuk mengajukan izin</Text>
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
      {!loading && !error && sessions.length === 0 ? (
        <EmptyState
          title="Belum ada sesi terdaftar"
          description="Sesi akan tersedia setelah asisten mendaftarkan Anda sebagai peserta praktikum."
        />
      ) : null}
      {sessions.map((session) => (
        <Button
          key={session.id}
          label={`${session.courseName} · ${session.groupName} · ${new Date(session.startsAt).toLocaleString('id-ID')}`}
          variant="outline"
          onPress={() => onSelect(session.id)}
        />
      ))}
    </View>
  );
}
