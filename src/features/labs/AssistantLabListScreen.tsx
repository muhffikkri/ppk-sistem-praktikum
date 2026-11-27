import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Banner,
  Button,
  EmptyState,
  ErrorState,
  ListRow,
  LoadingState,
  Screen,
  spacing,
  StatusBadge,
  BackButton,
} from '../../shared/ui';
import { useAuth } from '../../state';
import { canManageLabMaster } from '../../domain/asprakScope';
import { useLabManagement } from './useLabManagement';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantLabList'>;

const formatCoord = (value: number) =>
  Number.isFinite(value) ? value.toFixed(5) : '—';

export function AssistantLabListScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { labs: allLabs, loading, error, retry } = useLabManagement();
  const goBack = () => navigation.goBack();
  const isLabManager = canManageLabMaster(user?.role);
  const managedCourseIds = user?.managedCourseIds ?? [];
  const labs = isLabManager
    ? allLabs.filter((lab) => managedCourseIds.includes(lab.courseId ?? ''))
    : allLabs;

  if (loading && labs.length === 0) {
    return (
      <Screen withDock={false}>
        <BackButton onPress={goBack} />
        <LoadingState label="Memuat laboratorium…" />
      </Screen>
    );
  }

  if (error && labs.length === 0) {
    return (
      <Screen withDock={false}>
        <BackButton onPress={goBack} />
        <ErrorState
          title="Gagal memuat laboratorium"
          message={error}
          onRetry={retry}
        />
      </Screen>
    );
  }

  return (
    <Screen withDock={false}>
      <BackButton onPress={goBack} />

      {!isLabManager && (
        <Banner
          tone="warning"
          title="Kewenangan Aslab"
          message="Konfigurasi dan penambahan master laboratorium dikelola oleh Aslab."
        />
      )}

      {isLabManager && managedCourseIds.length === 0 ? (
        <EmptyState
          icon="location-outline"
          title="Belum ada mata kuliah"
          description="Hubungi pengelola untuk mendapatkan penugasan mata kuliah."
        />
      ) : labs.length === 0 ? (
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

      {isLabManager && managedCourseIds.length > 0 && (
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
