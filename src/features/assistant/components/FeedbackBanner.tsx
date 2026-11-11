import { Banner } from '../../../shared/ui';
import type { AssistantFeedback } from '../useAssistantSessionDetail';

type FeedbackBannerProps = {
  feedback: AssistantFeedback;
  onDismiss: () => void;
};

/**
 * Thin wrapper that adapts the domain feedback shape to the shared Banner
 * primitive (sticker sheet Section 08).
 */
export function FeedbackBanner({ feedback, onDismiss }: FeedbackBannerProps) {
  const isSuccess = feedback.kind === 'success';

  return (
    <Banner
      title={isSuccess ? 'Berhasil' : 'Gagal'}
      message={feedback.message}
      tone={isSuccess ? 'success' : 'danger'}
      onDismiss={onDismiss}
    />
  );
}
