import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, shadow, spacing } from '../../theme/tokens';
import { Button } from './Button';
import { Text } from './Text';

export type DateTimeFieldProps = {
  label: string;
  mode: 'date' | 'time';
  value: Date;
  onChange: (value: Date) => void;
  /** Shown below the field in danger tone; also styles the field as invalid. */
  error?: string;
};

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** Contoh: "Jum, 13 Nov 2026" */
export function formatFieldDate(date: Date): string {
  return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** Contoh: "12.00" */
export function formatFieldTime(date: Date): string {
  return `${pad(date.getHours())}.${pad(date.getMinutes())}`;
}

/** Looks like `SelectField`; opens the native date or time picker. */
export function DateTimeField({
  label,
  mode,
  value,
  onChange,
  error,
}: DateTimeFieldProps) {
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const invalid = !!error;
  const text =
    mode === 'date' ? formatFieldDate(value) : formatFieldTime(value);

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode,
        is24Hour: true,
        onChange: (event: DateTimePickerEvent, picked?: Date) => {
          if (event.type === 'set' && picked) onChange(picked);
        },
      });
      return;
    }
    setDraft(value);
    setIosOpen(true);
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text }}
        accessibilityHint={error}
        onPress={open}
        style={[styles.pill, invalid && styles.pillError]}
      >
        <View style={styles.body}>
          <Text
            variant="overline"
            tone={invalid ? 'danger' : 'muted'}
            numberOfLines={1}
          >
            {label}
          </Text>
          <Text variant="bodyStrong" numberOfLines={1}>
            {text}
          </Text>
        </View>
        <Ionicons
          name={mode === 'date' ? 'calendar-outline' : 'time-outline'}
          size={20}
          color={colors.inkMuted}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </Pressable>
      {invalid ? (
        <Text variant="caption" tone="danger" style={styles.message}>
          {error}
        </Text>
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal
          visible={iosOpen}
          transparent
          animationType="fade"
          accessibilityViewIsModal
          onRequestClose={() => setIosOpen(false)}
        >
          <View style={styles.modalRoot}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tutup pilihan"
              onPress={() => setIosOpen(false)}
              style={styles.scrim}
            />
            <View style={styles.sheet}>
              <Text variant="bodyStrong">{label}</Text>
              <DateTimePicker
                value={draft}
                mode={mode}
                display="spinner"
                is24Hour
                onChange={(_event, picked) => {
                  if (picked) setDraft(picked);
                }}
              />
              <Button
                label="Pilih"
                onPress={() => {
                  onChange(draft);
                  setIosOpen(false);
                }}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 56,
    backgroundColor: colors.panel,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadow.subtle,
  },
  pillError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  body: { flex: 1, gap: 2 },
  message: { paddingHorizontal: spacing.xs },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.ink,
    opacity: 0.4,
  },
  sheet: {
    backgroundColor: colors.panel,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
    gap: spacing.md,
  },
});
