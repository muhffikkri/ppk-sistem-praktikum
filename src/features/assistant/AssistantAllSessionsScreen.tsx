import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';

import type { RootStackParamList } from '../../app/navigation';
import type { Session } from '../../domain/types';
import {
  BackButton,
  EmptyState,
  ScreenList,
  SegmentedControl,
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
    <ScreenList
      data={visible}
      keyExtractor={(session) => session.id}
      header={
        <>
          <BackButton onPress={() => navigation.goBack()} />
          <SegmentedControl
            options={FILTERS}
            value={filter}
            onChange={setFilter}
          />
        </>
      }
      empty={
        <EmptyState
          icon="calendar-outline"
          title="Tidak ada sesi"
          description="Belum ada sesi dengan status ini."
        />
      }
      renderItem={({ item: session }) => (
        <AssistantSessionCard
          session={session}
          attendeeCount={getAttendanceForSession(session.id).length}
          onPress={() =>
            navigation.navigate('AssistantSessionDetail', {
              sessionId: session.id,
            })
          }
        />
      )}
    />
  );
}
