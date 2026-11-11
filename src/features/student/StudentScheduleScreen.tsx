import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Session } from '../../domain/types';
import type { RootStackParamList } from '../../app/navigation';
import {
  Button,
  CardOverline,
  colors,
  radius,
  shadow,
  Screen,
  typography,
} from '../../shared/ui';
import { useStudentAttendanceViewModel } from '../../state';
import { formatSessionDate, formatTimeRange } from './formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentSchedule'>;

function statusLabel(status: Session['status']): string {
  switch (status) {
    case 'open':
      return 'Terbuka';
    case 'scheduled':
      return 'Terjadwal';
    case 'closed':
      return 'Tertutup';
  }
}

export function StudentScheduleScreen({ navigation }: Props) {
  const { sessions, getAttendanceForSession, currentStudent } =
    useStudentAttendanceViewModel();

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  return (
    <Screen>
      {/* Praktikan: clean sans, bold title — no editorial italic */}
      <View style={styles.headerBlock}>
        <Text style={styles.eyebrow}>MODE PRAKTIKAN · JADWAL</Text>
        <Text style={styles.pageTitle}>Jadwal</Text>
        <Text style={styles.pageSub}>
          Semester Ganjil 2026/2027 • {currentStudent.displayName}
        </Text>
      </View>

      <CardOverline>
        <Text>KELAS KAMU</Text>
      </CardOverline>
      <View style={styles.heroBlock}>
        <Text style={styles.heroTitle}>Kelas 3SE1 — Kelompok Praktikan</Text>
        <Text style={styles.heroMeta}>
          {sorted.length} sesi praktikum minggu ini
        </Text>
        <View style={styles.heroActions}>
          <View style={styles.heroPrimaryWrap}>
            <Button
              label="Lihat Kalender"
              variant="accent"
              icon="calendar"
              onPress={() => navigation.navigate('Calendar')}
              accessibilityHint="Membuka halaman kalender semua jadwal"
            />
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Semua Sesi ({sorted.length})</Text>

      <View style={styles.list}>
        {sorted.map((session, index) => {
          const record = getAttendanceForSession(session.id);
          return (
            <Pressable
              key={session.id}
              accessibilityRole="button"
              accessibilityLabel={`${session.courseName}, ${formatSessionDate(session.startsAt)}, status ${statusLabel(session.status)}`}
              accessibilityHint="Membuka detail sesi"
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
                    session.status === 'open' && styles.statusOpen,
                    session.status === 'scheduled' && styles.statusScheduled,
                    session.status === 'closed' && styles.statusClosed,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      session.status === 'open' && styles.statusTextOpen,
                      session.status === 'scheduled' &&
                        styles.statusTextScheduled,
                      session.status === 'closed' && styles.statusTextClosed,
                    ]}
                  >
                    {statusLabel(session.status)}
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
                  {record ? 'Sudah presensi' : 'Belum presensi'}
                </Text>
                <Text style={styles.chevron} accessible={false}>
                  Detail ›
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Praktikan: clean sans, bold — plus Jakarta Sans 800 for titles
  headerBlock: { gap: 4 },
  eyebrow: { ...typography.overline, color: colors.violet },
  pageTitle: {
    ...typography.body,
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 32,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -1,
  },
  pageSub: { ...typography.label, color: colors.inkMuted },

  heroBlock: {
    backgroundColor: colors.violet,
    borderRadius: radius['3xl'],
    padding: 18,
    gap: 8,
    ...shadow.elevated,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  heroPrimaryWrap: { flex: 1 },
  heroTitle: {
    ...typography.subtitle,
    color: colors.panel,
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
  },
  heroMeta: {
    ...typography.label,
    color: colors.panel,
    opacity: 0.85,
  },

  sectionTitle: {
    ...typography.label,
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  list: {
    backgroundColor: colors.panel,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
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
    fontFamily: 'Plus Jakarta Sans',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusOpen: { backgroundColor: colors.violet, borderColor: colors.violet },
  statusScheduled: {
    backgroundColor: colors.lavender,
    borderColor: colors.lavender,
  },
  statusClosed: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  statusText: { ...typography.caption, fontWeight: '700' },
  statusTextOpen: { color: colors.panel },
  statusTextScheduled: { color: colors.violet },
  statusTextClosed: { color: colors.inkMuted },
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
