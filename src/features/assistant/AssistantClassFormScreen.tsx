import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Banner,
  Button,
  colors,
  radius,
  Screen,
  typography,
} from '../../shared/ui';
import { useAssistantSessionsV2 } from '../../state';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantClassForm'>;

export function AssistantClassFormScreen({ route, navigation }: Props) {
  const {
    classes,
    studentsDirectory,
    getClassById,
    createClass,
    updateClass,
    addParticipantByEmail,
    removeParticipant,
  } = useAssistantSessionsV2();

  const classId = route.params?.classId ?? null;
  const existingClass = classId ? getClassById(classId) : undefined;

  const [courseCode, setCourseCode] = useState(existingClass?.courseCode ?? '');
  const [courseName, setCourseName] = useState(existingClass?.courseName ?? '');
  const [groupName, setGroupName] = useState(existingClass?.groupName ?? '');
  const [participantEmail, setParticipantEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentClass = classId
    ? (classes.find((c) => c.id === classId) ?? existingClass)
    : undefined;

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const payload = { courseCode, courseName, groupName };
      const result = classId
        ? await updateClass(classId, payload)
        : await createClass(payload);

      if (!result.ok) {
        setError(result.message);
        return;
      }
      navigation.goBack();
    } finally {
      setSubmitting(false);
    }
  };

  const onAddParticipant = async () => {
    if (!classId) return;
    setError(null);
    const result = await addParticipantByEmail(classId, participantEmail);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setParticipantEmail('');
  };

  const onRemoveParticipant = async (uid: string) => {
    if (!classId) return;
    setError(null);
    const result = await removeParticipant(classId, uid);
    if (!result.ok) {
      setError(result.message);
    }
  };

  const resolveStudentLabel = (uid: string, index: number) => {
    const match = studentsDirectory.find((s) => s.uid === uid);
    return match
      ? `${match.displayName} (${match.email})`
      : `Peserta ${index + 1}`;
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {classId ? 'Edit Kelas' : 'Tambah Kelas'}
          </Text>
          <Button
            label="Batal"
            variant="soft"
            onPress={() => navigation.goBack()}
            accessibilityLabel="Batal membuat kelas"
          />
        </View>

        {error ? (
          <View style={styles.bannerWrap}>
            <Banner
              title="Gagal memproses kelas"
              message={error}
              tone="danger"
              onDismiss={() => setError(null)}
            />
          </View>
        ) : null}

        <View style={styles.formSection}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Kode Mata Kuliah</Text>
            <TextInput
              value={courseCode}
              onChangeText={setCourseCode}
              placeholder="Mis. PPK-101"
              placeholderTextColor={colors.inkMuted}
              style={styles.textInput}
              editable={!submitting}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nama Mata Kuliah</Text>
            <TextInput
              value={courseName}
              onChangeText={setCourseName}
              placeholder="Mis. Praktikum Sistem Terdistribusi"
              placeholderTextColor={colors.inkMuted}
              style={styles.textInput}
              editable={!submitting}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nama Kelas/Group</Text>
            <TextInput
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Mis. Kelas A"
              placeholderTextColor={colors.inkMuted}
              style={styles.textInput}
              editable={!submitting}
            />
          </View>

          {classId ? (
            <View style={styles.participantsSection}>
              <Text style={styles.sectionTitle}>Peserta Terdaftar</Text>
              {currentClass?.participantIds?.length ? (
                currentClass.participantIds.map((uid, i) => (
                  <View key={uid} style={styles.participantItem}>
                    <Text style={styles.participantName}>
                      {resolveStudentLabel(uid, i)}
                    </Text>
                    <Button
                      label="Hapus"
                      variant="destructive"
                      onPress={() => onRemoveParticipant(uid)}
                      accessibilityLabel="Hapus peserta"
                    />
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Tidak ada data peserta</Text>
              )}

              <View style={styles.addParticipantRow}>
                <TextInput
                  value={participantEmail}
                  onChangeText={setParticipantEmail}
                  placeholder="Email praktikan..."
                  placeholderTextColor={colors.inkMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.participantInput}
                />
                <TouchableOpacity
                  style={styles.addParticipantBtn}
                  onPress={onAddParticipant}
                  accessibilityLabel="Tambah peserta baru"
                >
                  <Text style={styles.addParticipantText}>+ Tambah</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.submitButtonWrapper}>
          <Button
            label={
              submitting
                ? 'Menyimpan...'
                : classId
                  ? 'Perbarui Kelas'
                  : 'Buat Kelas'
            }
            disabled={submitting}
            variant={submitting ? 'soft' : 'accent'}
            loading={submitting}
            onPress={handleSubmit}
            accessibilityLabel={classId ? 'Perbarui kelas' : 'Buat kelas baru'}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 24,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    ...typography.display,
    color: colors.ink,
    letterSpacing: -1,
  },
  bannerWrap: {
    marginBottom: 16,
  },
  formSection: {
    gap: 20,
  },
  formGroup: {
    flexDirection: 'column',
    gap: 8,
  },
  formLabel: {
    ...typography.caption,
    color: colors.inkMuted,
    marginBottom: 4,
  },
  textInput: {
    ...typography.body,
    color: colors.ink,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  participantsSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    marginTop: 16,
    gap: 10,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.inkMuted,
    marginBottom: 4,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  participantName: {
    ...typography.body,
    color: colors.ink,
    flex: 1,
  },
  emptyText: { color: colors.inkMuted, fontStyle: 'italic' },
  addParticipantRow: {
    gap: 8,
    marginTop: 8,
  },
  participantInput: {
    ...typography.body,
    color: colors.ink,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addParticipantBtn: {
    borderWidth: 1,
    borderColor: colors.violet,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  addParticipantText: { color: colors.violet, ...typography.label },
  submitButtonWrapper: {
    marginTop: 24,
    alignSelf: 'flex-end',
  },
});
