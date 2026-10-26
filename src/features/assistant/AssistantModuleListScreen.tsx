import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  colors,
  Header,
  radius,
  Screen,
  StatusBadge,
  typography,
} from '../../shared/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantModuleList'>;

/** Dummy module list — swap with real module catalog when API lands. */
const MODULES = [
  {
    id: 'mod-01',
    code: 'MOD-01',
    title: 'Kalibrasi EKG & Elektroda',
    pages: 12,
    status: 'selesai',
  },
  {
    id: 'mod-02',
    code: 'MOD-02',
    title: 'Perakitan Papan Praktikum',
    pages: 18,
    status: 'selesai',
  },
  {
    id: 'mod-03',
    code: 'MOD-03',
    title: 'Anotasi Rangkaian Digital',
    pages: 9,
    status: 'berlangsung',
  },
  {
    id: 'mod-04',
    code: 'MOD-04',
    title: 'Analisis Sinyal EKG dengan Python',
    pages: 14,
    status: 'tersedia',
  },
  {
    id: 'mod-05',
    code: 'MOD-05',
    title: 'Laporan & Berita Acara',
    pages: 6,
    status: 'tersedia',
  },
] as const;

const STATUS_TONE = {
  selesai: 'success' as const,
  berlangsung: 'violet' as const,
  tersedia: 'neutral' as const,
};

export function AssistantModuleListScreen({ navigation }: Props) {
  return (
    <Screen>
      <Header
        eyebrow="MODE ASISTEN · MODUL"
        title="Modul & Materi"
        description="Katalog materi praktikum untuk sesi aktif"
      />

      <View style={styles.list}>
        {MODULES.map((module, index) => (
          <Pressable
            key={module.id}
            accessibilityRole="button"
            accessibilityLabel={`Buka modul ${module.title}`}
            onPress={() =>
              navigation.navigate('AssistantSessionDetail', {
                sessionId: 'session-ast-02',
              })
            }
            style={({ pressed }) => [
              styles.moduleCard,
              index < MODULES.length - 1 && styles.moduleDivider,
              pressed && { opacity: 0.9 },
            ]}
          >
            <View style={styles.moduleHeader}>
              <Text style={styles.moduleCode}>{module.code}</Text>
              <StatusBadge
                label={module.status}
                tone={STATUS_TONE[module.status]}
                dot
              />
            </View>
            <Text style={styles.moduleTitle} numberOfLines={2}>
              {module.title}
            </Text>
            <Text style={styles.moduleMeta}>{module.pages} halaman</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: colors.panel,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  moduleCard: {
    padding: 16,
    gap: 6,
  },
  moduleDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  moduleCode: { ...typography.caption, color: colors.inkMuted },
  moduleTitle: { ...typography.bodyStrong, color: colors.ink, fontSize: 14 },
  moduleMeta: { ...typography.caption, color: colors.inkMuted },
});
