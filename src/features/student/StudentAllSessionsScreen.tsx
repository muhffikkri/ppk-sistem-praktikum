import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import { colors, radius, Screen, typography } from '../../shared/ui';
import { useStudentAttendanceViewModel } from '../../state';
import { formatSessionDate, formatTimeRange } from './formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentAllSessions'>;

function statusTone(status: string) {
  switch (status) {
    case 'open':
      return { label: 'Terbuka', tone: 'violet' as const, live: true };
    case 'scheduled':
      return { label: 'Terjadwal', tone: 'lavender' as const, live: false };
    default:
      return { label: 'Tertutup', tone: 'neutral' as const, live: false };
  }
}

export function StudentAllSessionsScreen({ navigation }: Props) {
  const { sessions, getAttendanceForSession, currentStudent } =
    useStudentAttendanceViewModel();

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  return (
    <Screen>
      {/* Praktikan header — clean sans, bold title */}
      <View style={styles.headerBlock}>
        <Text style={styles.eyebrow}>MODE PRAKTIKAN · SEMUA SESI</Text>
        <Text style={styles.pageTitle}>Semua Sesi</Text>
        <Text style={styles.pageSub}>
          {currentStudent.displayName} · {sorted.length} sesi minggu ini
        </Text>
      </View>

      <View style={styles.list}>
        {sorted.map((session, index) => {
          const record = getAttendanceForSession(session.id);
          const st = statusTone(session.status);
          return (
            <Pressable
              key={session.id}
              accessibilityRole="button"
              accessibilityLabel={`${session.courseName}, ${formatSessionDate(session.startsAt)}, ${record ? 'sudah presensi' : 'belum presensi'}`}
              onPress={() =>
                navigation.navigate('StudentSessionDetail', {
                  sessionId: session.id,
                })
              }
              style={({ pressed }) => [
                styles.card,
                index < sorted.length - 1 && styles.divider,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.cardTop}>
                <Text style={styles.course} numberOfLines={2}>
                  {session.courseName}
                </Text>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        st.tone === 'violet'
                          ? colors.violet
                          : st.tone === 'lavender'
                            ? colors.lavender
                            : colors.surface,
                      borderColor:
                        st.tone === 'violet'
                          ? colors.violet
                          : st.tone === 'lavender'
                            ? colors.lavender
                            : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          st.tone === 'violet'
                            ? colors.panel
                            : st.tone === 'lavender'
                              ? colors.violet
                              : colors.inkMuted,
                      },
                    ]}
                  >
                    {st.label}
                  </Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>
                  {formatSessionDate(session.startsAt)}
                </Text>
                <Text style={styles.meta}>
                  {formatTimeRange(session.startsAt, session.endsAt)}
                </Text>
              </View>
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  {record ? `Sudah presensi` : 'Belum presensi'}
                </Text>
                <Text style={styles.chevron}>Detail ›</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBlock: { gap: 4 },
  eyebrow: { ...typography.overline, color: colors.violet },
  pageTitle: {
    ...typography.body,
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 28,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.5,
  },
  pageSub: { ...typography.label, color: colors.inkMuted },

  list: {
    backgroundColor: colors.panel,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  card: { padding: 18, gap: 8 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  pressed: { backgroundColor: colors.lavenderSubtle },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  course: {
    flex: 1,
    flexShrink: 1,
    ...typography.bodyStrong,
    color: colors.ink,
    fontSize: 16,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusText: { ...typography.caption, fontWeight: '700' },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: 4,
  },
  meta: { ...typography.label, color: colors.inkMuted },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  footerText: { ...typography.label, color: colors.inkMuted },
  chevron: { ...typography.label, color: colors.violet, fontWeight: '600' },
});
