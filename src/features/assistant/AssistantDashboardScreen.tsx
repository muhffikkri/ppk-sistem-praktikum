import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AttendanceRecord, Session } from '../../domain/types';
import type { RootStackParamList } from '../../app/navigation';
import {
  Banner,
  Button,
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
import { formatClock, formatSessionDate, formatTimeRange } from './formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantDashboard'>;

const WEEKDAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'];
const GREETING = 'Kak Naufal';

/**
 * Turunkan metrik kehadiran dari record yang ada.
 * (Demo: semua record dianggap hadir tepat waktu kecuali yang
 * masuk lebih dari 15 menit setelah sesi dibuka.)
 */
function deriveMetrics(
  session: Session | undefined,
  records: AttendanceRecord[],
) {
  const total = records.length;
  const lateThresholdMs = 15 * 60 * 1000;
  let late = 0;
  if (session?.openedAt) {
    const opened = new Date(session.openedAt).getTime();
    late = records.filter(
      (r) => new Date(r.checkedInAt).getTime() - opened > lateThresholdMs,
    ).length;
  }
  const present = total - late;
  return { total, present, late, sick: 0 };
}

export function AssistantDashboardScreen({ navigation }: Props) {
  const { sessions, getAttendanceForSession, closeSession } =
    useAssistantSessionsViewModel();

  // Sesi aktif = sesi pertama berstatus "open". Fallback ke sesi terjadwal.
  const active =
    sessions.find((s) => s.status === 'open') ??
    sessions.find((s) => s.status === 'scheduled');
  const records = active ? getAttendanceForSession(active.id).slice() : [];
  const sorted = records
    .sort(
      (a, b) =>
        new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime(),
    )
    .slice(0, 5);
  const metrics = deriveMetrics(active, records);

  const dayIndex = active
    ? (new Date(active.startsAt).getDay() + 6) % 7 // Sen=0
    : 0;

  return (
    <Screen>
      <>
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingText}>
            <CardOverline>Lab RPL · Shift Pagi</CardOverline>
            <Text style={styles.greetingTitle}>Selamat Pagi, {GREETING}</Text>
          </View>
        </View>

        {/* Day selector */}
        <View style={styles.dayStrip} accessibilityRole="list">
          {WEEKDAY_LABELS.map((label, index) => {
            const isActive = active ? index === dayIndex : false;
            return (
              <Pressable
                key={label}
                accessibilityRole="listitem"
                accessibilityState={{ selected: isActive }}
                style={[styles.dayItem, isActive && styles.dayItemActive]}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    isActive ? styles.dayLabelActive : undefined,
                  ]}
                >
                  {label.toUpperCase()}
                </Text>
                <Text
                  style={[
                    styles.dayNumber,
                    isActive ? styles.dayNumberActive : undefined,
                  ]}
                >
                  {index + 18}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {active ? (
          <>
            {/* Hero active session */}
            <Card variant="heroViolet">
              <CardContent>
                <View style={styles.heroTopRow}>
                  <StatusBadge label="Sesi Aktif" tone="violet" dot live />
                  <Text style={styles.heroLocation}>Lab 3.2 Gedung B</Text>
                </View>

                <Text style={styles.heroTime}>
                  {formatTimeRange(active.startsAt, active.endsAt)}
                  <Text style={styles.heroTimeUnit}> WIB</Text>
                </Text>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {active.courseName}
                </Text>
                <Text style={styles.heroMeta}>
                  {formatSessionDate(active.startsAt)} · {active.groupName}
                </Text>

                <View style={styles.heroActions}>
                  <Button
                    label="Buka Scanner QR Presensi"
                    variant="accent"
                    leadingIcon="◈"
                    accessibilityHint="Presensi masuk praktikan"
                  />
                  <View style={styles.heroSecondaryRow}>
                    <View style={styles.heroGhostWrap}>
                      <Button label="Input NIM" variant="soft" />
                    </View>
                    <View style={styles.heroGhostWrap}>
                      <Button label="Tukar Shift" variant="soft" />
                    </View>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* Geofence / beacon banner */}
            <Banner
              title="Beacon Lab RPL #02"
              message="Radius 5.4m • On-site validasi aktif"
              tone="success"
            />

            {/* Metrics grid */}
            <View style={styles.metricsGrid}>
              <Card variant="panel" interactive={false}>
                <CardContent>
                  <View style={styles.metricTop}>
                    <Text style={styles.metricLabel}>Hadir</Text>
                    <View
                      style={[
                        styles.metricDot,
                        { backgroundColor: colors.lime },
                      ]}
                    />
                  </View>
                  <Text style={styles.metricValue}>
                    {metrics.present}
                    <Text style={styles.metricSub}>
                      /{Math.max(metrics.total, 40)}
                    </Text>
                  </Text>
                </CardContent>
              </Card>

              <Card variant="panel" interactive={false}>
                <CardContent>
                  <View style={styles.metricTop}>
                    <Text style={styles.metricLabel}>Telat</Text>
                    <View
                      style={[
                        styles.metricDot,
                        { backgroundColor: colors.pink },
                      ]}
                    />
                  </View>
                  <Text style={[styles.metricValue, { color: colors.violet }]}>
                    {metrics.late}
                    <Text style={styles.metricSub}> mhs</Text>
                  </Text>
                </CardContent>
              </Card>

              <Card variant="panel" interactive={false}>
                <CardContent>
                  <View style={styles.metricTop}>
                    <Text style={styles.metricLabel}>Izin/Sakit</Text>
                    <View
                      style={[
                        styles.metricDot,
                        { backgroundColor: colors.violet },
                      ]}
                    />
                  </View>
                  <Text style={[styles.metricValue, { color: colors.violet }]}>
                    {metrics.sick}
                    <Text style={styles.metricSub}> dok</Text>
                  </Text>
                </CardContent>
              </Card>
            </View>

            {/* Live attendance stream */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Text style={styles.sectionTitle}>Presensi Terkini</Text>
                  <StatusBadge label="Live" tone="violet" dot live />
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Lihat semua ${metrics.total}`}
                  onPress={() =>
                    navigation.navigate('AssistantAttendanceRoster', {
                      sessionId: active.id,
                    })
                  }
                >
                  <Text style={styles.seeAll}>
                    Lihat Semua ({metrics.total})
                  </Text>
                </Pressable>
              </View>

              {sorted.length === 0 ? (
                <Card variant="surface" interactive={false}>
                  <CardContent>
                    <Text style={styles.emptyText}>
                      Belum ada presensi tercatat pada sesi ini.
                    </Text>
                  </CardContent>
                </Card>
              ) : (
                <View style={styles.rosterList}>
                  {sorted.map((record) => (
                    <Card key={record.id} variant="panel" interactive={false}>
                      <View style={styles.rosterRow}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {initialsOf(record.studentName)}
                          </Text>
                        </View>
                        <View style={styles.rosterText}>
                          <Text style={styles.rosterName} numberOfLines={1}>
                            {record.studentName}
                          </Text>
                          <Text style={styles.rosterMeta}>
                            NIM {record.studentId} · Meja B
                          </Text>
                        </View>
                        <View style={styles.rosterTrailing}>
                          <StatusBadge
                            label={`${formatClock(record.checkedInAt)} · Hadir`}
                            tone="lime"
                          />
                          <Text style={styles.rosterNote}>QR Verified</Text>
                        </View>
                      </View>
                    </Card>
                  ))}
                </View>
              )}
            </View>

            {/* Quick shift tools */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                Manajemen Sesi Lab
              </Text>
              <View style={styles.toolsGrid}>
                <Card variant="panel" interactive={false}>
                  <CardContent>
                    <View
                      style={[
                        styles.toolIcon,
                        { backgroundColor: colors.lavenderSubtle },
                      ]}
                      accessibilityElementsHidden
                    >
                      <Text style={styles.toolIconText} accessible={false}>
                        ≡
                      </Text>
                    </View>
                    <Text style={styles.toolLabel}>Berita Acara (BAP)</Text>
                    <Text style={styles.toolCaption}>Generate & TTD Dosen</Text>
                  </CardContent>
                </Card>
                <Card
                  variant="panel"
                  onPress={
                    active.status === 'open'
                      ? () => closeSession(active.id)
                      : undefined
                  }
                >
                  <CardContent>
                    <View
                      style={[
                        styles.toolIcon,
                        { backgroundColor: colors.lavender },
                      ]}
                      accessibilityElementsHidden
                    >
                      <Text style={styles.toolIconText} accessible={false}>
                        ⏻
                      </Text>
                    </View>
                    <Text style={styles.toolLabel}>Kunci Presensi</Text>
                    <Text style={styles.toolCaption}>
                      Tutup sesi pukul {formatClock(active.endsAt)}
                    </Text>
                  </CardContent>
                </Card>
              </View>
            </View>
          </>
        ) : (
          <Card variant="surface" interactive={false}>
            <CardContent>
              <Text style={styles.emptyText}>
                Tidak ada sesi yang sedang berjalan.
              </Text>
            </CardContent>
          </Card>
        )}
      </>
    </Screen>
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const second = parts[parts.length - 1]?.[0] ?? '';
  return `${first}${second}`.toUpperCase();
}

const styles = StyleSheet.create({
  // Greeting
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingText: { gap: 4 },
  greetingTitle: { ...typography.title, color: colors.ink },

  // Day selector
  dayStrip: {
    flexDirection: 'row',
    backgroundColor: colors.panel,
    borderRadius: radius['3xl'],
    padding: 6,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  dayItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: radius['2xl'],
  },
  dayItemActive: { backgroundColor: colors.ink },
  dayLabel: { ...typography.caption, color: colors.inkMuted },
  dayLabelActive: { color: 'rgba(255,255,255,0.7)' },
  dayNumber: { ...typography.label, color: colors.ink },
  dayNumberActive: { color: colors.lime },

  // Hero
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heroLocation: { ...typography.caption, color: 'rgba(255,255,255,0.8)' },
  heroTime: {
    ...typography.displayHero,
    color: colors.panel,
    fontSize: 30,
  },
  heroTimeUnit: { ...typography.label, color: 'rgba(255,255,255,0.7)' },
  heroTitle: {
    ...typography.title,
    color: colors.panel,
    fontSize: 20,
  },
  heroMeta: { ...typography.caption, color: 'rgba(255,255,255,0.75)' },
  heroActions: { gap: 8, marginTop: 4 },
  heroSecondaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroGhostWrap: { flex: 1 },

  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: { ...typography.caption, color: colors.inkMuted },
  metricDot: { width: 8, height: 8, borderRadius: 4 },
  metricValue: { ...typography.title, color: colors.ink, fontSize: 22 },
  metricSub: { ...typography.caption, color: colors.inkMuted },

  // Section blocks
  sectionBlock: { gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  seeAll: { ...typography.label, color: colors.violet },
  emptyText: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'center',
  },

  // Roster rows
  rosterList: { gap: 8 },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lavenderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.label, color: colors.violet, fontWeight: '700' },
  rosterText: { flex: 1, gap: 2 },
  rosterName: { ...typography.bodyStrong, color: colors.ink },
  rosterMeta: { ...typography.caption, color: colors.inkMuted },
  rosterTrailing: {
    alignItems: 'flex-end',
    gap: 4,
  },
  rosterNote: { ...typography.caption, color: colors.inkMuted },

  // Quick tools
  toolsGrid: { flexDirection: 'row', gap: 8 },
  toolIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  toolIconText: { fontSize: 18, color: colors.violet },
  toolLabel: { ...typography.label, color: colors.ink, fontWeight: '600' },
  toolCaption: { ...typography.caption, color: colors.inkMuted },
});
