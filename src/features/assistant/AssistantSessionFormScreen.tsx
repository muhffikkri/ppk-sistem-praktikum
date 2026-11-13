import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState, useEffect } from 'react';
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
  SelectField,
  typography,
} from '../../shared/ui';
import { useAssistantSessionsViewModel } from '../../state';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantSessionForm'>;

type SessionFormState = {
  classId: string;
  title?: string;
  lab?: string;
  startsAt: string;
  endsAt: string;
  submitting: boolean;
  error: string | null;
  isEditing: boolean;
};

export function AssistantSessionFormScreen({ route, navigation }: Props) {
  const {
    classes,
    getSessionById,
    createSession,
    updateSession,
    openSession,
    closeSession,
  } = useAssistantSessionsViewModel();

  const { classId: routeClassId, sessionId } = route.params ?? {};
  const existingSession = sessionId ? getSessionById(sessionId) : undefined;

  // Initial state
  const [state, setState] = useState<SessionFormState>({
    classId: routeClassId || existingSession?.classId || '',
    title: existingSession?.title ?? '',
    lab: existingSession?.lab ?? '',
    startsAt: existingSession?.startsAt ?? new Date().toISOString(),
    endsAt:
      existingSession?.endsAt ??
      new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    submitting: false,
    error: null,
    isEditing: !!sessionId,
  });

  const [activeStatus, setActiveStatus] = useState(
    existingSession?.status ?? 'scheduled',
  );

  // Edit: muat ulang saat param berubah
  useEffect(() => {
    const s = sessionId ? getSessionById(sessionId) : undefined;
    if (s) {
      setState({
        classId: s.classId || '',
        title: s.title ?? '',
        lab: s.lab ?? '',
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        submitting: false,
        error: null,
        isEditing: true,
      });
      setActiveStatus(s.status);
    }
  }, [sessionId, getSessionById]);

  const setField = <K extends keyof SessionFormState>(
    key: K,
    value: SessionFormState[K],
  ) => setState((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!state.classId) {
      setState((prev) => ({ ...prev, error: 'Pilih kelas terlebih dahulu' }));
      return;
    }
    if (
      new Date(state.endsAt).getTime() <= new Date(state.startsAt).getTime()
    ) {
      setState((prev) => ({
        ...prev,
        error: 'Waktu selesai harus setelah waktu mulai',
      }));
      return;
    }

    setState((prev) => ({ ...prev, submitting: true, error: null }));
    try {
      if (state.isEditing && sessionId) {
        const result = await updateSession(sessionId, {
          classId: state.classId,
          title: state.title,
          lab: state.lab,
          startsAt: state.startsAt,
          endsAt: state.endsAt,
        });
        if (!result.ok) {
          setState((prev) => ({ ...prev, error: result.message }));
          return;
        }
      } else {
        const result = await createSession({
          classId: state.classId,
          title: state.title,
          lab: state.lab,
          startsAt: state.startsAt,
          endsAt: state.endsAt,
        });
        if (!result.ok) {
          setState((prev) => ({ ...prev, error: result.message }));
          return;
        }
      }
      navigation.goBack();
    } catch (e: any) {
      setState((prev) => ({
        ...prev,
        error: e.message || 'Gagal menyimpan sesi',
      }));
    } finally {
      setState((prev) => ({ ...prev, submitting: false }));
    }
  };

  const onOpenSession = async () => {
    if (activeStatus === 'scheduled' && sessionId) {
      const result = await openSession(sessionId);
      if (!result.ok) {
        setState((prev) => ({
          ...prev,
          error: result.message || 'Gagal membuka sesi',
        }));
        return;
      }
      setActiveStatus('open');
    }
  };

  const onCloseSession = async () => {
    if (activeStatus === 'open' && sessionId) {
      const result = await closeSession(sessionId);
      if (!result.ok) {
        setState((prev) => ({
          ...prev,
          error: result.message || 'Gagal menutup sesi',
        }));
        return;
      }
      setActiveStatus('closed');
    }
  };

  // Date helpers
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const toLocalDateTimeInput = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
            {state.isEditing ? 'Edit Sesi' : 'Buat Sesi Baru'}
          </Text>
          <Button
            label="Batal"
            variant="soft"
            onPress={() => navigation.goBack()}
            accessibilityLabel="Batal membuat sesi"
          />
        </View>

        {/* Class Selection (editable) */}
        <View style={styles.formGroup}>
          {classes.length === 0 ? (
            <>
              <Banner
                tone="warning"
                title="Belum ada kelas"
                message="Buat kelas dulu sebelum membuat sesi."
              />
              <Button
                label="Buat kelas"
                variant="soft"
                onPress={() => navigation.navigate('AssistantClassForm', {})}
              />
            </>
          ) : (
            <SelectField
              label="Kelas"
              placeholder="Pilih kelas"
              value={state.classId || null}
              options={classes.map((c) => ({
                value: c.id,
                label: `${c.courseName} · ${c.groupName}`,
                description: `${c.participantIds.length} peserta`,
              }))}
              onChange={(id) => setField('classId', id)}
            />
          )}
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Title */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Judul/Sesi</Text>
            <TextInput
              value={state.title ?? ''}
              onChangeText={(text) => setField('title', text)}
              placeholder="Mis. Pertemuan 1: Pengenalan Firestore"
              placeholderTextColor={colors.inkMuted}
              style={styles.input}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Lab */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Lokasi Lab</Text>
            <TextInput
              value={state.lab ?? ''}
              onChangeText={(text) => setField('lab', text)}
              placeholder="Mis. Lab 3.2 RPL — Gedung B"
              placeholderTextColor={colors.inkMuted}
              style={styles.input}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Waktu Sesi */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Waktu Mulai</Text>
            <TextInput
              value={toLocalDateTimeInput(state.startsAt)}
              style={styles.input}
              placeholder="yyyy-mm-ddTHH:MM"
              placeholderTextColor={colors.inkMuted}
              // ponytail: plain text input untuk tanggal; ganti dengan datepicker saat tersedia
              onChange={(e) => {
                const v = e.nativeEvent.text;
                const t = new Date(v.replace(' ', 'T'));
                if (!isNaN(t.getTime())) setField('startsAt', t.toISOString());
              }}
            />
            <Text style={styles.timeLabel}>
              {formatDate(state.startsAt)} • {formatTime(state.startsAt)}
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Waktu Selesai</Text>
            <TextInput
              value={toLocalDateTimeInput(state.endsAt)}
              style={styles.input}
              placeholder="yyyy-mm-ddTHH:MM"
              placeholderTextColor={colors.inkMuted}
              onChange={(e) => {
                const v = e.nativeEvent.text;
                const t = new Date(v.replace(' ', 'T'));
                if (!isNaN(t.getTime())) setField('endsAt', t.toISOString());
              }}
            />
            <Text style={styles.timeLabel}>
              {formatDate(state.endsAt)} • {formatTime(state.endsAt)}
            </Text>
          </View>

          {/* Status */}
          {state.isEditing && (
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Status</Text>
              <View style={styles.statusButtons}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    activeStatus === 'scheduled'
                      ? { backgroundColor: colors.violet }
                      : { backgroundColor: colors.surface },
                  ]}
                  onPress={() => setActiveStatus('scheduled')}
                  accessibilityLabel="Status terjadwal"
                >
                  <Text
                    style={[
                      styles.statusLabel,
                      activeStatus === 'scheduled' && {
                        color: colors.onPrimary,
                      },
                    ]}
                  >
                    Terjadwal
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    activeStatus === 'open'
                      ? { backgroundColor: colors.success }
                      : { backgroundColor: colors.surface },
                  ]}
                  onPress={() => setActiveStatus('open')}
                  accessibilityLabel="Status terbuka"
                >
                  <Text
                    style={[
                      styles.statusLabel,
                      activeStatus === 'open' && { color: colors.panel },
                    ]}
                  >
                    Terbuka
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    activeStatus === 'closed'
                      ? { backgroundColor: colors.border }
                      : { backgroundColor: colors.surface },
                  ]}
                  onPress={() => setActiveStatus('closed')}
                  accessibilityLabel="Status tertutup"
                >
                  <Text
                    style={[
                      styles.statusLabel,
                      activeStatus === 'closed' && { color: colors.ink },
                    ]}
                  >
                    Tertutup
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {state.error && <Text style={styles.errorText}>{state.error}</Text>}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {state.isEditing ? (
              <>
                <TouchableOpacity
                  style={styles.button}
                  onPress={onCloseSession}
                  disabled={activeStatus !== 'open'}
                  accessibilityLabel="Tutup sesi"
                >
                  <Text style={styles.buttonText}>Tutup Sesi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  onPress={onOpenSession}
                  disabled={activeStatus !== 'scheduled'}
                  accessibilityLabel="Buka sesi"
                >
                  <Text style={styles.buttonText}>Buka Sesi</Text>
                </TouchableOpacity>
              </>
            ) : null}
            <TouchableOpacity
              style={[styles.button, state.isEditing && styles.buttonPrimary]}
              onPress={handleSubmit}
              accessibilityLabel={
                state.isEditing ? 'Simpan perubahan sesi' : 'Buat sesi baru'
              }
            >
              <Text style={styles.buttonText}>
                {state.submitting
                  ? 'Menyimpan...'
                  : state.isEditing
                    ? 'Simpan Sesi'
                    : 'Buat Sesi'}
              </Text>
            </TouchableOpacity>
          </View>
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
  inputReadonly: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 14,
    color: colors.ink,
    ...typography.body,
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
  classPicker: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  classPickerText: { ...typography.body, color: colors.ink },
  emptyClass: {
    ...typography.body,
    color: colors.inkMuted,
    fontStyle: 'italic',
  },
  timeLabel: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
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
    flexWrap: 'wrap',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radius.md,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    opacity: 0.9,
  },
  buttonPrimary: {
    backgroundColor: colors.violet,
    borderColor: colors.violet,
  },
  buttonText: {
    color: colors.ink,
    ...typography.label,
  },
});
