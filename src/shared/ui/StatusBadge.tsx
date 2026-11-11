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
  pink: { bg: colors.pink, fg: '#8A0F41' },
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
  /** Small dot prefix (sticker sheet chips). */
  dot?: boolean;
  /** Pulsing dot for "active" states. */
  live?: boolean;
};

export function StatusBadge({
  label,
  tone = 'neutral',
  dot = false,
  live = false,
}: StatusBadgeProps) {
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
      {dot ? (
        <View
          accessibilityElementsHidden
          style={[
            styles.dot,
            live ? styles.dotLive : { backgroundColor: appearance.fg },
          ]}
        />
      ) : null}
      <Text style={[styles.label, { color: appearance.fg }]}>{label}</Text>
    </View>
  );
}

// Compat: pre-refactor screens use <StatusBadge status="open" />.
const legacyStatusMap: Record<
  string,
  { label: string; tone: BadgeTone; live?: boolean }
> = {
  scheduled: { label: 'Terjadwal', tone: 'lavender' },
  open: { label: 'Sesi Aktif', tone: 'violet', live: true },
  closed: { label: 'Tertutup', tone: 'neutral' },
};

export function LegacyStatusBadge({ status }: { status: string }) {
  const entry = legacyStatusMap[status] ?? legacyStatusMap.scheduled;
  return (
    <StatusBadge
      label={entry.label}
      tone={entry.tone}
      live={entry.live}
      dot={entry.tone === 'violet'}
    />
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotLive: { backgroundColor: colors.lime },
  label: { ...typography.caption, fontSize: 12, fontWeight: '700' },
});

// Re-export the legacy name so old imports keep working.
export { LegacyStatusBadge as StatusBadgeCompat };
