import { Pressable, StyleSheet, View } from 'react-native';

import { colors, IconButton, radius, spacing, Text } from '../../shared/ui';
import type { CalendarDay } from './useCalendarViewModel';

type Props = {
  days: CalendarDay[];
  onSelect: (date: Date) => void;
  onPrev: () => void;
  onNext: () => void;
};

/** Tujuh hari nyata dengan navigasi minggu. Titik = hari yang punya sesi. */
export function WeekStrip({ days, onSelect, onPrev, onNext }: Props) {
  return (
    <View style={styles.row}>
      <IconButton
        icon="chevron-back"
        accessibilityLabel="Minggu sebelumnya"
        variant="ghost"
        onPress={onPrev}
      />
      <View style={styles.days}>
        {days.map((day) => (
          <Pressable
            key={day.date.toDateString()}
            accessibilityRole="button"
            accessibilityLabel={day.date.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
            accessibilityState={{ selected: day.isSelected }}
            onPress={() => onSelect(day.date)}
            style={[
              styles.day,
              day.isToday && styles.today,
              day.isSelected && styles.selected,
            ]}
          >
            <Text variant="caption" tone={day.isSelected ? 'onDark' : 'muted'}>
              {day.label}
            </Text>
            <Text variant="bodyStrong" tone={day.isSelected ? 'onDark' : 'ink'}>
              {String(day.date.getDate())}
            </Text>
            <View
              style={[
                styles.dot,
                day.hasSession && {
                  backgroundColor: day.isSelected ? colors.lime : colors.violet,
                },
              ]}
            />
          </Pressable>
        ))}
      </View>
      <IconButton
        icon="chevron-forward"
        accessibilityLabel="Minggu berikutnya"
        variant="ghost"
        onPress={onNext}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  days: { flex: 1, flexDirection: 'row', gap: spacing.xs },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  today: { borderColor: colors.violet },
  selected: { backgroundColor: colors.ink, borderColor: colors.ink },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
