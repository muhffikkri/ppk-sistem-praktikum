import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../../domain/types';
import {
  Card,
  CardContent,
  CardOverline,
  colors,
  radius,
  Screen,
  StatusBadge,
  typography,
} from '../../shared/ui';
import { useAssistantSessionsViewModel } from '../../state';
import { formatSessionDate, formatTimeRange } from './formatters';
import { AssistantSessionCard } from './components/AssistantSessionCard';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantSchedule'>;

type WeekTab = 'today' | 'week' | 'swap';

const WEEK_TITLES: Record<WeekTab, string> = {
  today: 'Hari Ini',
  week: 'Minggu Ini',
  swap: 'Tukar Shift',
};

export function AssistantScheduleScreen({ navigation }: Props) {
  const { sessions, getAttendanceForSession } = useAssistantSessionsViewModel();
  const [tab, setTab] = useState<WeekTab>('today');

  const sessionsSorted = [...sessions].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
  const openSession = sessions.find((s) => s.status === 'open');
  const nextSession = sessionsSorted.find((s) => s.status === 'scheduled');

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.screenTitle}>
          Jadwal
        </Text>
        <Text style={styles.subhead}>
          Semester Ganjil 2026/2027 • Lab Terpadu FTI
        </Text>

        <View style={styles.tabBar}>
          {(['today', 'week', 'swap'] as const).map((t) => (
            <Pressable
              key={t}
              style={({ pressed }) => [
                styles.tab,
                tab === t && styles.tabActive,
                pressed && styles.tabPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: tab === t }}
              onPress={() => setTab(t)}
            >
              <Text
                style={[styles.tabLabel, tab === t && styles.tabLabelActive]}
                accessibilityElementsHidden
              >
                {WEEK_TITLES[t]}
              </Text>
              {tab === t && <View style={styles.tabDot} />}
            </Pressable>
          ))}
        </View>

        {openSession && (
          <View style={styles.hero}>
            <Card variant="heroViolet" interactive={false}>
              <CardContent>
                <View style={styles.heroTop}>
                  <View style={styles.heroBadge}>
                    <StatusBadge label="Siap Clock-in" tone="success" />
                  </View>
                  <Text style={styles.heroLocation}>
                    {openSession.groupName}
                  </Text>
                </View>
                <Text style={styles.heroTime}>
                  {formatTimeRange(openSession.startsAt, openSession.endsAt)}
                  <Text style={styles.heroTimeUnit}> WIB</Text>
                </Text>
                <Text style={styles.heroCourse}>{openSession.courseName}</Text>
                <Text style={styles.heroMeta}>
                  {formatSessionDate(openSession.startsAt)} •{' '}
                  {openSession.groupName}
                </Text>
              </CardContent>
            </Card>
          </View>
        )}

        {nextSession && (
          <View style={styles.panel}>
            <Card variant="panel" interactive={false}>
              <CardContent>
                <CardOverline>BERIKUTNYA</CardOverline>
                <Text style={styles.panelTitle}>{nextSession.courseName}</Text>
                <Text style={styles.panelMeta}>
                  {formatTimeRange(nextSession.startsAt, nextSession.endsAt)} •{' '}
                  {formatSessionDate(nextSession.startsAt)}
                </Text>
              </CardContent>
            </Card>
          </View>
        )}

        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Semua Sesi ({sessionsSorted.length})
        </Text>
        <View style={styles.section}>
          {sessionsSorted.map((session) => (
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
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 16, gap: 12 },
  screenTitle: { ...typography.title, color: colors.ink },
  subhead: {
    ...typography.label,
    color: colors.inkMuted,
    marginTop: -8,
    marginBottom: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.panel,
    borderRadius: radius.full,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.full,
  },
  tabActive: {
    backgroundColor: colors.surface,
    shadowColor: colors.ink,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  tabPressed: { opacity: 0.75 },
  tabLabel: { ...typography.label, color: colors.inkMuted },
  tabLabelActive: { color: colors.ink, fontWeight: '700' },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.violet,
  },
  hero: { marginTop: 4 },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  heroBadge: { alignSelf: 'flex-start' },
  heroLocation: {
    ...typography.label,
    color: colors.onPrimary,
    opacity: 0.85,
    textAlign: 'right',
  },
  heroTime: { ...typography.display, color: colors.onPrimary },
  heroTimeUnit: {
    ...typography.label,
    color: colors.onPrimary,
    opacity: 0.7,
  },
  heroCourse: {
    ...typography.subtitle,
    color: colors.onPrimary,
    marginTop: 4,
    letterSpacing: 0,
  },
  heroMeta: {
    ...typography.caption,
    color: colors.onPrimary,
    opacity: 0.75,
    marginTop: 4,
  },
  panel: { marginTop: 4 },
  panelTitle: { ...typography.title, color: colors.ink },
  panelMeta: { ...typography.label, color: colors.inkMuted, marginTop: 4 },
  sectionTitle: { ...typography.overline, color: colors.inkMuted },
  section: { gap: 12 },
});
