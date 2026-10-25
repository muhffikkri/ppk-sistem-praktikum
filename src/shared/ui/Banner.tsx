import {
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ReactNode } from 'react';

import {
  colors,
  radius,
  shadow,
  spacing,
  typography,
} from '../../theme/tokens';

type BannerTone = 'success' | 'warning' | 'danger';

export type BannerProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  message: string;
  tone?: BannerTone;
  onDismiss?: () => void;
  action?: ReactNode;
};

const toneStyles: Record<
  BannerTone,
  { bg: string; border: string; iconBg: string; title: string }
> = {
  success: {
    bg: colors.successSoft,
    border: colors.successBorder,
    iconBg: colors.success,
    title: colors.successInk,
  },
  warning: {
    bg: colors.surface,
    border: colors.border,
    iconBg: colors.pink,
    title: colors.ink,
  },
  danger: {
    bg: colors.dangerSoft,
    border: colors.dangerBorder,
    iconBg: colors.danger,
    title: colors.dangerInk,
  },
};

/** Sticker sheet Section 08: feedback toasts / flagged boxes. */
export function Banner({
  title,
  message,
  tone = 'success',
  onDismiss,
  action,
}: BannerProps) {
  const t = toneStyles[tone];

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.banner, { backgroundColor: t.bg, borderColor: t.border }]}
    >
      <View
        style={[styles.icon, { backgroundColor: t.iconBg }]}
        accessibilityElementsHidden
      >
        <Text style={styles.iconGlyph}>
          {tone === 'success' ? '✓' : tone === 'danger' ? '!' : '⚠'}
        </Text>
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: t.title }]}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Tutup pemberitahuan"
          hitSlop={12}
          style={styles.dismiss}
        >
          <Text style={styles.dismissText}>Tutup</Text>
        </Pressable>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    padding: spacing.lg,
    ...shadow.card,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: { color: colors.panel, fontSize: 14, fontWeight: '700' },
  body: { flex: 1, gap: 2 },
  title: { ...typography.bodyStrong, fontSize: 14 },
  message: { ...typography.caption, fontSize: 11, color: colors.inkMuted },
  dismiss: {
    minHeight: 32,
    minWidth: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: { ...typography.label, color: colors.ink },
  action: { alignSelf: 'flex-end' },
});
