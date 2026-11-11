import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  colors,
  radius,
  Screen,
  Button,
  typography,
} from '../../shared/ui';
import { useAssistantSessionsViewModel } from '../../state';
import type { ClassInput } from '../../domain/types';
import {
  createClass,
  updateClass,
  removeParticipant,
  addParticipantByEmail,
} from '../../services/firestore/assistantService';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantClassForm'>;

type ClassFormState = {
  courseCode: string;
  courseName: string;
  groupName: string;
  submitting: boolean;
  error: string | null;
};

export function AssistantClassFormScreen({ route, navigation }: Props) {
  const { getClassById } = useAssistantSessionsViewModel();

  const classId = route.params?.classId ?? null;
  const existingClass = classId ? getClassById(classId) : undefined;

  const [state, setState] = useState<ClassFormState>({
    courseCode: existingClass?.courseCode ?? '',
    courseName: existingClass?.courseName ?? '',
    groupName: existingClass?.groupName ?? '',
    submitting: false,
    error: null,
  });

  const [participantEmail, setParticipantEmail] = useState('');

  // Edit: muat ulang saat param berubah
  useEffect(() => {
    const cls = classId ? getClassById(classId) : undefined;
    if (cls) {
      setState({
        courseCode: cls.courseCode || '',
        courseName: cls.courseName || '',
        groupName: cls.groupName || '',
        submitting: false,
        error: null,
      });
    }
  }, [classId, getClassById]);

  const setField = <K extends keyof ClassFormState>(key: K, value: ClassFormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!state.courseCode.trim() || !state.courseName.trim() || !state.groupName.trim()) {
      setState((prev) => ({ ...prev, error: 'Semua field wajib diisi' }));
      return;
    }

    setState((prev) => ({ ...prev, submitting: true, error: null }));
    try {
      const input: ClassInput = {
        courseCode: state.courseCode.trim(),
        courseName: state.courseName.trim(),
        groupName: state.groupName.trim(),
      };

      if (classId) {
        const result = await updateClass(classId, input);
        if (!result.ok) {
          setState((prev) => ({ ...prev, error: result.message || 'Gagal memperbarui kelas' }));
          return;
        }
      } else {
        const result = await createClass(input);
        if (!result.ok) {
          setState((prev) => ({ ...prev, error: result.message || 'Gagal membuat kelas' }));
          return;
        }
      }
      navigation.goBack();
    } catch (e: any) {
      setState((prev) => ({ ...prev, error: e.message || 'Gagal menyimpan kelas' }));
    } finally {
      setState((prev) => ({ ...prev, submitting: false }));
    }
  };

  const onAddParticipant = async () => {
    const email = participantEmail.trim();
    if (!email || !classId) return;
    const result = await addParticipantByEmail(classId, email);
    if (!result.ok) {
      setState((prev) => ({ ...prev, error: result.message || 'Gagal menambahkan peserta' }));
      return;
    }
    setParticipantEmail('');
  };

  const onRemoveParticipant = (uid: string) => {
    if (!classId) return;
    Alert.alert('Hapus Peserta', 'Yakin hapus peserta dari kelas ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          const result = await removeParticipant(classId, uid);
          if (!result.ok) {
            setState((prev) => ({ ...prev, error: result.message || 'Gagal menghapus peserta' }));
          }
        },
      },
    ]);
  };

  const selectedClass = classId ? getClassById(classId) : undefined;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{classId ? 'Edit Kelas' : 'Tambah Kelas'}</Text>
          <Button
            label="Batal"
            variant="soft"
            onPress={() => navigation.goBack()}
            accessibilityLabel="Batal membuat kelas"
          />
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Course Code */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Kode Mata Kuliah</Text>
            <TextInput
              value={state.courseCode}
              onChangeText={(text) => setField('courseCode', text)}
              placeholder="Mis. PPK-101"
              placeholderTextColor={colors.inkMuted}
              style={styles.input}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Course Name */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nama Mata Kuliah</Text>
            <TextInput
              value={state.courseName}
              onChangeText={(text) => setField('courseName', text)}
              placeholder="Mis. Praktikum Sistem Terdistribusi"
              placeholderTextColor={colors.inkMuted}
              style={styles.input}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Group Name */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nama Kelas/Group</Text>
            <TextInput
              value={state.groupName}
              onChangeText={(text) => setField('groupName', text)}
              placeholder="Mis. Kelas A"
              placeholderTextColor={colors.inkMuted}
              style={styles.input}
              clearButtonMode="while-editing"
            />
          </View>

          {state.error && <Text style={styles.errorText}>{state.error}</Text>}
        </View>

        {/* Participants Section */}
        {classId && selectedClass && (
          <View style={styles.participantsSection}>
            <Text style={styles.sectionTitle}>Peserta Terdaftar</Text>
            {selectedClass.participantIds.length > 0 ? (
              selectedClass.participantIds.map((uid: string, i: number) => (
                <View key={uid} style={styles.participantItem}>
                  <Text style={styles.participantName}>{`Peserta ${i + 1} (${uid})`}</Text>
                  <Button
                    label="Hapus"
                    variant="destructive"
                    onPress={() => onRemoveParticipant(uid)}
                    accessibilityLabel="Hapus peserta"
                  />
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Tidak ada peserta terdaftar</Text>
            )}

            <View style={styles.addParticipantRow}>
              <TextInput
                value={participantEmail}
                onChangeText={setParticipantEmail}
                placeholder="email@mahasiswa.ac.id"
                placeholderTextColor={colors.inkMuted}
                style={styles.emailInput}
                keyboardType="email-address"
                autoCapitalize="none"
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
        )}

        {/* Submit Button */}
        <View style={styles.submitButtonWrapper}>
          <Button
            label={state.submitting ? 'Menyimpan...' : classId ? 'Perbarui Kelas' : 'Buat Kelas'}
            variant={classId ? 'primary' : 'accent'}
            disabled={state.submitting}
            loading={state.submitting}
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
    backgroundColor: colors.surface,
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
  formSection: {
    gap: 16,
  },
  formGroup: {
    flexDirection: 'column',
    gap: 8,
  },
  formLabel: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  input: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 14,
    color: colors.ink,
    ...typography.body,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
  },
  participantsSection: {
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.inkMuted,
    marginBottom: 12,
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  participantName: {
    ...typography.body,
    color: colors.ink,
    flexShrink: 1,
  },
  emptyText: {
    ...typography.body,
    color: colors.inkMuted,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  addParticipantRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  emailInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.ink,
    ...typography.body,
  },
  addParticipantBtn: {
    borderWidth: 1,
    borderColor: colors.violet,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  addParticipantText: { color: colors.violet, ...typography.label },
  submitButtonWrapper: {
    marginTop: 24,
  },
});
