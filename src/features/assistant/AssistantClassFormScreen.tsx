import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Avatar,
  Banner,
  Button,
  ConfirmSheet,
  Header,
  IconButton,
  ListRow,
  Screen,
  SectionHeader,
  spacing,
  Text,
  TextField,
  TopBar,
} from '../../shared/ui';
import { useAssistantSessionsViewModel } from '../../state';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantClassForm'>;

export function AssistantClassFormScreen({ route, navigation }: Props) {
  const {
    getClassById,
    createClass,
    updateClass,
    addParticipantByEmail,
    removeParticipant,
    studentsDirectory,
  } = useAssistantSessionsViewModel();

  const classId = route.params?.classId ?? null;
  const existing = classId ? getClassById(classId) : undefined;

  const [courseCode, setCourseCode] = useState(existing?.courseCode ?? '');
  const [courseName, setCourseName] = useState(existing?.courseName ?? '');
  const [groupName, setGroupName] = useState(existing?.groupName ?? '');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingUid, setRemovingUid] = useState<string | null>(null);

  const missing = (value: string) =>
    showErrors && !value.trim() ? 'Wajib diisi' : undefined;

  const handleSubmit = async () => {
    setError(null);
    if (!courseCode.trim() || !courseName.trim() || !groupName.trim()) {
      setShowErrors(true);
      return;
    }
    const input = {
      courseCode: courseCode.trim(),
      courseName: courseName.trim(),
      groupName: groupName.trim(),
    };
    setSubmitting(true);
    try {
      const result = classId
        ? await updateClass(classId, input)
        : await createClass(input);
      if (!result.ok) {
        setError(result.message || 'Gagal menyimpan kelas');
        return;
      }
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan kelas');
    } finally {
      setSubmitting(false);
    }
  };

  const onAddParticipant = async () => {
    const value = email.trim();
    if (!value || !classId) return;
    setError(null);
    const result = await addParticipantByEmail(classId, value);
    if (!result.ok) {
      setError(result.message || 'Gagal menambahkan peserta');
      return;
    }
    setEmail('');
  };

  const onConfirmRemove = async () => {
    if (!classId || !removingUid) return;
    const uid = removingUid;
    setRemovingUid(null);
    const result = await removeParticipant(classId, uid);
    if (!result.ok) setError(result.message || 'Gagal menghapus peserta');
  };

  const removing = studentsDirectory.find((s) => s.uid === removingUid);

  return (
    <Screen withDock={false}>
      <TopBar onBack={() => navigation.goBack()} />
      <Header title={classId ? 'Edit kelas' : 'Buat kelas'} />

      <View style={styles.form}>
        <TextField
          label="Kode mata kuliah"
          value={courseCode}
          onChangeText={setCourseCode}
          placeholder="Mis. PPK-101"
          autoCapitalize="characters"
          error={missing(courseCode)}
        />
        <TextField
          label="Nama mata kuliah"
          value={courseName}
          onChangeText={setCourseName}
          placeholder="Mis. Praktikum Pemrograman"
          error={missing(courseName)}
        />
        <TextField
          label="Nama kelas / grup"
          value={groupName}
          onChangeText={setGroupName}
          placeholder="Mis. Kelas A"
          error={missing(groupName)}
        />
      </View>

      {classId && existing ? (
        <View style={styles.section}>
          <SectionHeader
            title={`Peserta · ${existing.participantIds.length}`}
          />
          {existing.participantIds.length === 0 ? (
            <Text variant="body" tone="muted">
              Belum ada peserta. Tambahkan lewat email praktikan.
            </Text>
          ) : (
            existing.participantIds.map((uid) => {
              const profile = studentsDirectory.find((s) => s.uid === uid);
              return (
                <ListRow
                  key={uid}
                  title={profile?.displayName ?? 'Profil belum termuat'}
                  meta={profile?.email}
                  leading={<Avatar name={profile?.displayName ?? '?'} />}
                  trailing={
                    <IconButton
                      icon="trash-outline"
                      variant="ghost"
                      accessibilityLabel={`Hapus ${profile?.displayName ?? 'peserta'}`}
                      onPress={() => setRemovingUid(uid)}
                    />
                  }
                />
              );
            })
          )}
          <TextField
            label="Email praktikan"
            value={email}
            onChangeText={setEmail}
            placeholder="nama@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={onAddParticipant}
            rightAccessory={
              <IconButton
                icon="person-add-outline"
                variant="soft"
                accessibilityLabel="Tambah peserta"
                disabled={!email.trim()}
                onPress={onAddParticipant}
              />
            }
          />
        </View>
      ) : null}

      {error ? <Banner tone="danger" title="Gagal" message={error} /> : null}

      <Button
        label={classId ? 'Simpan perubahan' : 'Buat kelas'}
        loading={submitting}
        disabled={submitting}
        onPress={handleSubmit}
      />

      <ConfirmSheet
        visible={removingUid !== null}
        title="Hapus peserta?"
        description={`${removing?.displayName ?? 'Peserta ini'} akan dikeluarkan dari kelas.`}
        confirmLabel="Hapus"
        tone="danger"
        onConfirm={onConfirmRemove}
        onCancel={() => setRemovingUid(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  section: { gap: spacing.sm },
});
