import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, TextInput, View, TouchableOpacity, Text } from 'react-native';
import { ScrollView } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  colors,
  radius,
  Screen,
  Button,
  StatusBadge,
  typography,
  Input,
} from '../../shared/ui';
import { useAssistantSessionsViewModel } from '../../state';
import { ClassInput } from '../../domain/types';
import { createClass, updateClass, removeParticipant, addParticipantByEmail } from '../../services/firestore/assistantService';
import { formatSessionDate } from './formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantClassForm'>;

type ClassFormState = {
  courseCode: string;
  courseName: string;
  groupName: string;
  submitting: boolean;
  error: string | null;
  classId: string | null;
};

export function AssistantClassFormScreen({ navigation }: Props) {
  const {
    classes,
    getClassById,
    addParticipantByEmail,
    removeParticipant,
  } = useAssistantSessionsViewModel();

  // Extract route param
  const route = navigation.getCurrentRoute();
  const classId = route?.params?.classId ?? null;

  // Initial state
  const [state, setState] = React.useState<ClassFormState>({
    courseCode: '',
    courseName: '',
    groupName: '',
    submitting: false,
    error: null,
    classId: classId,
  });

  // Fetch existing class data if editing
  React.useEffect(() => {
    if (classId && getClassById) {
      const cls = getClassById(classId);
      if (cls) {
        setState({
          ...state,
          courseCode: cls.courseCode || '',
          courseName: cls.courseName || '',
          groupName: cls.groupName || '',
        });
      }
    }
  }, [classId, getClassById]);

  const handleSubmit = async () => {
    setState({ ...state, submitting: true, error: null });

    try {
      if (state.classId) {
        // Update existing class
        await updateStateClass(state.classId, {
          courseCode: state.courseCode,
          courseName: state.courseName,
          groupName: state.groupName,
        });
      } else {
        // Create new class
        await createClass({
          courseCode: state.courseCode,
          courseName: state.courseName,
          groupName: state.groupName,
        });
      }
      navigation.goBack();
    } catch (e: any) {
      setState({ ...state, error: e.message || 'Gagal menyimpan kelas' });
    } finally {
      setState({ ...state, submitting: false });
    }
  };

  const updateStateClass = async (id: string, input: ClassInput) => {
    const result = await updateClass(id, input);
    if (!result.ok) {
      throw new Error(result.message || 'Gagal update kelas');
    }
  };

  const onAddParticipant = async () => {
    const email = window.prompt('Masukkan email praktikan:');
    if (email) {
      const result = await addParticipantByEmail(state.classId || '', email);
      if (!result.ok) {
        setState({ ...state, error: result.message || 'Gagal menambahkan peserta' });
      }
    }
  };

  const onRemoveParticipant = async (uid: string) => {
    const result = await removeParticipant(state.classId || '', uid);
    if (!result.ok) {
      setState({ ...state, error: result.message || 'Gagal menghapus peserta' });
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {state.classId ? 'Edit Kelas' : 'Tambah Kelas'}
          </Text>
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
            <Input
              value={state.courseCode}
              onChangeText={ (text: string) => setState({ ...state, courseCode: text }) }
              placeholder="Mis. PPK-101"
              clearButtonMode="while-editing"
            />
          </View>

          {/* Course Name */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nama Mata Kuliah</Text>
            <Input
              value={state.courseName}
              onChangeText={ (text: string) => setState({ ...state, courseName: text }) }
              placeholder="Mis. Praktikum Sistem Terdistribusi"
              clearButtonMode="while-editing"
            />
          </View>

          {/* Group Name */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nama Kelas/Group</Text>
            <Input
              value={state.groupName}
              onChangeText={ (text: string) => setState({ ...state, groupName: text }) }
              placeholder="Mis. Kelas A"
              clearButtonMode="while-editing"
            />
          </View>

          {/* Participants Section */}
          {state.classId && (
            <View style={styles.participantsSection}>
              <Text style={styles.sectionTitle}>Peserta Terdaftar</Text>
              {classes?.length > 0 && classes.some((c) => c.id === state.classId)
                ? (classes as any[])
                    .filter((c) => c.id === state.classId)[0]
                    .participantIds?.map((uid: string, i: number) => (
                      <View key={uid} style={styles.participantItem}>
                        <Text style={styles.participantName}>Peserta {i + 1}</Text>
                        <Button
                          label="Hapus"
                          variant="danger"
                          size="small"
                          onPress={() => onRemoveParticipant(uid)}
                          accessibilityLabel="Hapus peserta"
                        />
                      </View>
                    ))
                : (
                  <Text style={styles.emptyText}>Tidak ada data peserta</Text>
                )}
              <TouchableOpacity
                style={styles.addParticipantBtn}
                onPress={onAddParticipant}
                accessibilityLabel="Tambah peserta baru"
              >
                <Text style={styles.addParticipantText}>+ Tambah Peserta</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <View style={styles.submitButtonWrapper}>
          <Button
            label={state.classId ? 'Perbarui Kelas' : 'Buat Kelas'}
            disabled={state.submitting}
            variant={state.submitting ? 'secondary' : 'accent'}
            loading={state.submitting}
            onPress={handleSubmit}
            accessibilityLabel={state.classId ? 'Perbarui kelas' : 'Buat kelas baru'}
          >
            {state.submitting ? 'Menyimpan...' : `${state.classId ? 'Perbarui' : 'Buat'} Kelas`}
          </Button>
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
  participantsSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    ...typigraphy.caption,
    color: colors.inkMuted,
    marginBottom: 12,
  },
  emptyText: { color: colors.inkMuted, fontStyle: 'italic' },
  addParticipantBtn: {
    borderWidth: 1,
    borderColor: colors.violet,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addParticipantText: { color: colors.violet, ...typography.label },
  submitButtonWrapper: {
    marginTop: 24,
    alignSelf: 'flex-end',
  },
});