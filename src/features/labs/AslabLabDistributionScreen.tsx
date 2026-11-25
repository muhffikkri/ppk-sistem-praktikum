import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  assignAssistantToLabByEmail,
  assignParticipantToLabByEmail,
  moveParticipantBetweenLabs,
} from '../../services/firestore/labDistributionService';
import {
  Banner,
  Button,
  Card,
  ConfirmSheet,
  EmptyState,
  ErrorState,
  Header,
  LoadingState,
  Screen,
  SectionHeader,
  SegmentedControl,
  SelectField,
  spacing,
  Text,
  TextField,
  TopBar,
} from '../../shared/ui';
import { radius } from '../../theme/tokens';
import { useAuth } from '../../state';
import { useLabManagement } from './useLabManagement';

type Props = NativeStackScreenProps<RootStackParamList, 'AslabLabDistribution'>;

type AssignMode = 'student' | 'assistant';

export function AslabLabDistributionScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const {
    labs,
    loading,
    error,
    canManage,
    managedCourseIds,
    retry,
  } = useLabManagement();

  const initialLabId = route.params?.labId ?? labs[0]?.id ?? null;
  const [selectedLabId, setSelectedLabId] = useState<string | null>(
    initialLabId,
  );
  const [assignMode, setAssignMode] = useState<AssignMode>('student');
  const [memberEmail, setMemberEmail] = useState('');
  const [submittingMember, setSubmittingMember] = useState(false);

  const [fromLabId, setFromLabId] = useState<string | null>(null);
  const [toLabId, setToLabId] = useState<string | null>(null);
  const [studentUidToMove, setStudentUidToMove] = useState('');
  const [confirmMoveOpen, setConfirmMoveOpen] = useState(false);
  const [movingStudent, setMovingStudent] = useState(false);

  const [statusBanner, setStatusBanner] = useState<{
    tone: 'success' | 'danger';
    title: string;
    message: string;
  } | null>(null);

  const activeLabId = useMemo<string | null>(() => {
    if (selectedLabId && labs.some((l) => l.id === selectedLabId)) {
      return selectedLabId;
    }
    return labs[0]?.id ?? null;
  }, [labs, selectedLabId]);

  const effectiveFromLabId = useMemo<string | null>(() => {
    if (fromLabId && labs.some((l) => l.id === fromLabId)) return fromLabId;
    return activeLabId;
  }, [fromLabId, activeLabId, labs]);

  const effectiveToLabId = useMemo<string | null>(() => {
    if (toLabId && labs.some((l) => l.id === toLabId)) return toLabId;
    return labs.find((l) => l.id !== effectiveFromLabId)?.id ?? null;
  }, [toLabId, labs, effectiveFromLabId]);

  const labOptions = useMemo(
    () =>
      labs.map((lab) => ({
        value: lab.id,
        label: lab.courseId
          ? `${lab.name} (${lab.courseId})${lab.isActive ? '' : ' · Nonaktif'}`
          : `${lab.name}${lab.isActive ? '' : ' · Nonaktif'}`,
        description: lab.building,
      })),
    [labs],
  );

  const handleAssignMember = async () => {
    setStatusBanner(null);
    if (!canManage) {
      setStatusBanner({
        tone: 'danger',
        title: 'Akses ditolak',
        message: 'Hanya Aslab yang dapat menempatkan praktikan atau Asprak.',
      });
      return;
    }
    if (!activeLabId) {
      setStatusBanner({
        tone: 'danger',
        title: 'Lab belum dipilih',
        message: 'Pilih laboratorium tujuan terlebih dahulu.',
      });
      return;
    }
    if (!memberEmail.trim()) {
      setStatusBanner({
        tone: 'danger',
        title: 'Email wajib diisi',
        message: 'Masukkan email akun terdaftar praktikan atau Asprak.',
      });
      return;
    }

    setSubmittingMember(true);
    try {
      const res =
        assignMode === 'student'
          ? await assignParticipantToLabByEmail(
              activeLabId,
              memberEmail,
              managedCourseIds,
            )
          : await assignAssistantToLabByEmail(
              activeLabId,
              memberEmail,
              managedCourseIds,
            );

      if (!res.ok) {
        setStatusBanner({
          tone: 'danger',
          title: 'Penempatan gagal',
          message: res.message,
        });
        return;
      }

      const roleLabel = assignMode === 'student' ? 'Praktikan' : 'Asprak';
      setStatusBanner({
        tone: 'success',
        title: res.data.alreadyAssigned
          ? 'Sudah terdaftar'
          : 'Berhasil ditempatkan',
        message: res.data.alreadyAssigned
          ? `${roleLabel} sudah terdaftar pada lab tujuan (tidak ada duplikasi).`
          : `${roleLabel} berhasil dihubungkan ke lab tujuan.`,
      });
      setMemberEmail('');
    } finally {
      setSubmittingMember(false);
    }
  };

  const openMoveConfirmation = () => {
    setStatusBanner(null);
    if (!effectiveFromLabId || !effectiveToLabId) {
      setStatusBanner({
        tone: 'danger',
        title: 'Lab belum lengkap',
        message: 'Pilih lab asal dan lab tujuan yang berbeda.',
      });
      return;
    }
    if (effectiveFromLabId === effectiveToLabId) {
      setStatusBanner({
        tone: 'danger',
        title: 'Lab sama',
        message: 'Lab asal dan lab tujuan harus berbeda.',
      });
      return;
    }
    if (!studentUidToMove.trim()) {
      setStatusBanner({
        tone: 'danger',
        title: 'UID praktikan kosong',
        message: 'Masukkan UID akun praktikan yang akan dipindahkan.',
      });
      return;
    }
    setConfirmMoveOpen(true);
  };

  const handleMoveStudent = async () => {
    if (!effectiveFromLabId || !effectiveToLabId) return;
    setConfirmMoveOpen(false);
    setMovingStudent(true);
    try {
      const res = await moveParticipantBetweenLabs({
        fromLabId: effectiveFromLabId,
        toLabId: effectiveToLabId,
        studentUid: studentUidToMove.trim(),
        managedCourseIds,
      });

      if (!res.ok) {
        setStatusBanner({
          tone: 'danger',
          title: 'Pemindahan gagal',
          message: res.message,
        });
        return;
      }

      setStatusBanner({
        tone: 'success',
        title: 'Praktikan dipindahkan',
        message:
          'Keanggotaan praktikan diperbarui tanpa mengubah jadwal sesi maupun riwayat presensi.',
      });
      setStudentUidToMove('');
    } finally {
      setMovingStudent(false);
    }
  };

  if (loading) {
    return (
      <Screen withDock={false}>
        <TopBar onBack={() => navigation.goBack()} />
        <LoadingState label="Memuat data distribusi lab…" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen withDock={false}>
        <TopBar onBack={() => navigation.goBack()} />
        <ErrorState
          title="Gagal memuat laboratorium"
          message={error}
          onRetry={retry}
        />
      </Screen>
    );
  }

  return (
    <Screen withDock={false}>
      <TopBar onBack={() => navigation.goBack()} />
      <Header
        title="Distribusi & Impor Lab"
        description={
          managedCourseIds.length > 0
            ? `Cakupan mata kuliah Aslab: ${managedCourseIds.join(', ')}`
            : `Akun aktif: ${user?.displayName ?? 'Aslab'}`
        }
      />

      {statusBanner ? (
        <Banner
          tone={statusBanner.tone}
          title={statusBanner.title}
          message={statusBanner.message}
        />
      ) : null}

      {labs.length === 0 ? (
        <EmptyState
          title="Belum ada lab dalam cakupan"
          description="Buat lab terlebih dahulu sebelum menempatkan praktikan atau Asprak."
        />
      ) : (
        <>
          <Card style={styles.sectionCard}>
            <SectionHeader title="1. Pilih lab & tambah satuan (SRS-4.04–4.05)" />
            <SelectField
              label="Laboratorium tujuan"
              placeholder="Pilih laboratorium"
              value={activeLabId}
              options={labOptions}
              onChange={(val) => setSelectedLabId(val)}
            />

            <SegmentedControl<AssignMode>
              accessibilityLabel="Jenis penempatan satuan"
              value={assignMode}
              onChange={setAssignMode}
              options={[
                { value: 'student', label: 'Praktikan' },
                { value: 'assistant', label: 'Asprak' },
              ]}
            />

            <TextField
              label={
                assignMode === 'student'
                  ? 'Email akun praktikan terdaftar'
                  : 'Email akun Asprak terdaftar'
              }
              value={memberEmail}
              onChangeText={setMemberEmail}
              placeholder="nama@kampus.ac.id"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Button
              label={
                submittingMember
                  ? 'Menyimpan…'
                  : assignMode === 'student'
                    ? 'Tempatkan praktikan ke lab'
                    : 'Tugaskan Asprak ke lab'
              }
              loading={submittingMember}
              disabled={submittingMember}
              onPress={handleAssignMember}
            />
          </Card>

          <Card style={styles.sectionCard}>
            <SectionHeader title="2. Alur impor CSV terpisah (SRS-4.03–4.06)" />
            <Text variant="body" tone="muted">
              Masing-masing impor memiliki format template dan pratinjau baris
              sebelum disimpan.
            </Text>
            <View style={styles.importButtons}>
              <Button
                label="Impor Lab (CSV)"
                variant="outline"
                icon="business-outline"
                onPress={() =>
                  navigation.navigate('AslabLabImport', {
                    labId: activeLabId ?? undefined,
                    kind: 'labs',
                  })
                }
              />
              <Button
                label="Impor Praktikan (CSV)"
                variant="outline"
                icon="people-outline"
                onPress={() =>
                  navigation.navigate('AslabLabImport', {
                    labId: activeLabId ?? undefined,
                    kind: 'students',
                  })
                }
              />
              <Button
                label="Impor Asprak (CSV)"
                variant="outline"
                icon="person-add-outline"
                onPress={() =>
                  navigation.navigate('AslabLabImport', {
                    labId: activeLabId ?? undefined,
                    kind: 'assistants',
                  })
                }
              />
            </View>
          </Card>

          <Card style={styles.sectionCard}>
            <SectionHeader title="3. Pindahkan praktikan antar lab (SRS-4.06)" />
            <Text variant="body" tone="muted">
              Jadwal sesi dan riwayat presensi praktikan tetap dipertahankan.
            </Text>
            <SelectField
              label="Lab asal"
              placeholder="Pilih lab asal"
              value={effectiveFromLabId}
              options={labOptions}
              onChange={(val) => setFromLabId(val)}
            />
            <SelectField
              label="Lab tujuan"
              placeholder="Pilih lab tujuan"
              value={effectiveToLabId}
              options={labOptions}
              onChange={(val) => setToLabId(val)}
            />
            <TextField
              label="UID praktikan"
              value={studentUidToMove}
              onChangeText={setStudentUidToMove}
              placeholder="Masukkan UID akun praktikan"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Button
              label={movingStudent ? 'Memindahkan…' : 'Pindahkan praktikan'}
              variant="accent"
              icon="swap-horizontal-outline"
              loading={movingStudent}
              disabled={movingStudent}
              onPress={openMoveConfirmation}
            />
          </Card>
        </>
      )}

      <ConfirmSheet
        visible={confirmMoveOpen}
        title="Pindahkan praktikan?"
        description="Keanggotaan praktikan akan dipindahkan ke lab tujuan. Jadwal sesi dan riwayat presensi tetap dipertahankan."
        confirmLabel="Pindahkan"
        onConfirm={handleMoveStudent}
        onCancel={() => setConfirmMoveOpen(false)}
      />

      <View style={styles.footerHint}>
        <Text variant="caption" tone="muted">
          Perubahan penempatan berlaku otomatis untuk roster sesi terkait lab.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    gap: spacing.md,
    borderRadius: radius.lg,
  },
  importButtons: {
    gap: spacing.sm,
  },
  footerHint: {
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.md,
  },
});