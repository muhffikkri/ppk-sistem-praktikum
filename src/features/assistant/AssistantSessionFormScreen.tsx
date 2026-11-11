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
} from '../../shared/ui';
import { useAssistantSessionsViewModel } from '../../state';
import { SessionInput } from '../../domain/types';
import { createSession, updateSession, openSession, closeSession } from '../../services/firestore/assistantService';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantSessionForm'>;

type SessionFormState = {
  classId: string;
  title?: string;
  lab?: string;
  startsAt: string;
  endsAt: string;
  status: 'scheduled' | 'open' | 'closed';
  submitting: boolean;
  error: string | null;
  isEditing: boolean;
  sessionId?: string;
};

export function AssistantSessionFormScreen({ navigation }: Props) {
  const {
    classes,
    getClassById,
    createSession,
    updateSession,
    openSession,
    closeSession,
  } = useAssistantSessionsViewModel();

  // Extract route params
  const route = navigation.getCurrentRoute();
  const { classId: routeClassId, sessionId } = route?.params ?? {};

  // Initial state
  const [state, setState] = React.useState<SessionFormState>({
    classId: routeClassId || '',
    title: '',
    lab: '',
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    status: 'scheduled',
    submitting: false,
    error: null,
    isEditing: !!sessionId,
  });

  // Fetch class data for validation/defaults
  React.useEffect(() => {
    if (state.classId && getClassById) {
      const cls = getClassById(state.classId);
      if (cls) {
        // Class exists, can use its data
      }
    }
  }, [state.classId, getClassById]);

  // If editing, fetch existing session data
  React.useEffect(() => {
    if (sessionId && isEditing) {
      const now = new Date();
      setState({
        ...state,
        startsAt: now.toISOString(),
        endsAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      });
    }
  }, [sessionId, isEditing]);

  const handleSubmit = async () => {
    setState({ ...state, submitting: true, error: null });

    try {
      if (state.isEditing && state.sessionId) {
        await updateSession(state.sessionId, {
          classId: state.classId,
          title: state.title,
          lab: state.lab,
          startsAt: state.startsAt,
          endsAt: state.endsAt,
        });
      } else {
        await createSession({
          classId: state.classId,
          title: state.title,
          lab: state.lab,
          startsAt: state.startsAt,
          endsAt: state.endsAt,
        });
      }
      navigation.goBack();
    } catch (e: any) {
      setState({ ...state, error: e.message || 'Gagal menyimpan sesi' });
    } finally {
      setState({ ...state, submitting: false });
    }
  };

  const onOpenSession = async () => {
    if (state.status === 'scheduled') {
      const result = await openSession(state.sessionId || '');
      if (!result.ok) {
        setState({ ...state, error: result.message || 'Gagal membuka sesi' });
      }
    }
  };

  const onCloseSession = async () => {
    if (state.status === 'open') {
      const result = await closeSession(state.sessionId || '');
      if (!result.ok) {
        setState({ ...state, error: result.message || 'Gagal menutup sesi' });
      }
    }
  };

  // Date helpers
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {state.isEditing ? 'Edit Sesi' : 'Buat Sesi Baru'}
          </Text>
          <Button
            label="Batal"
            variant="soft"
            onPress={() => navigation.goBack()}
            accessibilityLabel="Batal membuat sesi"
          />
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Class Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Kelas</Text>
            <Text style={styles.formValue}>
              {classes?.length > 0
                ? classes
                    .filter((c: any) => c.id === state.classId)
                    .map((c: any) => c.courseName + ' - ' + c.groupName)[0]
                  : 'Pilih kelas'}
            </Text>
          </View>

          {/* Title */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Judul/Sesi</Text>
            <Input
              value={state.title ?? ''}
              onChangeText={ (text: string) => setState({ ...state, title: text }) }
              placeholder="Mis. Pertemuan 1: Pengenalan Firestore"
              clearButtonMode="while-editing"
            />
          </View>

          {/* Lab */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Lokasi Lab</Text>
            <Input
              value={state.lab ?? ''}
              onChangeText={ (text: string) => setState({ ...state, lab: text }) }
              placeholder="Mis. Lab 3.2 RPL · Gedung B"
              clearButtonMode="while-editing"
            />
          </View>

          {/* Waktu Sesi */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Waktu Mulai</Text>
            <TextInput
              value={formatDate(state.startsAt)}
              style={styles.inputReadonly}
              disabled
            />
            <Text style={styles.timeLabel}>{formatTime(state.startsAt)}</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Waktu Selesai</Text>
            <TextInput
              value={formatDate(state.endsAt)}
              style={styles.inputReadonly}
              disabled
            />
            <Text style={styles.timeLabel}>{formatTime(state.endsAt)}</Text>
          </View>

          {/* Status */}
          {state.isEditing && (
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Status</Text>
              <View style={styles.statusButtons}>
                <TouchableOpacity
                  style={[{ ...styles.statusButton, backgroundColor: state.status === 'scheduled' ? colors.violet : colors.surface }]}
                  onPress={() => setState({ ...state, status: 'scheduled' })}
                  accessibilityLabel="Status terjadwal"
                >
                  <Text style={styles.statusLabel}>Terjadwal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[{ ...styles.statusButton, backgroundColor: state.status === 'open' ? colors.green : colors.surface }]}
                  onPress={() => setState({ ...state, status: 'open' })}
                  accessibilityLabel="Status terbuka"
                >
                  <Text style={styles.statusLabel}>Terbuka</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[{ ...styles.statusButton, backgroundColor: state.status === 'closed' ? colors.gray : colors.surface }]}
                  onPress={() => setState({ ...state, status: 'closed' })}
                  accessibilityLabel="Status tertutup"
                >
                  <Text style={styles.statusLabel}>Tertutup</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {state.isEditing ? (
              <>
                <TouchableOpacity
                  style={styles.button}
                  onPress={onCloseSession}
                  accessibilityLabel="Tutup sesi"
                >
                  <Text style={styles.buttonText}>Tutup Sesi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  onPress={onOpenSession}
                  accessibilityLabel="Buka sesi"
                >
                  <Text style={styles.buttonText}>Buka Sesi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleSubmit}
                  accessibilityLabel="Simpan perubahan sesi"
                >
                  <Text style={styles.buttonText}>{state.submitting ? 'Menyimpan...' : 'Simpan Sesi'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.button}
                onPress={handleSubmit}
                accessibilityLabel="Buat sesi baru"
              >
                <Text style={styles.buttonText}>{state.submitting ? 'Menyimpan...' : 'Buat Sesi'}</Text>
              </TouchableOpacity>
            )}
          </View>
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
  formValue: {
    color: colors.ink,
    ...typography.body,
    marginTop: 4,
  },
  inputReadonly: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 14,
    color: colors.ink,
  },
  timeLabel: {
    ...typography.caption,
    color: colors.inkMuted,
    marginLeft: 8,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  statusButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  statusLabel: { ...typography.caption, color: colors.ink },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    alignItems: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radius.md,
    backgroundColor: colors.violet,
    elevation: 2,
  },
  buttonText: {
    color: colors.onViolet,
    ...typography.label,
  },
});