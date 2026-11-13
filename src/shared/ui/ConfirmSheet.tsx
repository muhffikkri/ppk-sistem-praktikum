import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from './Button';
import { colors, radius, spacing, typography } from './theme';

export type ConfirmSheetProps = {
  visible: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmSheet({
  visible,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = 'Batal',
  tone = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tutup konfirmasi"
          disabled={loading}
          onPress={onCancel}
          style={styles.backdrop}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.panel,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.md },
          ]}
        >
          <View style={styles.handle} accessibilityElementsHidden />
          <Text style={styles.title}>{title}</Text>
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}
          {children}
          <View style={styles.actions}>
            {cancelLabel ? (
              <View style={styles.actionItem}>
                <Button
                  label={cancelLabel}
                  variant="outline"
                  disabled={loading}
                  onPress={onCancel}
                />
              </View>
            ) : null}
            <View style={styles.actionItem}>
              <Button
                label={loading ? 'Memproses…' : confirmLabel}
                variant={tone === 'danger' ? 'destructive' : 'primary'}
                loading={loading}
                onPress={onConfirm}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(23,20,31,0.45)',
  },
  panel: {
    backgroundColor: colors.panel,
    borderTopLeftRadius: radius['4xl'],
    borderTopRightRadius: radius['4xl'],
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },
  title: { ...typography.subtitle, color: colors.ink },
  description: { ...typography.body, color: colors.inkMuted },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionItem: { flex: 1 },
});
