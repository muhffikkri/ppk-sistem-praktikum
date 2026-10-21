import { EmptyState, Header, Screen } from '../../shared/ui';

export function PlaceholderScreen() {
  return (
    <Screen>
      <Header eyebrow="DEMO LOKAL" title="Ruang praktikum" />
      <EmptyState
        title="Halaman sedang disiapkan"
        description="Konten dan interaksi halaman ini akan tersedia pada tahap berikutnya."
      />
    </Screen>
  );
}
