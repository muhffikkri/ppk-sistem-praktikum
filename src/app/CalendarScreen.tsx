import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Session } from '../domain/types';
import type { RootStackParamList } from './navigation';
import {
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
import {
  useAssistantSessionsViewModel,
  usePov,
  useStudentAttendanceViewModel,
} from '../state';

type Props = NativeStackScreenProps<RootStackParamList, 'Calendar'>;

const DAY_START = 7; // 07:00
const DAY_END = 18; // hingga 18:00
const PX_PER_HOUR = 56;

type ViewMode = 'day' | 'week';

const WEEKDAY_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const WEEKDAY_FULL = [
  'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu',
];
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];
const MONTHS_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function startOfWeekLocal(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (d.getDay() + 6) % 7; // Senin = 0
  d.setDate(d.getDate() - offset);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isWeekend(date: Date): boolean {
  return date.getDay() === 6; // Sabtu
}

function weekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function sessionMinutes(session: Session): { day: Date; startMin: number; endMin: number } {
  const start = new Date(session.startsAt);
  const end = new Date(session.endsAt);
  const startMin = start.getHours() * 60 + start.getMinutes();
  const endMin = end.getHours() * 60 + end.getMinutes();
  return { day: start, startMin, endMin };
}

function weekLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  const w = weekNumber(monday);
  return `Minggu ${w} · ${monday.getDate()} ${MONTHS_SHORT[monday.getMonth()]} – ${sunday.getDate()} ${MONTHS_SHORT[sunday.getMonth()]} ${sunday.getFullYear()}`;
}

/**
 * Kalender interaktif (grid hari × jam, gaya Google Calendar) — dipakai
 * kedua role. Praktikan: tanpa tombol clock-in; asisten: pill "Presensi"
 * di event open + tombol aksi di drawer. Tap event membuka bottom sheet.
 */
export function CalendarScreen({ navigation }: Props) {
  const { pov } = usePov();
  const { sessions: assistantSessions } = useAssistantSessionsViewModel();
  const { sessions: studentSessions } = useStudentAttendanceViewModel();

  const isAsisten = pov === 'asisten';
  const sessions = isAsisten ? assistantSessions : studentSessions;

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [weekStart, setWeekStart] = useState(() => startOfWeekLocal(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [drawerSession, setDrawerSession] = useState<Session | null>(null);

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Sheet slide-up animation.
  const sheetY = useMemo(() => new Animated.Value(1), []);
  const sheetOpacity = useMemo(() => new Animated.Value(0), []);
  const drawerAnimating = useRef(false);

  const openDrawer = (session: Session) => {
    setDrawerSession(session);
    drawerAnimating.current = true;
    Animated.parallel([
      Animated.timing(sheetY, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = () => {
    if (!drawerAnimating.current) return;
    drawerAnimating.current = false;
    Animated.parallel([
      Animated.timing(sheetY, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setDrawerSession(null));
  };

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const hours = useMemo(
    () => Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i),
    [],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const session of sessions) {
      const { day } = sessionMinutes(session);
      const key = day.toDateString();
      map.set(key, [...(map.get(key) ?? []), session]);
    }
    return map;
  }, [sessions]);

  const weekSessions = useMemo(
    () => sessions.filter((s) => {
      const { day } = sessionMinutes(s);
      return day >= weekStart && day < addDays(weekStart, 7);
    }),
    [sessions, weekStart],
  );

  const totalHours = useMemo(
    () =>
      weekSessions.reduce(
        (sum, s) => {
          const { startMin, endMin } = sessionMinutes(s);
          return sum + (endMin - startMin) / 60;
        },
        0,
      ),
    [weekSessions],
  );

  const today = new Date();
  const shiftSessions = weekSessions.filter((s) => s.status === 'scheduled');

  const goPrev = () => setWeekStart((w) => addDays(w, -7));
  const goNext = () => setWeekStart((w) => addDays(w, 7));
  const goToday = () => {
    const t = startOfWeekLocal(new Date());
    setWeekStart(t);
    setSelectedDay(new Date());
  };

  const openSessionDetail = (session: Session) => {
    if (isAsisten) {
      navigation.navigate('AssistantSessionDetail', { sessionId: session.id });
    } else {
      navigation.navigate('StudentSessionDetail', { sessionId: session.id });
    }
  };

  const columnWidth = Math.max((width - 44 - 6 * 6 - 16) / 7, 84);

  const renderDayColumn = (day: Date) => {
    const key = day.toDateString();
    const daySessions = (byDay.get(key) ?? []).sort(
      (a, b) => sessionMinutes(a).startMin - sessionMinutes(b).startMin,
    );
    const isToday = sameDay(day, today);
    const weekend = isWeekend(day);

    return (
      <View
        key={key}
        style={[
          styles.dayColumn,
          { width: columnWidth },
          isToday && styles.dayColumnToday,
        ]}
      >
        {/* Grid lines */}
        <View style={styles.gridLines} accessibilityElementsHidden>
          {hours.map((hour) => (
            <View
              key={hour}
              style={[
                styles.gridLine,
                {
                  height: PX_PER_HOUR,
                  backgroundColor:
                    hour === 12 ? 'rgba(231,227,242,0.35)' : 'transparent',
                },
              ]}
            >
              {hour === 12 ? (
                <Text style={styles.breakLabel} numberOfLines={1}>
                  ISTIRAHAT & STERILISASI
                </Text>
              ) : null}
            </View>
          ))}
        </View>

        {/* Events */}
        {daySessions.map((session) => {
          const { startMin, endMin } = sessionMinutes(session);
          const clampedStart = Math.max(startMin, DAY_START * 60);
          const clampedEnd = Math.min(endMin, DAY_END * 60);
          if (clampedStart >= clampedEnd) {
            return null;
          }
          const top = ((clampedStart - DAY_START * 60) / 60) * PX_PER_HOUR;
          const height = Math.max(((clampedEnd - clampedStart) / 60) * PX_PER_HOUR - 4, 34);
          const startLabel = `${pad2(Math.floor(startMin / 60))}:${pad2(startMin % 60)}`;
          const endLabel = `${pad2(Math.floor(endMin / 60))}:${pad2(endMin % 60)}`;
          const open = session.status === 'open';

          return (
            <Pressable
              key={session.id}
              accessibilityRole="button"
              accessibilityLabel={`${session.courseName}, ${startLabel}-${endLabel}`}
              accessibilityHint="Membuka detail sesi"
              onPress={() => openDrawer(session)}
              style={({ pressed }) => [
                styles.event,
                { top, height },
                open ? styles.eventOpen : styles.eventPlain,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={styles.eventTop}>
                <Text style={styles.eventTime}>
                  {startLabel}-{endLabel}
                </Text>
                {open ? (
                  <View style={styles.eventDot} accessibilityElementsHidden />
                ) : null}
              </View>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {session.courseName}
              </Text>
              <Text style={styles.eventLab} numberOfLines={1}>
                {session.lab ?? session.groupName}
              </Text>
              {open && !isAsisten ? null : open ? (
                <View style={styles.eventActions}>
                  {isAsisten ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Presensi sesi ${session.courseName}`}
                      onPress={() =>
                        navigation.navigate('AssistantAttendanceRoster', {
                          sessionId: session.id,
                        })
                      }
                      style={({ pressed }) => [
                        styles.eventActionPill,
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <Ionicons name="finger-print" size={12} color={colors.ink} />
                      <Text style={styles.eventActionText}>Presensi</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.eventActiveNote}>TERBUKA</Text>
                  )}
                </View>
              ) : null}
            </Pressable>
          );
        })}

        {/* Current time line */}
        {isToday ? (
          <View
            style={[
              styles.nowLine,
              {
                top:
                  ((today.getHours() * 60 + today.getMinutes() - DAY_START * 60) /
                    60) *
                  PX_PER_HOUR,
              },
            ]}
            accessibilityElementsHidden
          >
            <View style={styles.nowDot} />
            <View style={styles.nowLineBody} />
          </View>
        ) : null}

        {daySessions.length === 0 && !weekend ? (
          <View style={styles.emptyDayMark} accessibilityElementsHidden>
            <Text style={styles.emptyDayText}>Tidak ada sesi</Text>
          </View>
        ) : null}
      </View>
    );
  };

  const drawerStatusLabel = drawerSession
    ? drawerSession.status === 'open'
      ? 'Sedang Berlangsung'
      : drawerSession.status === 'scheduled'
        ? 'Terjadwal'
        : 'Selesai'
    : '';

  const drawerBadgeLabel = drawerSession
    ? drawerSession.status === 'open'
      ? 'Shift Aktif Kamu'
      : drawerSession.status === 'scheduled'
        ? 'Shift Terjadwal'
        : 'Selesai'
    : '';

  return (
    <Screen>
      <View style={styles.headRow}>
        <View style={styles.headText}>
          <CardOverline>KALENDER &amp; JADWAL LAB</CardOverline>
          <Text style={styles.title} accessibilityRole="header">
            Kalender
          </Text>
        </View>
        <StatusBadge
          label={isAsisten ? 'Asisten' : 'Praktikan'}
          tone={isAsisten ? 'violet' : 'success'}
          dot
        />
      </View>

      {/* Week navigator + view switcher */}
      <View style={styles.navBar}>
        <View style={styles.navArrows}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Minggu sebelumnya"
            onPress={goPrev}
            style={({ pressed }) => [
              styles.navArrow,
              pressed && styles.navArrowPressed,
            ]}
          >
            <Ionicons name="chevron-back" size={18} color={colors.inkMuted} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Minggu berikutnya"
            onPress={goNext}
            style={({ pressed }) => [
              styles.navArrow,
              pressed && styles.navArrowPressed,
            ]}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
          </Pressable>
          <View style={styles.navWeekText}>
            <Text style={styles.navWeekLabel}>
              Minggu {weekNumber(weekStart)}
            </Text>
            <Text style={styles.navWeekDate}>
              {days[0].getDate()} {MONTHS_SHORT[days[0].getMonth()]} —
              {days[6].getDate()} {MONTHS_SHORT[days[6].getMonth()]}
              {days[6].getFullYear()}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kembali ke minggu ini"
            onPress={goToday}
            style={({ pressed }) => [
              styles.todayChip,
              pressed && styles.navArrowPressed,
            ]}
          >
            <Text style={styles.todayChipText}>Hari Ini</Text>
          </Pressable>
        </View>
        <View style={styles.viewSwitcher}>
          {(['day', 'week'] as const).map((mode) => (
            <Pressable
              key={mode}
              accessibilityRole="button"
              accessibilityState={{ selected: viewMode === mode }}
              onPress={() => {
                setViewMode(mode);
                if (mode === 'day') {
                  const openDay = weekSessions
                    .map((s) => sessionMinutes(s).day)
                    .find((d) => sameDay(d, new Date()));
                  if (openDay) setSelectedDay(openDay);
                }
              }}
              style={({ pressed }) => [
                styles.viewPill,
                viewMode === mode && styles.viewPillActive,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text
                style={[
                  styles.viewPillLabel,
                  viewMode === mode && styles.viewPillLabelActive,
                ]}
              >
                {mode === 'day' ? 'Hari' : 'Minggu'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* KPI strip */}
      <View style={styles.kpiGrid}>
        <Card variant="heroViolet" interactive={false} style={styles.kpiCard}>
          <CardContent>
            <View style={styles.kpiTop}>
              <Text style={styles.kpiLabel}>Jam Jaga</Text>
              <Ionicons
                name="time-outline"
                size={15}
                color={colors.lime}
                style={{ opacity: 0.9 }}
              />
            </View>
            <Text style={styles.kpiValue}>{totalHours.toFixed(1)}h</Text>
            <Text style={styles.kpiCaption}>Target 24h / minggu</Text>
          </CardContent>
        </Card>
        <Card variant="panel" interactive={false} style={styles.kpiCard}>
          <CardContent>
            <View style={styles.kpiTop}>
              <Text style={styles.kpiLabelMuted}>Sesi Lab</Text>
              <Ionicons
                name="flask-outline"
                size={15}
                color={colors.violet}
              />
            </View>
            <Text style={styles.kpiValue}>{weekSessions.length} Sesi</Text>
            <Text style={styles.kpiCaptionMuted}>Terjadwal aktif</Text>
          </CardContent>
        </Card>
        <Card variant="panel" interactive={false} style={styles.kpiCard}>
          <CardContent>
            <View style={styles.kpiTop}>
              <Text style={styles.kpiLabelMuted}>Slot Berikutnya</Text>
              <Ionicons
                name="swap-horizontal-outline"
                size={15}
                color={colors.violet}
              />
            </View>
            <Text style={styles.kpiValue}>
              {shiftSessions.length} Slot
            </Text>
            <Text style={styles.kpiCaptionMuted}>Belum dimulai</Text>
          </CardContent>
        </Card>
      </View>

      {/* Grid container */}
      <View style={styles.gridContainer}>
        {viewMode === 'week' ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekScrollContent}
          >
            <View style={styles.weekGrid}>
              {/* Header row: time gutter + day headers */}
              <View style={styles.headerRow}>
                <View style={[styles.timeGutter, styles.timeGutterHeader]}>
                  <Text style={styles.gmtLabel}>GMT+7</Text>
                </View>
                {days.map((day) => {
                  const key = day.toDateString();
                  const count = (byDay.get(key) ?? []).length;
                  const isToday = sameDay(day, today);
                  const weekend = isWeekend(day);
                  return (
                    <Pressable
                      key={key}
                      accessibilityRole="button"
                      accessibilityLabel={`Lihat ${WEEKDAY_FULL[(day.getDay() + 6) % 7]}, ${day.getDate()} ${MONTHS_FULL[day.getMonth()]}`}
                      onPress={() => {
                        setViewMode('day');
                        setSelectedDay(day);
                      }}
                      style={({ pressed }) => [
                        styles.dayHeader,
                        isToday && styles.dayHeaderToday,
                        weekend && styles.dayHeaderWeekend,
                        pressed && { opacity: 0.85 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayHeaderLabel,
                          isToday && styles.dayHeaderLabelToday,
                        ]}
                      >
                        {WEEKDAY_SHORT[(day.getDay() + 6) % 7]}
                      </Text>
                      <Text
                        style={[
                          styles.dayHeaderNumber,
                          isToday && styles.dayHeaderNumberToday,
                        ]}
                      >
                        {day.getDate()}
                      </Text>
                      <Text
                        style={[
                          styles.dayHeaderCount,
                          isToday && styles.dayHeaderCountToday,
                        ]}
                        numberOfLines={1}
                      >
                        {weekend
                          ? 'Off'
                          : count > 0
                            ? `${count} Sesi`
                            : 'Kosong'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Time gutter + columns (horizontally aligned) */}
              <View style={styles.bodyRow}>
                <View style={styles.timeGutter}>
                  {hours.map((hour) => (
                    <View
                      key={hour}
                      style={[
                        styles.timeCell,
                        { height: PX_PER_HOUR },
                        hour === 12 && styles.timeCellBreak,
                      ]}
                    >
                      <Text
                        style={[
                          styles.timeLabel,
                          hour === 12 && styles.timeLabelMuted,
                        ]}
                      >
                        {pad2(hour)}:00
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.columnsWrap}>
                  {days.map((day) => renderDayColumn(day))}
                </View>
              </View>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.dayView}>
            <View style={styles.dayViewHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Hari sebelumnya"
                onPress={() => setSelectedDay((d) => addDays(d, -1))}
                style={({ pressed }) => [
                  styles.navArrow,
                  pressed && styles.navArrowPressed,
                ]}
              >
                <Ionicons name="chevron-back" size={18} color={colors.inkMuted} />
              </Pressable>
              <View style={styles.dayViewTitle}>
                <Text style={styles.dayViewLabel}>
                  {WEEKDAY_FULL[(selectedDay.getDay() + 6) % 7]}
                </Text>
                <Text style={styles.dayViewNumber}>
                  {selectedDay.getDate()} {MONTHS_FULL[selectedDay.getMonth()]}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Hari berikutnya"
                onPress={() => setSelectedDay((d) => addDays(d, 1))}
                style={({ pressed }) => [
                  styles.navArrow,
                  pressed && styles.navArrowPressed,
                ]}
              >
                <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
              </Pressable>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: (insets?.bottom ?? 0) + 24 }}
            >
              <View style={styles.bodyRow}>
                <View style={styles.timeGutter}>
                  {hours.map((hour) => (
                    <View
                      key={hour}
                      style={[
                        styles.timeCell,
                        { height: PX_PER_HOUR },
                        hour === 12 && styles.timeCellBreak,
                      ]}
                    >
                      <Text
                        style={[
                          styles.timeLabel,
                          hour === 12 && styles.timeLabelMuted,
                        ]}
                      >
                        {pad2(hour)}:00
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.columnsWrap}>
                  {renderDayColumn(selectedDay)}
                </View>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.violet }]} />
            <Text style={styles.legendText}>Sesi Lab</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.lime }]} />
            <Text style={styles.legendText}>Sesi terbuka</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: colors.dangerInk },
              ]}
            />
            <Text style={styles.legendText}>Waktu sekarang</Text>
          </View>
        </View>
      </View>

      {/* Bottom sheet drawer */}
      {drawerSession ? (
        <View style={styles.sheet} pointerEvents="box-none">
          <Animated.View
            style={[styles.sheetBackdrop, { opacity: sheetOpacity }]}
            accessibilityElementsHidden
          />
          <Animated.View
            style={[
              styles.sheetCard,
              {
                paddingBottom: 24 + Math.max(insets?.bottom ?? 0, 8),
                transform: [
                  {
                    translateY: sheetY.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 640],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.sheetHandle} accessibilityElementsHidden />
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <StatusBadge
                  label={drawerBadgeLabel}
                  tone={drawerSession.status === 'open' ? 'violet' : 'success'}
                  dot
                />
                <Text style={styles.sheetTitle}>
                  {drawerSession.courseName}
                </Text>
                <Text style={styles.sheetMeta}>
                  {drawerSession.groupName}
                  {drawerSession.lab ? ` · ${drawerSession.lab}` : null}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tutup detail"
                onPress={closeDrawer}
                style={({ pressed }) => [
                  styles.sheetClose,
                  pressed && styles.navArrowPressed,
                ]}
              >
                <Ionicons name="close" size={18} color={colors.inkMuted} />
              </Pressable>
            </View>
            <View style={styles.sheetDetailGrid}>
              <View style={styles.sheetDetail}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={colors.violet}
                />
                <Text style={styles.sheetDetailLabel}>Waktu Sesi</Text>
                <Text style={styles.sheetDetailValue}>
                  {(() => {
                    const { startMin, endMin } = sessionMinutes(drawerSession);
                    return (
                      `${pad2(Math.floor(startMin / 60))}:${pad2(startMin % 60)} – ` +
                      `${pad2(Math.floor(endMin / 60))}:${pad2(endMin % 60)} WIB`
                    );
                  })()}
                </Text>
              </View>
              <View style={styles.sheetDetail}>
                <Ionicons name="location-outline" size={16} color={colors.violet} />
                <Text style={styles.sheetDetailLabel}>Lokasi Lab</Text>
                <Text style={styles.sheetDetailValue} numberOfLines={1}>
                  {drawerSession.lab ?? drawerSession.groupName}
                </Text>
              </View>
            </View>
            {/* Dosen & asisten info */}
            <View style={styles.sheetPeople}>
              <View style={styles.sheetPeopleItem}>
                <Ionicons name="school-outline" size={16} color={colors.inkMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetPeopleLabel}>Dosen Pengampu</Text>
                  <Text style={styles.sheetPeopleValue}>
                    {drawerSession.groupName}
                  </Text>
                </View>
              </View>
              <View style={styles.sheetPeopleItem}>
                <Ionicons name="people-outline" size={16} color={colors.inkMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetPeopleLabel}>Asisten Pendamping</Text>
                  <Text style={styles.sheetPeopleValue}>
                    {isAsisten ? 'Tim Asisten' : '—'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.sheetActions}>
              <View style={{ flex: 1 }}>
                <Button
                  label="Detail Sesi"
                  variant="soft"
                  icon="information-circle-outline"
                  onPress={() => {
                    const target = drawerSession;
                    closeDrawer();
                    openSessionDetail(target);
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                {isAsisten ? (
                  <Button
                    label="Buka Presensi"
                    variant="primary"
                    icon="finger-print"
                    onPress={() => {
                      const target = drawerSession;
                      closeDrawer();
                      navigation.navigate('AssistantAttendanceRoster', {
                        sessionId: target.id,
                      });
                    }}
                  />
                ) : (
                  <Button
                    label="Buka Presensi QR"
                    variant="accent"
                    icon="qr-code"
                    disabled={drawerSession.status !== 'open'}
                    onPress={() => {
                      const target = drawerSession;
                      closeDrawer();
                      openSessionDetail(target);
                    }}
                  />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Ajukan Tukar"
                  variant="outline"
                  icon="swap-horizontal"
                  onPress={() => {
                    const target = drawerSession;
                    closeDrawer();
                    openSessionDetail(target);
                  }}
                />
              </View>
            </View>
          </Animated.View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  headText: { gap: 2 },
  title: {
    ...typography.display,
    color: colors.ink,
    fontSize: 26,
  },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: colors.panel,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    marginHorizontal: 4,
  },
  navArrows: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navArrow: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowPressed: { backgroundColor: colors.lavenderSubtle },
  navWeekText: { gap: 0, marginLeft: 6, marginRight: 8 },
  navWeekLabel: { ...typography.overline, color: colors.violet, fontSize: 9 },
  navWeekDate: { ...typography.label, color: colors.ink, fontWeight: '700' },
  todayChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.lavender,
  },
  todayChipText: { ...typography.caption, color: colors.violet, fontWeight: '700' },

  viewSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 2,
  },
  viewPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  viewPillActive: {
    backgroundColor: colors.panel,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  viewPillLabel: { ...typography.caption, color: colors.inkMuted, fontWeight: '600' },
  viewPillLabelActive: { color: colors.violet, fontWeight: '700' },

  kpiGrid: { flexDirection: 'row', gap: 8 },
  kpiCard: { flex: 1 },
  kpiTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiLabel: {
    ...typography.overline,
    color: colors.lime,
    fontSize: 9,
  },
  kpiLabelMuted: { ...typography.overline, color: colors.inkMuted, fontSize: 9 },
  kpiValue: {
    ...typography.display,
    color: colors.ink,
    fontSize: 22,
    marginTop: 2,
  },
  kpiCaption: { ...typography.caption, color: colors.lime, opacity: 0.8 },
  kpiCaptionMuted: { ...typography.caption, color: colors.inkMuted },

  gridContainer: {
    backgroundColor: colors.panel,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    marginHorizontal: 4,
    marginBottom: 4,
  },

  // Week view
  weekScrollContent: { flexGrow: 1 },
  weekGrid: { minWidth: 720 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 6,
  },
  timeGutter: { width: 44 },
  timeGutterHeader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gmtLabel: { ...typography.overline, color: colors.inkMuted, fontSize: 8 },

  dayHeader: {
    flex: 1,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingVertical: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  dayHeaderToday: { backgroundColor: colors.violet },
  dayHeaderWeekend: { opacity: 0.65 },
  dayHeaderLabel: {
    ...typography.overline,
    color: colors.inkMuted,
    fontSize: 9,
  },
  dayHeaderLabelToday: { color: colors.lime },
  dayHeaderNumber: {
    ...typography.bodyStrong,
    color: colors.ink,
    fontSize: 16,
  },
  dayHeaderNumberToday: { color: colors.onPrimary, fontSize: 18 },
  dayHeaderCount: { ...typography.caption, color: colors.inkMuted, fontSize: 9 },
  dayHeaderCountToday: { color: 'rgba(255,255,255,0.75)' },

  bodyRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  timeCell: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  timeCellBreak: { backgroundColor: 'rgba(231,227,242,0.35)' },
  timeLabel: { ...typography.caption, color: colors.inkMuted, fontSize: 10 },
  timeLabelMuted: { opacity: 0.6 },

  columnsWrap: { flex: 1, flexDirection: 'row', gap: 6 },

  dayColumn: {
    position: 'relative',
    borderLeftWidth: 1,
    borderLeftColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  dayColumnToday: { backgroundColor: 'rgba(91,59,232,0.04)' },
  gridLines: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  gridLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakLabel: {
    ...typography.overline,
    color: colors.inkMuted,
    opacity: 0.5,
    fontSize: 7,
  },

  event: {
    position: 'absolute',
    left: 4,
    right: 4,
    borderRadius: 12,
    padding: 6,
    gap: 1,
    overflow: 'hidden',
  },
  eventOpen: {
    backgroundColor: colors.violet,
    shadowColor: colors.violet,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  eventPlain: {
    backgroundColor: colors.lavender,
  },
  eventTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventTime: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.violet,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.lime,
  },
  eventTitle: {
    ...typography.label,
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
  eventLab: { ...typography.caption, color: colors.inkMuted, fontSize: 9 },
  eventActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 2 },
  eventActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.lime,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  eventActionText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.ink,
  },
  eventActiveNote: {
    ...typography.caption,
    fontSize: 8,
    fontWeight: '700',
    color: colors.lime,
  },

  nowLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.dangerInk,
    marginLeft: 2,
  },
  nowLineBody: {
    flex: 1,
    height: 2,
    backgroundColor: colors.dangerInk,
    opacity: 0.9,
  },

  emptyDayMark: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    opacity: 0.4,
  },
  emptyDayText: { ...typography.caption, color: colors.inkMuted },

  // Day view
  dayView: { gap: 8 },
  dayViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayViewTitle: { alignItems: 'center', gap: 0 },
  dayViewLabel: { ...typography.overline, color: colors.inkMuted, fontSize: 10 },
  dayViewNumber: { ...typography.label, color: colors.ink, fontWeight: '700' },

  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...typography.caption, color: colors.inkMuted },

  // Bottom sheet
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23,20,31,0.4)',
  },
  sheetCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.panel,
    borderTopLeftRadius: radius['4xl'],
    borderTopRightRadius: radius['4xl'],
    padding: 18,
    gap: 12,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  sheetTitle: { ...typography.subtitle, color: colors.ink, marginTop: 4 },
  sheetMeta: { ...typography.caption, color: colors.inkMuted },
  sheetClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetDetailGrid: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    padding: 10,
  },
  sheetDetail: { flex: 1, gap: 3 },
  sheetDetailLabel: { ...typography.overline, color: colors.inkMuted, fontSize: 8 },
  sheetDetailValue: { ...typography.label, color: colors.ink, fontWeight: '600' },

  sheetPeople: {
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 10,
  },
  sheetPeopleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sheetPeopleLabel: {
    ...typography.overline,
    color: colors.inkMuted,
    fontSize: 8,
  },
  sheetPeopleValue: { ...typography.label, color: colors.ink, fontWeight: '600' },

  sheetActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
});
