import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import {
  Banner,
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
import { useAuth } from '../state';
import type { RootStackParamList } from './navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileEdit'>;

export function ProfileEditScreen({ navigation }: Props) {
  const { user, updateDisplayName, clearError } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAssistant = user?.role === 'assistant';
  const roleLabel = isAssistant ? 'Asisten' : 'Praktikan';

  const onSave = async () => {
    setErrorMessage(null);
    clearError();

    if (displayName.trim().length < 2) {
      setErrorMessage('Nama lengkap minimal 2 karakter.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await updateDisplayName(displayName);
      if (!res.ok) {
        setErrorMessage(res.message);
        return;
      }
      navigation.goBack();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.headRow}>
        <Text accessibilityRole="header" style={styles.title}>
          Edit Profil
        </Text>
        <StatusBadge
          label={roleLabel}
          tone={isAssistant ? 'violet' : 'success'}
          dot
        />
      </View>

      {errorMessage ? (
        <Banner
          title="Gagal memperbarui profil"
          message={errorMessage}
          tone="danger"
          onDismiss={() => setErrorMessage(null)}
        />
      ) : null}

      <Card variant="surface" interactive={false}>
        <CardContent>
          <CardOverline>
            <Text>IDENTITAS AKUN</Text>
          </CardOverline>
          <View style={styles.fieldGroup}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nama Lengkap</Text>
              <TextInput
                value={displayName}
                onChangeText={(text) => {
                  setDisplayName(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                editable={!submitting}
                style={styles.fieldInput}
                testID="field-Nama Lengkap"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.readOnlyValue}>{user?.email ?? '-'}</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Peran (Terkunci)</Text>
              <Text style={styles.readOnlyValue}>{roleLabel}</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      <Button
        label={submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
        variant="accent"
        icon="checkmark"
        loading={submitting}
        onPress={onSave}
      />
      <Button
        label="Batal"
        variant="soft"
        disabled={submitting}
        onPress={() => navigation.goBack()}
      />
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
  title: { ...typography.title, color: colors.ink },

  fieldGroup: { gap: 12 },
  field: { gap: 4 },
  fieldLabel: { ...typography.caption, color: colors.inkMuted },
  fieldInput: {
    ...typography.body,
    color: colors.ink,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  readOnlyValue: {
    ...typography.body,
    color: colors.inkMuted,
    backgroundColor: colors.disabled,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
