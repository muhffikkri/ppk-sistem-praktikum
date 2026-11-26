import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, typography } from '../../theme/tokens';

export type BadgeTone =
  | 'lime' // hadir tepat waktu
  | 'pink' // terlambat
  | 'lavender' // izin
  | 'ink' // ACC dosen / solid dark
  | 'violet' // sesi aktif
  | 'neutral' // alpa / outline
  | 'success' // on site / valid
  | 'danger'; // error

const toneStyles: Record<
  BadgeTone,
  { bg: string; fg: string; border?: string }
> = {
  lime: { bg: colors.lime, fg: colors.ink },
  pink: { bg: colors.pink, fg: colors.pinkInk },
  lavender: { bg: colors.lavender, fg: colors.violet },
  ink: { bg: colors.ink, fg: colors.panel },
  violet: { bg: colors.violet, fg: colors.panel },
  neutral: { bg: colors.surface, fg: colors.inkMuted, border: colors.border },
  success: {
    bg: colors.onSiteSoft,
    fg: colors.onSite,
    border: colors.onSiteBorder,
  },
  danger: {
    bg: colors.dangerSoft,
    fg: colors.dangerInk,
    border: colors.dangerBorder,
  },
};

export type StatusBadgeProps = {
  label: string;
  tone?: BadgeTone;
};

/** Text-only status chip: colour comes from the tone, never a dot prefix. */
export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  const appearance = toneStyles[tone];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: appearance.bg,
          borderColor: appearance.border ?? 'transparent',
        },
      ]}
      accessibilityLabel={label}
    >
      <Text style={[styles.label, { color: appearance.fg }]}>{label}</Text>
    </View>
  );
}

// Compat: pre-refactor screens use <StatusBadge status="open" />.
const legacyStatusMap: Record<string, { label: string; tone: BadgeTone }> = {
  scheduled: { label: 'Terjadwal', tone: 'lavender' },
  open: { label: 'Sesi Aktif', tone: 'violet' },
  closed: { label: 'Tertutup', tone: 'neutral' },
};

export function LegacyStatusBadge({ status }: { status: string }) {
  const entry = legacyStatusMap[status] ?? legacyStatusMap.scheduled;
  return <StatusBadge label={entry.label} tone={entry.tone} />;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  label: { ...typography.caption, fontSize: 12, fontWeight: '700' },
});

// Re-export the legacy name so old imports keep working.
export { LegacyStatusBadge as StatusBadgeCompat };
