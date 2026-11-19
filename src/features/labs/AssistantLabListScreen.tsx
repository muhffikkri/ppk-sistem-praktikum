import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Button,
  EmptyState,
  ErrorState,
  Header,
  ListRow,
  LoadingState,
  Screen,
  spacing,
  StatusBadge,
  TopBar,
} from '../../shared/ui';
import { useLabManagement } from './useLabManagement';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantLabList'>;

const formatCoord = (value: number) =>
  Number.isFinite(value) ? value.toFixed(5) : '—';

export function AssistantLabListScreen({ navigation }: Props) {
  const { labs, loading, error, retry } = useLabManagement();
  const goBack = () => navigation.goBack();

  if (loading && labs.length === 0) {
    return (
      <Screen withDock={false}>
        <TopBar onBack={goBack} />
        <LoadingState label="Memuat laboratorium…" />
      </Screen>
    );
  }

  if (error && labs.length === 0) {
    return (
      <Screen withDock={false}>
        <TopBar onBack={goBack} />
        <ErrorState
          title="Gagal memuat laboratorium"
          message={error}
          onRetry={retry}
        />
      </Screen>
    );
  }

  const activeCount = labs.filter((lab) => lab.isActive).length;

  return (
    <Screen withDock={false}>
      <TopBar onBack={goBack} />
      <Header
        title="Lokasi lab"
        description={`${labs.length} laboratorium · ${activeCount} aktif`}
      />

      {labs.length === 0 ? (
        <EmptyState
          icon="location-outline"
          title="Belum ada laboratorium"
          description="Tambahkan lab beserta koordinat dan radius sebagai acuan presensi."
        />
      ) : (
        <View style={styles.list}>
          {labs.map((lab) => (
            <ListRow
              key={lab.id}
              title={`${lab.name} · ${lab.building}`}
              meta={`${formatCoord(lab.location.latitude)}, ${formatCoord(lab.location.longitude)} · radius ${lab.radiusMeters} m`}
              trailing={
                <StatusBadge
                  label={lab.isActive ? 'Aktif' : 'Nonaktif'}
                  tone={lab.isActive ? 'success' : 'neutral'}
                  dot
                />
              }
              accessibilityHint="Buka form edit laboratorium"
              onPress={() =>
                navigation.navigate('AssistantLabForm', { labId: lab.id })
              }
            />
          ))}
        </View>
      )}

      <Button
        label="Tambah lab"
        icon="add"
        onPress={() => navigation.navigate('AssistantLabForm', {})}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
});
