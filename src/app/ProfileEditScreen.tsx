import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  Button,
  Card,
  CardContent,
  CardOverline,
  colors,
  radius,
  Screen,
  StatusBadge,
  typography,
} from '../shared/ui';
import { usePov } from '../state';
import type { RootStackParamList } from './navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileEdit'>;

/**
 * Profile-edit form (demo). Prefilled with the same dummy identity shown on
 * the profile screen. Fields are controlled; save is a no-op — wire to a
 * profile update API endpoint when available.
 */
export function ProfileEditScreen({ navigation }: Props) {
  const { pov, setPov } = usePov();
  const [name, setName] = useState('Saburo Ardiansyah');
  const [nim, setNim] = useState('2301010123');
  const [program, setProgram] = useState('Teknik Informatika');
  const [department, setDepartment] = useState('Fakultas Teknik Informatika');

  const onSave = () => {
    // ponytail: profile update is a no-op in the demo; replace with a
    // real PUT /api/profile call when the backend lands.
    navigation.goBack();
  };

  return (
    <Screen>
      <View style={styles.headRow}>
        <Text accessibilityRole="header" style={styles.title}>
          Edit Profil
        </Text>
        <StatusBadge
          label={pov === 'asisten' ? 'Asisten' : 'Praktikan'}
          tone={pov === 'asisten' ? 'violet' : 'success'}
          dot
        />
      </View>

      <Card variant="surface" interactive={false}>
        <CardContent>
          <CardOverline><Text>Identitas</Text></CardOverline>
          <View style={styles.fieldGroup}>
            <Field label="Nama Lengkap" value={name} onChange={setName} />
            <Field
              label="NIM / ID Asisten"
              value={nim}
              onChange={setNim}
              keyboardType="number-pad"
            />
            <Field label="Program Studi" value={program} onChange={setProgram} />
            <Field
              label="Fakultas"
              value={department}
              onChange={setDepartment}
            />
          </View>

          <Text style={styles.sectionGap} accessibilityRole="header">
            Peran Aktif
          </Text>
          <View style={styles.roleRow}>
            {(['praktikan', 'asisten'] as const).map((role) => (
              <Pressable
                key={role}
                accessibilityRole="button"
                accessibilityState={{ selected: pov === role }}
                onPress={() => setPov(role)}
                style={({ pressed }) => [
                  styles.roleCard,
                  pov === role && styles.roleCardActive,
                  pressed && styles.roleCardPressed,
                ]}
              >
                <Text
                  style={[
                    styles.roleCardLabel,
                    pov === role && styles.roleCardLabelActive,
                  ]}
                >
                  {role === 'praktikan' ? 'Praktikan' : 'Asisten'}
                </Text>
                {pov === role ? (
                  <Text style={styles.roleCheck} accessible={false}>
                    ✓ Aktif
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        </CardContent>
      </Card>

      <Button
        label="Simpan Perubahan"
        variant="accent"
        icon="checkmark"
        onPress={onSave}
      />
      <Button
        label="Batal"
        variant="soft"
        onPress={() => navigation.goBack()}
      />
    </Screen>
  );
}

function Field({
  label,
  value,
  onChange,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (text: string) => void;
  keyboardType?: Parameters<
    typeof TextInput
  >[0]['keyboardType'];
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={styles.fieldInput}
        keyboardType={keyboardType}
        testID={`field-${label}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: { ...typography.title, color: colors.ink },

  fieldGroup: { gap: 12 },
  field: { gap: 4 },
  fieldLabel: { ...typography.caption, color: colors.inkMuted },
  fieldInput: {
    ...typography.body,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  sectionGap: {
    ...typography.overline,
    color: colors.inkMuted,
    marginTop: 20,
    marginBottom: 8,
  },
  roleRow: { flexDirection: 'row', gap: 12 },
  roleCard: {
    flex: 1,
    gap: 4,
    padding: 14,
    borderRadius: radius['2xl'],
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  roleCardActive: {
    backgroundColor: colors.violet,
    borderColor: colors.violet,
  },
  roleCardPressed: { opacity: 0.85 },
  roleCardLabel: {
    ...typography.bodyStrong,
    color: colors.ink,
    fontSize: 14,
  },
  roleCardLabelActive: { color: colors.onPrimary },
  roleCheck: {
    ...typography.label,
    color: colors.onPrimary,
    fontWeight: '700',
  },
});
