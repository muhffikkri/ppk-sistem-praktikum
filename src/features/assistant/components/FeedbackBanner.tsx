import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../shared/ui';
import type { AssistantFeedback } from '../useAssistantSessionDetail';

type FeedbackBannerProps = {
  feedback: AssistantFeedback;
  onDismiss: () => void;
};

const ERROR_COLOR = '#9B2C2C';
const ERROR_SOFT = '#FDECEC';

export function FeedbackBanner({ feedback, onDismiss }: FeedbackBannerProps) {
  const isSuccess = feedback.kind === 'success';

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.banner, isSuccess ? styles.success : styles.error]}
    >
      <Text style={[styles.message, { color: isSuccess ? colors.primary : ERROR_COLOR }]}>
        {isSuccess ? '✓ ' : '! '}
        {feedback.message}
      </Text>
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Tutup pemberitahuan"
        hitSlop={12}
        style={styles.dismiss}
      >
        <Text style={styles.dismissText}>Tutup</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  success: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  error: { backgroundColor: ERROR_SOFT, borderColor: ERROR_COLOR },
  message: { flex: 1, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  dismiss: { minHeight: 32, justifyContent: 'center' },
  dismissText: { fontSize: 14, fontWeight: '600', color: colors.muted },
});
