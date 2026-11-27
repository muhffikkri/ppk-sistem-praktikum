import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Banner,
  Button,
  EmptyState,
  ErrorState,
  ListRow,
  Screen,
  SkeletonList,
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
  const {
    labs: allLabs,
    loading,
    error,
    togglingId,
    setLabActiveStatus,
    retry,
  } = useLabManagement();
  const [actionError, setActionError] = useState<string | null>(null);
  const goBack = () => navigation.goBack();
  const isLabManager = canManageLabMaster(user?.role);
  const managedCourseIds = user?.managedCourseIds ?? [];
  const labs = isLabManager
    ? allLabs.filter((lab) => managedCourseIds.includes(lab.courseId ?? ''))
    : allLabs;

  const handleToggleActive = async (labId: string, nextActive: boolean) => {
    setActionError(null);
    const res = await setLabActiveStatus(labId, nextActive);
    if (!res.ok) {
      setActionError(res.message || 'Gagal memperbarui status laboratorium.');
    }
  };

  if (loading && labs.length === 0) {
    return (
      <Screen withDock={false}>
        <BackButton onPress={goBack} />
        <SkeletonList variant="row" count={5} label="Memuat laboratorium…" />
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

      {actionError ? (
        <Banner tone="danger" title="Gagal" message={actionError} />
      ) : null}

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
          {labs.map((lab) => {
            const isToggling = togglingId === lab.id;
            return (
              <View key={lab.id} style={styles.card}>
                <ListRow
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
                          navigation.navigate('AssistantLabForm', {
                            labId: lab.id,
                          })
                      : undefined
                  }
                />

                {isLabManager && (
                  <View style={styles.rowActions}>
                    <Button
                      label={lab.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      variant="outline"
                      loading={isToggling}
                      disabled={isToggling}
                      onPress={() => handleToggleActive(lab.id, !lab.isActive)}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {isLabManager && managedCourseIds.length > 0 && (
        <View style={styles.card}>
          <Button
            label="Tambah lab"
            icon="add"
            onPress={() => navigation.navigate('AssistantLabForm', {})}
          />
          <Button
            label="Impor CSV"
            variant="outline"
            onPress={() => navigation.navigate('AslabLabImport')}
          />
          <Button
            label="Distribusi praktikan dan Asprak"
            variant="outline"
            onPress={() => navigation.navigate('AslabLabDistribution')}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  card: { gap: spacing.xs },
  rowActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
