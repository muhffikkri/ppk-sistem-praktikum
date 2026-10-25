import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Card,
  CardContent,
  CardHeader,
  colors,
  radius,
  Screen,
  StatusBadge,
  typography,
} from '../shared/ui';
import { POVLABEL, type ActorPov, type RootStackParamList } from './navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const POVS: ActorPov[] = ['praktikan', 'asisten'];

export function ProfileScreen({ navigation }: Props) {
  const [pov, setPov] = useState<ActorPov>('praktikan');
  const [menuOpen, setMenuOpen] = useState(false);

  const selectPov = (value: ActorPov) => {
    setPov(value);
    setMenuOpen(false);
  };

  return (
    <Screen>
      <View style={styles.headRow}>
        <Text accessibilityRole="header" style={styles.title}>
          Profil
        </Text>
        <StatusBadge label="DEMO" tone="violet" dot live />
      </View>

      <Card variant="panel">
        <CardContent>
          <CardHeader
            title="Identitas demo"
            trailing={<Text style={styles.povValue}>{POVLABEL[pov]}</Text>}
          />
          <Text style={styles.body}>
            Profil ini masih dalam tahap pengerjaan. Pilih sudut pandang aktor
            untuk meneruskan ke alur demo.
          </Text>

          <View>
            <Text style={styles.chooserLabel}>Sudut pandang</Text>

            {/* Select trigger */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Pilih sudut pandang: ${POVLABEL[pov]}`}
              onPress={() => setMenuOpen((open) => !open)}
              style={({ pressed }) => [
                styles.trigger,
                menuOpen && styles.triggerOpen,
                pressed && styles.triggerPressed,
              ]}
            >
              <Text style={styles.triggerText}>{POVLABEL[pov]}</Text>
              <Text style={styles.chevron}>{menuOpen ? '▲' : '▼'}</Text>
            </Pressable>

            {/* Dropdown list */}
            {menuOpen ? (
              <View style={styles.menu}>
                {POVS.map((value) => {
                  const active = value === pov;
                  return (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => selectPov(value)}
                      style={styles.menuItem}
                    >
                      <Text
                        style={[
                          styles.menuItemText,
                          active ? styles.menuItemActive : undefined,
                        ]}
                      >
                        {POVLABEL[value]}
                      </Text>
                      {active ? (
                        <Text style={styles.menuCheck} accessible={false}>
                          ✓
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>

          <Text style={styles.note}>
            Halaman profil masih dalam tahap pengerjaan.
          </Text>
        </CardContent>
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footNote}>
          Menutup dropdown & pilih POV akan dipakai alur demo berikutnya.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
        >
          <Text style={styles.backText}>Kembali</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: { ...typography.display, color: colors.ink },
  body: { ...typography.body, color: colors.inkMuted },
  povValue: { ...typography.bodyStrong, color: colors.violet },
  chooserLabel: {
    ...typography.overline,
    color: colors.inkMuted,
    marginBottom: 6,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: radius['2xl'],
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
  },
  triggerOpen: { borderColor: colors.violet },
  triggerPressed: { backgroundColor: colors.lavenderSubtle },
  triggerText: { ...typography.bodyStrong, color: colors.ink },
  chevron: { ...typography.caption, color: colors.inkMuted },
  menu: {
    marginTop: 8,
    borderRadius: radius['2xl'],
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemText: { ...typography.bodyStrong, color: colors.ink },
  menuItemActive: { color: colors.violet },
  menuCheck: { ...typography.label, color: colors.violet },
  note: { ...typography.caption, color: colors.inkMuted, marginTop: 8 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  footNote: { ...typography.caption, color: colors.inkMuted, flex: 1 },
  back: {
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: radius['2xl'],
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backPressed: { backgroundColor: colors.lavenderSubtle },
  backText: { ...typography.label, color: colors.ink },
});
