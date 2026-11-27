import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Button,
  EmptyState,
  ErrorState,
  ListRow,
  Screen,
  SkeletonList,
  spacing,
  BackButton,
  Header,
} from '../../shared/ui';
import { useAssistantSessionsViewModel } from '../../state';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantClassList'>;

export function AssistantClassListScreen({ navigation }: Props) {
  const { classes, sessions, loading, error, retry } =
    useAssistantSessionsViewModel();

  const goBack = () => navigation.goBack();

  if (loading) {
    return (
      <Screen withDock={false}>
        <BackButton onPress={goBack} />
        <SkeletonList variant="row" count={5} label="Memuat kelas…" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen withDock={false}>
        <BackButton onPress={goBack} />
        <ErrorState
          title="Gagal memuat kelas"
          message={error}
          onRetry={retry}
        />
      </Screen>
    );
  }

  return (
    <Screen withDock={false}>
      <BackButton onPress={goBack} />

      <Header title="Daftar Kelas" description="Informasi Semua Kelas" />

      {classes.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="Belum ada kelas"
          description="Buat kelas pertama untuk mulai menjadwalkan sesi."
        />
      ) : (
        <View style={styles.list}>
          {classes.map((cls) => {
            const sessionCount = sessions.filter(
              (s) => s.classId === cls.id,
            ).length;
            return (
              <ListRow
                key={cls.id}
                title={`${cls.courseName} · ${cls.groupName}`}
                meta={`${cls.participantIds.length} peserta · ${sessionCount} sesi`}
                onPress={() =>
                  navigation.navigate('AssistantClassForm', {
                    classId: cls.id,
                  })
                }
              />
            );
          })}
        </View>
      )}

      <Button
        label="Buat kelas"
        icon="add"
        onPress={() => navigation.navigate('AssistantClassForm', {})}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
});
