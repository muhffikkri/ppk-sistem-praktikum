import { IconButton } from './IconButton';

export type BackButtonProps = {
  onPress: () => void;
  /** Override for screens whose back action means "Tutup". */
  label?: string;
};

/**
 * The only chrome on pushed screens (login, detail, forms): a bare back
 * control with no bar, title, or trailing slot. Root/navbar screens use
 * `AppTopBar` instead — see design.md "Chrome" rules.
 */
export function BackButton({ onPress, label = 'Kembali' }: BackButtonProps) {
  return (
    <IconButton
      icon="chevron-back"
      variant="ghost"
      accessibilityLabel={label}
      onPress={onPress}
    />
  );
}
