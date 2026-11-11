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

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantSessionForm'>;

export function AssistantSessionFormScreen({ route, navigation }: Props) {
  const {
    classes,
    getSessionById,
    createSession,
    updateSession,
    openSession,
    closeSession,
  } = useAssistantSessionsV2();

  const { classId: paramClassId, sessionId } = route.params ?? {};
  const isEditing = Boolean(sessionId);
  const existingSession = sessionId ? getSessionById(sessionId) : undefined;

  const [classId, setClassId] = useState(
    existingSession?.classId ?? paramClassId ?? classes[0]?.id ?? '',
  );
  const [title, setTitle] = useState(existingSession?.title ?? '');
  const [lab, setLab] = useState(existingSession?.lab ?? '');
  const [startsAt, setStartsAt] = useState(
    () => existingSession?.startsAt ?? new Date().toISOString(),
  );
  const [endsAt, setEndsAt] = useState(
    () =>
      existingSession?.endsAt ??
      new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  );
  const [status, setStatus] = useState<'scheduled' | 'open' | 'closed'>(
    existingSession?.status ?? 'scheduled',
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedClass = classes.find((c) => c.id === classId);

  const handleSubmit = async () => {
    setError(null);
    if (!classId) {
      setError('Pilih kelas tujuan terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { classId, title, lab, startsAt, endsAt };
      const result =
        isEditing && sessionId
          ? await updateSession(sessionId, payload)
          : await createSession(payload);

      if (!result.ok) {
        setError(result.message);
        return;
      }
      navigation.goBack();
    } finally {
      setSubmitting(false);
    }
  };

  const onOpenSession = async () => {
    if (!sessionId || status !== 'scheduled') return;
    setError(null);
    const result = await openSession(sessionId);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setStatus('open');
  };

  const onCloseSession = async () => {
    if (!sessionId || status !== 'open') return;
    setError(null);
    const result = await closeSession(sessionId);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setStatus('closed');
  };

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

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Sesi' : 'Buat Sesi Baru'}
          </Text>
          <Button
            label="Batal"
            variant="soft"
            onPress={() => navigation.goBack()}
            accessibilityLabel="Batal membuat sesi"
          />
        </View>

        {error ? (
          <View style={styles.bannerWrap}>
            <Banner
              title="Gagal memproses sesi"
              message={error}
              tone="danger"
              onDismiss={() => setError(null)}
            />
          </View>
        ) : null}

        <View style={styles.formSection}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Kelas</Text>
            <Text style={styles.formValue}>
              {selectedClass
                ? `${selectedClass.courseName} - ${selectedClass.groupName}`
                : 'Pilih kelas'}
            </Text>
            {classes.length > 0 ? (
              <View style={styles.classOptions}>
                {classes.map((cls) => {
                  const active = cls.id === classId;
                  return (
                    <TouchableOpacity
                      key={cls.id}
                      onPress={() => setClassId(cls.id)}
                      style={[
                        styles.classChip,
                        active && styles.classChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.classChipText,
                          active && styles.classChipTextActive,
                        ]}
                      >
                        {cls.courseCode} · {cls.groupName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Judul/Sesi</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Mis. Pertemuan 1: Pengenalan Firestore"
              placeholderTextColor={colors.inkMuted}
              style={styles.textInput}
              editable={!submitting}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Lokasi Lab</Text>
            <TextInput
              value={lab}
              onChangeText={setLab}
              placeholder="Mis. Lab 3.2 RPL · Gedung B"
              placeholderTextColor={colors.inkMuted}
              style={styles.textInput}
              editable={!submitting}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Waktu Mulai (ISO 8601)</Text>
            <TextInput
              value={startsAt}
              onChangeText={setStartsAt}
              style={styles.textInput}
              editable={!submitting}
            />
            <Text style={styles.timeLabel}>
              {formatDate(startsAt)} · {formatTime(startsAt)}
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Waktu Selesai (ISO 8601)</Text>
            <TextInput
              value={endsAt}
              onChangeText={setEndsAt}
              style={styles.textInput}
              editable={!submitting}
            />
            <Text style={styles.timeLabel}>
              {formatDate(endsAt)} · {formatTime(endsAt)}
            </Text>
          </View>

          {isEditing ? (
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Status</Text>
              <View style={styles.statusButtons}>
                <View
                  style={[
                    styles.statusButton,
                    {
                      backgroundColor:
                        status === 'scheduled'
                          ? colors.lavender
                          : colors.surface,
                    },
                  ]}
                >
                  <Text style={styles.statusLabel}>Terjadwal</Text>
                </View>
                <View
                  style={[
                    styles.statusButton,
                    {
                      backgroundColor:
                        status === 'open' ? colors.successSoft : colors.surface,
                    },
                  ]}
                >
                  <Text style={styles.statusLabel}>Terbuka</Text>
                </View>
                <View
                  style={[
                    styles.statusButton,
                    {
                      backgroundColor:
                        status === 'closed' ? colors.disabled : colors.surface,
                    },
                  ]}
                >
                  <Text style={styles.statusLabel}>Tertutup</Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>

        {isEditing ? (
          <View style={styles.actionButtons}>
            {status === 'open' ? (
              <TouchableOpacity
                style={styles.button}
                onPress={onCloseSession}
                accessibilityLabel="Tutup sesi"
              >
                <Text style={styles.buttonText}>Tutup Sesi</Text>
              </TouchableOpacity>
            ) : null}
            {status === 'scheduled' ? (
              <TouchableOpacity
                style={styles.button}
                onPress={onOpenSession}
                accessibilityLabel="Buka sesi"
              >
                <Text style={styles.buttonText}>Buka Sesi</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              accessibilityLabel="Simpan perubahan sesi"
            >
              <Text style={styles.buttonText}>
                {submitting ? 'Menyimpan...' : 'Simpan Sesi'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              accessibilityLabel="Buat sesi baru"
            >
              <Text style={styles.buttonText}>
                {submitting ? 'Menyimpan...' : 'Buat Sesi'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  formValue: {
    color: colors.ink,
    ...typography.body,
    marginTop: 4,
  },
  classOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  classChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
  },
  classChipActive: {
    backgroundColor: colors.violet,
    borderColor: colors.violet,
  },
  classChipText: {
    ...typography.caption,
    color: colors.ink,
  },
  classChipTextActive: {
    color: colors.onPrimary,
  },
  textInput: {
    ...typography.body,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.ink,
  },
  timeLabel: {
    ...typography.caption,
    color: colors.inkMuted,
    marginLeft: 4,
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
    flexWrap: 'wrap',
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
    color: colors.onPrimary,
    ...typography.label,
  },
});
