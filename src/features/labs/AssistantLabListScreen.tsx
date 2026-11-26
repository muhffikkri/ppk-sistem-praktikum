import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Banner,
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
import { useAuth } from '../../state';
import { canManageLabMaster } from '../../domain/asprakScope';
import { useLabManagement } from './useLabManagement';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantLabList'>;

const formatCoord = (value: number) =>
  Number.isFinite(value) ? value.toFixed(5) : '—';

export function AssistantLabListScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { labs, loading, error, retry } = useLabManagement();
  const goBack = () => navigation.goBack();
  const isLabManager = canManageLabMaster(user?.role);

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

      {!isLabManager && (
        <Banner
          tone="warning"
          title="Kewenangan Aslab"
          message="Konfigurasi dan penambahan master laboratorium dikelola oleh Aslab."
        />
      )}

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
              accessibilityHint={
                isLabManager ? 'Buka form edit laboratorium' : undefined
              }
              onPress={
                isLabManager
                  ? () =>
                      navigation.navigate('AssistantLabForm', { labId: lab.id })
                  : undefined
              }
            />
          ))}
        </View>
      )}

      {isLabManager && (
        <Button
          label="Tambah lab"
          icon="add"
          onPress={() => navigation.navigate('AssistantLabForm', {})}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
});
