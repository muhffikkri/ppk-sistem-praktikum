import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  colors,
  radius,
  Screen,
  Button,
  StatusBadge,
  typography,
} from '../../shared/ui';
import { useAssistantSessionsViewModel } from '../../state';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantClassList'>;

export function AssistantClassListScreen({ navigation }: Props) {
  const { classes, loading, error, retry } = useAssistantSessionsViewModel();

  if (loading) {
    return (
      <Screen>
        <Text style={styles.loadingText}>Memuat kelas...</Text>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <Text style={styles.errorText}>Gagal memuat kelas: {error}</Text>
        <Button label="Coba Lagi" onPress={retry} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Editorial header */}
        <View style={styles.headerBlock}>
          <Text style={styles.eyebrow}>MODE ASISTEN · KELAS</Text>
          <Text style={styles.pageTitle}>Kelas Saya</Text>
        </View>

        {classes.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyTitle}>Belum ada kelas</Text>
            <Text style={styles.emptySub}>
              Tambah kelas pertama Anda untuk memulai praktikum.
            </Text>
            <Button
              label="Tambah Kelas"
              onPress={() => navigation.navigate('AssistantClassForm', {})}
              variant="accent"
            />
          </View>
        ) : (
          <View style={styles.list}>
            {classes.map((cls) => (
              <TouchableOpacity
                key={cls.id}
                accessibilityRole="button"
                accessibilityLabel={`${cls.courseName} - ${cls.groupName}`}
                onPress={() =>
                  navigation.navigate('AssistantClassForm', { classId: cls.id })
                }
              >
                <View style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.courseNumberLines}>{cls.courseName}</Text>
                    <StatusBadge label={cls.groupName} tone="violet" dot />
                  </View>
                  <View style={styles.cardBottom}>
                    <Text style={styles.meta}>{cls.groupName}</Text>
                    <Text style={styles.metaMuted}>
                      {cls.participantIds?.length || 0} peserta
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => navigation.navigate('AssistantClassForm', {})}
          accessibilityLabel="Tambah kelas baru"
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    padding: 24,
    gap: 20,
  },
  headerBlock: { gap: 6 },
  eyebrow: { ...typography.overline, color: colors.violet },
  pageTitle: {
    ...typography.display,
    color: colors.ink,
    fontSize: 32,
    letterSpacing: -1,
  },
  loadingText: { ...typography.body, color: colors.inkMuted, padding: 24 },
  errorText: { ...typography.body, color: colors.danger, padding: 24 },
  emptyBlock: {
    backgroundColor: colors.panel,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    padding: 32,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: { ...typography.bodyStrong, color: colors.ink },
  emptySub: { ...typography.body, color: colors.inkMuted, textAlign: 'center' },
  list: {
    backgroundColor: colors.panel,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  card: {
    padding: 20,
    gap: 12,
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  courseNumberLines: {
    flex: 1,
    flexShrink: 1,
    ...typography.subtitle,
    color: colors.ink,
    letterSpacing: -0.36,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 8,
  },
  meta: { ...typography.label, color: colors.ink },
  metaMuted: { ...typography.label, color: colors.inkMuted },
  fabContainer: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.violet,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    ...typography.display,
    color: colors.onPrimary,
    fontSize: 28,
  },
});
