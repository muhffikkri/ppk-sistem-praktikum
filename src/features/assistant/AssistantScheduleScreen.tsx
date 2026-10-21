import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList, Session, SessionStatus } from '../../domain/types';
import { EmptyState, Header, Screen, colors } from '../../shared/ui';
import { useAssistantSessionsViewModel } from '../../state';
import { AssistantSessionCard } from './components/AssistantSessionCard';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantSchedule'>;

const sectionOrder: { status: SessionStatus; title: string }[] = [
  { status: 'open', title: 'Sedang terbuka' },
  { status: 'scheduled', title: 'Terjadwal' },
  { status: 'closed', title: 'Sudah ditutup' },
];

function byStartTime(a: Session, b: Session) {
  return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
}

export function AssistantScheduleScreen({ navigation }: Props) {
  const { sessions, getAttendanceForSession } = useAssistantSessionsViewModel();

  const sections = sectionOrder
    .map((section) => ({
      ...section,
      sessions: sessions.filter((s) => s.status === section.status).sort(byStartTime),
    }))
    .filter((section) => section.sessions.length > 0);

  return (
    <Screen>
      <Header
        eyebrow="MODE ASISTEN"
        title="Jadwal praktikum"
        description="Pilih sesi untuk membuka, menutup, atau melihat rekap kehadiran."
      />

      {sections.length === 0 ? (
        <EmptyState
          title="Belum ada jadwal"
          description="Tidak ada sesi praktikum pada data demo asisten."
        />
      ) : (
        sections.map((section) => (
          <View key={section.status} style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              {section.title} ({section.sessions.length})
            </Text>
            {section.sessions.map((session) => (
              <AssistantSessionCard
                key={session.id}
                session={session}
                attendeeCount={getAttendanceForSession(session.id).length}
                onPress={() => navigation.navigate('AssistantSessionDetail', { sessionId: session.id })}
              />
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5, color: colors.muted },
});
