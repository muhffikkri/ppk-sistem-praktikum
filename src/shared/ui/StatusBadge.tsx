import { StyleSheet, Text, View } from 'react-native';

import { colors } from './theme';

const statuses = {
  scheduled: {
    label: 'Terjadwal',
    backgroundColor: colors.warningSoft,
    color: colors.warning,
  },
  open: {
    label: 'Terbuka',
    backgroundColor: colors.primarySoft,
    color: colors.primary,
  },
  closed: {
    label: 'Tertutup',
    backgroundColor: colors.disabled,
    color: colors.muted,
  },
};

export function StatusBadge({ status }: { status: keyof typeof statuses }) {
  const appearance = statuses[status];

  return (
    <View
      style={[styles.badge, { backgroundColor: appearance.backgroundColor }]}
    >
      <Text style={[styles.label, { color: appearance.color }]}>
        {appearance.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  label: { fontSize: 13, fontWeight: '600' },
});
