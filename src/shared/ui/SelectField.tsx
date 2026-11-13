import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { colors, radius, shadow, spacing } from '../../theme/tokens';
import { ListRow } from './ListRow';
import { Text } from './Text';

export type SelectOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

export type SelectFieldProps<T extends string> = {
  label: string;
  options: SelectOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  placeholder: string;
  /** Shown below the field in danger tone; also styles the field as invalid. */
  error?: string;
};

/** Sticker sheet Section 03 "Dropdown": TextField look, opens an option list. */
export function SelectField<T extends string>({
  label,
  options,
  value,
  onChange,
  placeholder,
  error,
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const invalid = !!error;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label ?? placeholder }}
        accessibilityHint={error}
        onPress={() => setOpen(true)}
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
          <Text
            variant="bodyStrong"
            tone={selected ? 'ink' : 'muted'}
            numberOfLines={1}
          >
            {selected?.label ?? placeholder}
          </Text>
        </View>
        <Ionicons
          name="chevron-down"
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

      <Modal
        visible={open}
        transparent
        animationType="fade"
        accessibilityViewIsModal
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tutup pilihan"
            onPress={() => setOpen(false)}
            style={styles.scrim}
          />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text variant="bodyStrong" style={styles.sheetTitle}>
              {label}
            </Text>
            <ScrollView contentContainerStyle={styles.list}>
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <ListRow
                    key={option.value}
                    title={option.label}
                    meta={option.description}
                    accessibilityLabel={option.label}
                    accessibilityHint={isSelected ? 'Terpilih' : undefined}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    trailing={
                      isSelected ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color={colors.violet}
                          importantForAccessibility="no"
                        />
                      ) : null
                    }
                  />
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    maxHeight: '70%',
    backgroundColor: colors.panel,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
    gap: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  sheetTitle: { paddingHorizontal: spacing.xs },
  list: { gap: spacing.sm },
});
