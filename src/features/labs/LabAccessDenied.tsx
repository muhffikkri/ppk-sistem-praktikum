import { BackButton, ErrorState, Screen } from '../../shared/ui';

/**
 * Tampilan tunggal saat layar master lab dibuka oleh akun yang tidak berwenang.
 * Route master lab hanya didaftarkan untuk Aslab; ini lapisan kedua bila
 * layar tetap tercapai, misalnya profil berubah saat layar terbuka.
 */
export function LabAccessDenied({
  onBack,
  message = 'Pengelolaan laboratorium hanya untuk Aslab yang ditugaskan pada mata kuliah terkait.',
}: {
  onBack: () => void;
  message?: string;
}) {
  return (
    <Screen withDock={false}>
      <BackButton onPress={onBack} />
      <ErrorState title="Akses lab dibatasi" message={message} />
    </Screen>
  );
}
