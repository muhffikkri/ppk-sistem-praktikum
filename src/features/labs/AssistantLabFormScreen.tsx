import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import { canManageLabMaster } from '../../domain/asprakScope';
import {
  DEFAULT_RADIUS_METERS,
  hasLabInputErrors,
  MAX_RADIUS_METERS,
  MIN_RADIUS_METERS,
  parseCoordinate,
  validateLabInput,
} from '../../domain/geofenceRules';
import type { Lab, LabInput, LabInputErrors } from '../../domain/geoTypes';
import { DEFAULT_TOLERANCE_MINUTES } from '../../domain/lateToleranceRules';
import {
  Banner,
  Button,
  ConfirmSheet,
  ErrorState,
  Screen,
  SkeletonList,
  SelectField,
  SectionHeader,
  SegmentedControl,
  spacing,
  Text,
  TextField,
  BackButton,
} from '../../shared/ui';
import { colors, radius as tokenRadius } from '../../theme/tokens';
import { getCurrentDeviceLocation } from '../../services/location/deviceLocationService';
import { useAuth } from '../../state';
import { LabAccessDenied } from './LabAccessDenied';
import { LabLocationPickerModal } from './LabLocationPickerModal';
import {
  useLabManagement,
  type LabManagementViewModel,
} from './useLabManagement';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantLabForm'>;

type ActiveValue = 'active' | 'inactive';

const coordText = (value: number | undefined) =>
  value !== undefined && Number.isFinite(value) ? String(value) : '';

export function AssistantLabFormScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const {
    getLabById,
    saveLab,
    removeLab,
    setLabActiveStatus,
    saving,
    deletingId,
    togglingId,
    loading,
    error,
    retry,
  } = useLabManagement();

  const labId = route.params?.labId ?? null;
  const existing = labId ? getLabById(labId) : undefined;
  const managedCourseIds = user?.managedCourseIds ?? [];
  const courseForbidden =
    existing && !managedCourseIds.includes(existing.courseId ?? '');

  if (
    !canManageLabMaster(user?.role) ||
    !managedCourseIds.length ||
    courseForbidden
  ) {
    return (
      <LabAccessDenied
        onBack={() => navigation.goBack()}
        message="Hanya Aslab yang ditugaskan pada mata kuliah lab ini yang dapat mengelolanya."
      />
    );
  }

  if (labId && !existing) {
    return (
      <Screen withDock={false}>
        <BackButton onPress={() => navigation.goBack()} />
        {loading ? (
          <SkeletonList variant="card" count={2} label="Memuat laboratorium…" />
        ) : (
          <ErrorState
            title={
              error
                ? 'Gagal memuat laboratorium'
                : 'Laboratorium tidak ditemukan'
            }
            message={error ?? 'Lab mungkin sudah dihapus oleh asisten lain.'}
            onRetry={error ? retry : undefined}
          />
        )}
      </Screen>
    );
  }

  return (
    <LabForm
      // Remount saat data lab tiba agar nilai awal form terisi.
      key={existing?.id ?? 'new'}
      labId={labId}
      existing={existing}
      managedCourseIds={managedCourseIds}
      saving={saving}
      deleting={deletingId !== null}
      toggling={togglingId !== null}
      onSave={saveLab}
      onDelete={removeLab}
      onSetActive={setLabActiveStatus}
      onDone={() => navigation.goBack()}
    />
  );
}

type LabFormProps = {
  labId: string | null;
  existing: Lab | undefined;
  managedCourseIds: string[];
  saving: boolean;
  deleting: boolean;
  toggling: boolean;
  onSave: LabManagementViewModel['saveLab'];
  onDelete: LabManagementViewModel['removeLab'];
  onSetActive: LabManagementViewModel['setLabActiveStatus'];
  onDone: () => void;
};

function LabForm({
  labId,
  existing,
  managedCourseIds,
  saving,
  deleting,
  toggling,
  onSave,
  onDelete,
  onSetActive,
  onDone,
}: LabFormProps) {
  const [name, setName] = useState(existing?.name ?? '');
  const [courseId, setCourseId] = useState(
    existing?.courseId ??
      (managedCourseIds.length === 1 ? managedCourseIds[0] : null),
  );
  const [building, setBuilding] = useState(existing?.building ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [latitude, setLatitude] = useState(
    coordText(existing?.location.latitude),
  );
  const [longitude, setLongitude] = useState(
    coordText(existing?.location.longitude),
  );
  const [radius, setRadius] = useState(
    String(existing?.radiusMeters ?? DEFAULT_RADIUS_METERS),
  );
  const [tolerance, setTolerance] = useState(
    String(existing?.lateToleranceMinutes ?? DEFAULT_TOLERANCE_MINUTES),
  );
  const [active, setActive] = useState<ActiveValue>(
    existing?.isActive === false ? 'inactive' : 'active',
  );
  const [errors, setErrors] = useState<LabInputErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [labInUsePrompt, setLabInUsePrompt] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [locating, setLocating] = useState(false);

  const busy = saving || deleting || toggling;

  const handleUseGPS = async () => {
    setLocating(true);
    try {
      const res = await getCurrentDeviceLocation();
      if (res.ok && res.fix) {
        setLatitude(res.fix.latitude.toFixed(6));
        setLongitude(res.fix.longitude.toFixed(6));
      }
    } finally {
      setLocating(false);
    }
  };

  const buildInput = (): LabInput => ({
    name,
    building,
    description,
    courseId,
    courseCode: existing?.courseCode,
    latitude: parseCoordinate(latitude),
    longitude: parseCoordinate(longitude),
    radiusMeters: Number(radius.trim()),
    lateToleranceMinutes: tolerance.trim() ? Number(tolerance) : Number.NaN,
    isActive: active === 'active',
  });

  const handleSubmit = async () => {
    setSubmitError(null);
    setLabInUsePrompt(null);
    const input = buildInput();
    const nextErrors = validateLabInput(input);
    if (!courseId || !managedCourseIds.includes(courseId)) {
      nextErrors.courseId = 'Pilih mata kuliah yang ditugaskan kepada Anda.';
    }
    setErrors(nextErrors);
    if (hasLabInputErrors(nextErrors)) return;

    const result = await onSave(labId, input);
    if (!result.ok) {
      setSubmitError(result.message || 'Gagal menyimpan laboratorium');
      return;
    }
    onDone();
  };

  const handleDelete = async () => {
    if (!labId) return;
    setConfirmDelete(false);
    setSubmitError(null);
    setLabInUsePrompt(null);

    const result = await onDelete(labId);
    if (!result.ok) {
      if (result.reason === 'lab_in_use') {
        setLabInUsePrompt(
          result.message ||
            'Lab ini masih digunakan oleh sesi. Nonaktifkan lab agar riwayat sesi dan presensi tetap aman.',
        );
        return;
      }
      setSubmitError(result.message || 'Gagal menghapus laboratorium');
      return;
    }
    onDone();
  };

  const handleDeactivateInstead = async () => {
    if (!labId) return;
    setSubmitError(null);
    const result = await onSetActive(labId, false);
    if (!result.ok) {
      setSubmitError(result.message || 'Gagal menonaktifkan laboratorium');
      return;
    }
    setActive('inactive');
    setLabInUsePrompt(null);
    onDone();
  };

  return (
    <Screen withDock={false}>
      <BackButton onPress={onDone} />

      <View style={styles.form}>
        {existing ? (
          <Text variant="label">
            Mata kuliah {existing.courseCode || courseId}
          </Text>
        ) : (
          <SelectField
            label="Mata kuliah"
            options={managedCourseIds.map((id) => ({ value: id, label: id }))}
            value={courseId}
            onChange={setCourseId}
            placeholder="Pilih mata kuliah"
            error={errors.courseId}
          />
        )}
        <TextField
          label="Nama laboratorium"
          value={name}
          onChangeText={setName}
          placeholder="Mis. Lab RPL"
          error={errors.name}
        />
        <TextField
          label="Gedung / ruang"
          value={building}
          onChangeText={setBuilding}
          placeholder="Mis. Gedung B lt. 3"
          error={errors.building}
        />
        <TextField
          label="Keterangan (opsional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Mis. Masuk lewat pintu timur"
          multiline
        />
      </View>

      <View style={styles.form}>
        <SectionHeader title="Titik lokasi" />
        <Text variant="body" tone="muted">
          Pilih lokasi lab langsung di peta atau gunakan lokasi saat ini. Anda
          juga dapat mengetik koordinat manual di bawah.
        </Text>

        <View style={styles.pickerActions}>
          <Button
            label="Pilih Titik di Peta"
            variant="accent"
            icon="map-outline"
            onPress={() => setPickerVisible(true)}
          />
          <Button
            label={locating ? 'Membaca GPS…' : 'Gunakan Lokasi Saat Ini'}
            variant="outline"
            icon="locate-outline"
            loading={locating}
            disabled={locating}
            onPress={handleUseGPS}
          />
        </View>

        {Boolean(latitude && longitude) && (
          <View style={styles.coordPreviewBox}>
            <Text variant="caption" tone="violet">
              Titik Terpilih: {latitude}, {longitude}
            </Text>
          </View>
        )}

        <TextField
          label="Latitude"
          value={latitude}
          onChangeText={setLatitude}
          placeholder="Mis. -6.917500"
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.latitude}
        />
        <TextField
          label="Longitude"
          value={longitude}
          onChangeText={setLongitude}
          placeholder="Mis. 107.619100"
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.longitude}
        />
        <TextField
          label="Radius presensi (meter)"
          value={radius}
          onChangeText={setRadius}
          placeholder={String(DEFAULT_RADIUS_METERS)}
          keyboardType="number-pad"
          hint={`Praktikan harus berada dalam radius ini. ${MIN_RADIUS_METERS}–${MAX_RADIUS_METERS} m.`}
          error={errors.radiusMeters}
        />
        <TextField
          label="Toleransi keterlambatan (menit)"
          value={tolerance}
          onChangeText={setTolerance}
          keyboardType="number-pad"
          hint="0–120 menit sejak jadwal mulai."
          error={errors.lateToleranceMinutes}
        />
      </View>

      <View style={styles.form}>
        <SectionHeader title="Status" />
        <SegmentedControl<ActiveValue>
          accessibilityLabel="Status laboratorium"
          value={active}
          onChange={setActive}
          options={[
            { value: 'active', label: 'Aktif' },
            { value: 'inactive', label: 'Nonaktif' },
          ]}
        />
      </View>

      {labInUsePrompt ? (
        <View style={styles.form}>
          <Banner
            tone="warning"
            title="Lab Masih Dipakai Sesi"
            message={labInUsePrompt}
          />
          {existing?.isActive !== false && (
            <Button
              label="Nonaktifkan lab"
              variant="outline"
              loading={toggling}
              disabled={busy}
              onPress={handleDeactivateInstead}
            />
          )}
        </View>
      ) : null}

      {submitError ? (
        <Banner tone="danger" title="Gagal" message={submitError} />
      ) : null}

      <Button
        label={labId ? 'Simpan perubahan' : 'Tambah lab'}
        loading={saving}
        disabled={busy}
        onPress={handleSubmit}
      />
      {labId ? (
        <Button
          label="Hapus lab"
          variant="outline"
          icon="trash-outline"
          loading={deleting}
          disabled={busy}
          onPress={() => setConfirmDelete(true)}
        />
      ) : null}

      <ConfirmSheet
        visible={confirmDelete}
        title="Hapus laboratorium?"
        description={`${existing?.name ?? 'Lab ini'} akan dihapus permanen bila tidak dipakai oleh sesi mana pun.`}
        confirmLabel="Hapus"
        tone="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      <LabLocationPickerModal
        visible={pickerVisible}
        initialLatitude={parseCoordinate(latitude)}
        initialLongitude={parseCoordinate(longitude)}
        radiusMeters={Number(radius) || DEFAULT_RADIUS_METERS}
        onConfirm={(coords) => {
          setLatitude(coords.latitude.toFixed(6));
          setLongitude(coords.longitude.toFixed(6));
        }}
        onClose={() => setPickerVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  pickerActions: { gap: spacing.sm },
  coordPreviewBox: {
    backgroundColor: colors.lavenderSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: tokenRadius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
});
