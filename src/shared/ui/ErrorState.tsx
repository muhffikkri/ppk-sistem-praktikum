import { Banner } from './Banner';
import { Button } from './Button';

export type ErrorStateProps = {
  title?: string;
  /** Message from the service that failed. */
  message: string;
  /** Shows a "Coba lagi" button when provided. */
  onRetry?: () => void;
};

/** Danger banner with an optional retry, for failed loads. */
export function ErrorState({
  title = 'Gagal memuat data',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <Banner
      tone="danger"
      title={title}
      message={message}
      action={
        onRetry ? (
          <Button
            label="Coba lagi"
            variant="outline"
            size="sm"
            icon="refresh"
            onPress={onRetry}
          />
        ) : undefined
      }
    />
  );
}
