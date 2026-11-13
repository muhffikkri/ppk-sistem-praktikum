import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import type { Session } from '../../domain/types';
import {
  EmptyState,
  Header,
  Screen,
  SegmentedControl,
  spacing,
} from '../../shared/ui';
import { useAssistantSessionsViewModel } from '../../state';
import { AssistantSessionCard } from './components/AssistantSessionCard';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantAllSessions'>;

type Filter = 'all' | Session['status'];

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'open', label: 'Terbuka' },
  { value: 'scheduled', label: 'Terjadwal' },
  { value: 'closed', label: 'Tertutup' },
];

export function AssistantAllSessionsScreen({ navigation }: Props) {
  const { sessions, getAttendanceForSession } = useAssistantSessionsViewModel();
  const [filter, setFilter] = useState<Filter>('all');

  const visible = [...sessions]
    .filter((s) => filter === 'all' || s.status === filter)
    .sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );

  return (
    <Screen>
      <Header
        title="Semua sesi"
        description={`${sessions.length} sesi tercatat`}
      />
      <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />
      <View style={styles.list}>
        {visible.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Tidak ada sesi"
            description="Belum ada sesi dengan status ini."
          />
        ) : (
          visible.map((session) => (
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
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
});
