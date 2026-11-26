import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';

import { normalizeNim, NIM_INVALID } from '../domain/nim';
import {
  Banner,
  Button,
  Screen,
  Stack,
  TextField,
  BackButton,
} from '../shared/ui';
import { useAuth } from '../state';
import type { RootStackParamList } from './navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileEdit'>;

export function ProfileEditScreen({ navigation }: Props) {
  const { user, updateUserProfile, clearError } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [nim, setNim] = useState(user?.nim ?? '');
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
    if (nim.trim() && !normalizeNim(nim)) {
      setErrorMessage(NIM_INVALID);
      return;
    }

    setSubmitting(true);
    try {
      const res = await updateUserProfile({ displayName, nim });
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
      <BackButton onPress={() => navigation.goBack()} />

      {errorMessage ? (
        <Banner
          title="Gagal memperbarui profil"
          message={errorMessage}
          tone="danger"
          onDismiss={() => setErrorMessage(null)}
        />
      ) : null}

      <Stack gap="md">
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
        <TextField
          label="NIM"
          value={nim}
          onChangeText={(text) => {
            setNim(text);
            if (errorMessage) setErrorMessage(null);
          }}
          placeholder="Nomor induk mahasiswa"
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!submitting}
          testID="field-NIM"
        />
        <TextField label="Email" value={user?.email ?? '-'} editable={false} />
        <TextField
          label="Peran (Terkunci)"
          value={roleLabel}
          editable={false}
        />
      </Stack>

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
