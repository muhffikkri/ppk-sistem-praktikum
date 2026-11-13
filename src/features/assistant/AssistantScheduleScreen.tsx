import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import type { Session } from '../../domain/types';
import {
  Button,
  EmptyState,
  ErrorState,
  Header,
  LoadingState,
  Screen,
  SectionHeader,
  spacing,
} from '../../shared/ui';
import { useAssistantSessionsViewModel } from '../../state';
import { AssistantSessionCard } from './components/AssistantSessionCard';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantSchedule'>;

const SECTIONS: { status: Session['status']; title: string }[] = [
  { status: 'open', title: 'Sedang dibuka' },
  { status: 'scheduled', title: 'Terjadwal' },
  { status: 'closed', title: 'Selesai' },
];

export function AssistantScheduleScreen({ navigation }: Props) {
  const { sessions, getAttendanceForSession, loading, error, retry } =
    useAssistantSessionsViewModel();

  if (loading) {
    return (
      <Screen>
        <LoadingState label="Memuat jadwal…" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState
          title="Gagal memuat jadwal"
          message={error}
          onRetry={retry}
        />
      </Screen>
    );
  }

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  return (
    <Screen>
      <Header
        title="Jadwal"
        accent="sesi"
        description={`${sessions.length} sesi praktikum`}
      />

      <View style={styles.actions}>
        <Button
          label="Buat sesi"
          icon="add"
          onPress={() => navigation.navigate('AssistantSessionForm', {})}
        />
        <Button
          label="Kelola kelas"
          variant="outline"
          icon="people-outline"
          onPress={() => navigation.navigate('AssistantClassList')}
        />
        <Button
          label="Lihat kalender"
          variant="soft"
          icon="calendar-outline"
          onPress={() => navigation.navigate('Calendar')}
        />
      </View>

      {sorted.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="Belum ada sesi"
          description="Buat sesi pertama untuk kelas praktikum Anda."
        />
      ) : (
        SECTIONS.map(({ status, title }) => {
          const items = sorted.filter((s) => s.status === status);
          if (items.length === 0) return null;
          return (
            <View key={status} style={styles.section}>
              <SectionHeader title={`${title} · ${items.length}`} />
              {items.map((session) => (
                <AssistantSessionCard
                  key={session.id}
                  session={session}
                  attendeeCount={getAttendanceForSession(session.id).length}
                  onPress={() =>
                    navigation.navigate('AssistantSessionDetail', {
                      sessionId: session.id,
                    })
                  }
                />
              ))}
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm },
  section: { gap: spacing.sm },
});
