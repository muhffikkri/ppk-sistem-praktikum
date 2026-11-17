import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { View } from 'react-native';

import {
  Banner,
  Button,
  Screen,
  spacing,
  TextField,
  TopBar,
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
      <TopBar title="Edit profil" onBack={() => navigation.goBack()} />

      {errorMessage ? (
        <Banner
          title="Gagal memperbarui profil"
          message={errorMessage}
          tone="danger"
          onDismiss={() => setErrorMessage(null)}
        />
      ) : null}

      <View style={{ gap: spacing.md }}>
        <TextField
          label="Nama Lengkap"
          value={displayName}
          onChangeText={(text) => {
            setDisplayName(text);
            if (errorMessage) setErrorMessage(null);
          }}
          editable={!submitting}
          testID="field-Nama Lengkap"
        />
        <TextField label="Email" value={user?.email ?? '-'} editable={false} />
        <TextField
          label="Peran (Terkunci)"
          value={roleLabel}
          editable={false}
        />
      </View>

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
