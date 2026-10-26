import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AttendanceRecord, Session } from '../domain/types';
import type { RootStackParamList } from './navigation';
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
} from '../shared/ui';
import { useAssistantSessionsViewModel, usePov } from '../state';
import { formatClock, formatSessionDate, formatTimeRange } from './formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const WEEKDAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

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
  return { total, present, late };
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const second = parts[parts.length - 1]?.[0] ?? '';
  return `${first}${second}`.toUpperCase();
}

export function HomeScreen({ navigation }: Props) {
  const { pov, setPov } = usePov();

  const { sessions, getAttendanceForSession, closeSession } =
    useAssistantSessionsViewModel();

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

  const dayIndex = active ? (new Date(active.startsAt).getDay() + 6) % 7 : 0;

  return (
    <Screen>
      {/* Greeting + POV switch */}
      <View style={styles.greetingRow}>
        <View style={styles.greetingText}>
          <CardOverline>
            {pov === 'asisten' ? 'Mode Asisten' : 'Mode Praktikan'}
          </CardOverline>
          <Text style={styles.greetingTitle}>
            Selamat Datang, {pov === 'asisten' ? 'Kak Naufal' : 'Saburo'}
          </Text>
        </View>
        <StatusBadge
          label={pov === 'asisten' ? 'Asisten' : 'Praktikan'}
          tone={pov === 'asisten' ? 'violet' : 'success'}
          dot
          live={pov === 'asisten'}
        />
      </View>

      {/* POV segmented switch */}
      <View style={styles.povBar}>
        {(['praktikan', 'asisten'] as const).map((role) => (
          <Pressable
            key={role}
            accessibilityRole="button"
            accessibilityState={{ selected: pov === role }}
            onPress={() => setPov(role)}
            style={({ pressed }) => [
              styles.povItem,
              pov === role && styles.povItemActive,
              pressed && styles.povItemPressed,
            ]}
          >
            <Text
              style={[styles.povLabel, pov === role && styles.povLabelActive]}
              accessibilityElementsHidden
            >
              {role === 'praktikan' ? 'Praktikan' : 'Asisten'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Day strip */}
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
                {index + 16}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {active ? (
        <>
          {/* Tukar shift banner */}
          <Banner
            title="Tukar Shift Masuk"
            message="Kak Naufal · Kamis 19 ↔ Jumat 20"
            tone="warning"
            action={
              <View style={styles.swapActionWrap}>
                <Button label="Tinjau" variant="soft" />
              </View>
            }
          />

          {/* Hero active session */}
          <Card variant="heroViolet" interactive={false}>
            <CardContent>
              <View style={styles.heroTopRow}>
                <View style={styles.heroBadges}>
                  <StatusBadge
                    label="Shift Pagi · Utama"
                    tone="violet"
                    dot
                    live
                  />
                </View>
                <Text style={styles.heroLocation}>Lab 3.2 RPL</Text>
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

              {/* Metadata inset */}
              <View style={styles.metaInset}>
                <View style={styles.metaInsetLeft}>
                  <View style={styles.metaAvatar}>
                    <Text style={styles.metaAvatarText} accessible={false}>
                      PW
                    </Text>
                  </View>
                  <View style={styles.metaInsetText}>
                    <Text style={styles.metaName}>Dr. Putu Wirawan, M.T.</Text>
                    <Text style={styles.metaCaption}>Dosen Pengampu Sesi</Text>
                  </View>
                </View>
                <View style={styles.metaRight}>
                  <Text style={styles.metaValue}>
                    {Math.max(records.length, 38)}
                  </Text>
                  <Text style={styles.metaCaption}>Praktikan</Text>
                </View>
              </View>

              {/* Clock-in CTA */}
              <View style={styles.heroActions}>
                <View style={styles.heroPrimaryWrap}>
                  <Button
                    label="Clock In / Mulai Sesi"
                    variant="accent"
                    leadingIcon="✓"
                    accessibilityHint="Presensi masuk"
                  />
                </View>
                <View style={styles.heroSecondaryWrap}>
                  <Button label="Tukar" variant="soft" iconOnly />
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Beacon banner */}
          <Banner
            title="Beacon Lab RPL #02"
            message="Radius 5.4m · On-site validasi aktif"
            tone="success"
          />

          {/* Metrics */}
          <View style={styles.metricsGrid}>
            <Card variant="panel" interactive={false}>
              <CardContent>
                <View style={styles.metricTop}>
                  <Text style={styles.metricLabel}>Hadir</Text>
                  <View
                    style={[styles.metricDot, { backgroundColor: colors.lime }]}
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
                    style={[styles.metricDot, { backgroundColor: colors.pink }]}
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
                  0<Text style={styles.metricSub}> dok</Text>
                </Text>
              </CardContent>
            </Card>
          </View>

          {/* Live roster */}
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
                <Text style={styles.seeAll}>Lihat Semua ({metrics.total})</Text>
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

          {/* Quick tools */}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  greetingText: { gap: 4 },
  greetingTitle: { ...typography.title, color: colors.ink },

  povBar: {
    flexDirection: 'row',
    backgroundColor: colors.panel,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 4,
  },
  povItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  povItemActive: { backgroundColor: colors.ink },
  povItemPressed: { opacity: 0.85 },
  povLabel: { ...typography.label, color: colors.inkMuted, fontWeight: '600' },
  povLabelActive: { color: colors.onPrimary },

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
    gap: 3,
    paddingVertical: 8,
    borderRadius: radius['2xl'],
  },
  dayItemActive: { backgroundColor: colors.ink },
  dayLabel: { ...typography.caption, color: colors.inkMuted, fontSize: 9 },
  dayLabelActive: { color: 'rgba(255,255,255,0.6)' },
  dayNumber: { ...typography.label, color: colors.ink, fontSize: 12 },
  dayNumberActive: { color: colors.lime },

  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  heroBadges: { flexDirection: 'row', gap: 6 },
  heroLocation: {
    ...typography.caption,
    color: colors.onPrimary,
    opacity: 0.8,
  },
  heroTime: {
    ...typography.displayHero,
    color: colors.onPrimary,
    fontSize: 28,
  },
  heroTimeUnit: {
    ...typography.label,
    color: colors.onPrimary,
    opacity: 0.7,
  },
  heroTitle: { ...typography.subtitle, color: colors.onPrimary },
  heroMeta: {
    ...typography.caption,
    color: colors.onPrimary,
    opacity: 0.75,
  },

  metaInset: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius['2xl'],
    padding: 10,
    marginTop: 4,
  },
  metaInsetLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaInsetText: { gap: 1 },
  metaAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaAvatarText: {
    ...typography.label,
    color: colors.onPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  metaName: {
    ...typography.label,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  metaCaption: {
    ...typography.caption,
    color: colors.onPrimary,
    opacity: 0.7,
  },
  metaRight: { alignItems: 'flex-end', gap: 1 },
  metaValue: {
    ...typography.title,
    color: colors.onPrimary,
    fontSize: 20,
  },

  heroActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  heroPrimaryWrap: { flex: 1 },
  heroSecondaryWrap: { flexShrink: 0 },

  metricsGrid: { flexDirection: 'row', gap: 8 },
  metricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: { ...typography.caption, color: colors.inkMuted },
  metricDot: { width: 8, height: 8, borderRadius: 4 },
  metricValue: { ...typography.title, color: colors.ink, fontSize: 20 },
  metricSub: { ...typography.caption, color: colors.inkMuted },

  sectionBlock: { gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: {
    ...typography.label,
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  seeAll: { ...typography.label, color: colors.violet },
  emptyText: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'center',
  },

  rosterList: { gap: 8 },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lavenderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.label, color: colors.violet, fontWeight: '700' },
  rosterText: { flex: 1, gap: 2 },
  rosterName: { ...typography.bodyStrong, color: colors.ink },
  rosterMeta: { ...typography.caption, color: colors.inkMuted },
  rosterTrailing: { alignItems: 'flex-end', gap: 3 },
  rosterNote: { ...typography.caption, color: colors.inkMuted },

  toolsGrid: { flexDirection: 'row', gap: 8 },
  swapActionWrap: { minWidth: 72, alignItems: 'center' },
  toolIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  toolIconText: { fontSize: 16, color: colors.violet },
  toolLabel: { ...typography.label, color: colors.ink, fontWeight: '600' },
  toolCaption: { ...typography.caption, color: colors.inkMuted },
});
