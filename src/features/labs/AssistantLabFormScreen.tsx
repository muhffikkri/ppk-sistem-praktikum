import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  DEFAULT_RADIUS_METERS,
  hasLabInputErrors,
  MAX_RADIUS_METERS,
  MIN_RADIUS_METERS,
  parseCoordinate,
  validateLabInput,
} from '../../domain/geofenceRules';
import type { Lab, LabInput, LabInputErrors } from '../../domain/geoTypes';
import {
  Banner,
  Button,
  ConfirmSheet,
  ErrorState,
  LoadingState,
  Screen,
  SectionHeader,
  SegmentedControl,
  spacing,
  Text,
  TextField,
  BackButton,
} from '../../shared/ui';
import { colors, radius as tokenRadius } from '../../theme/tokens';
import { getCurrentDeviceLocation } from '../../services/location/deviceLocationService';
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
  const { getLabById, saveLab, removeLab, saving, deletingId, loading, error } =
    useLabManagement();

  const labId = route.params?.labId ?? null;
  const existing = labId ? getLabById(labId) : undefined;

  if (labId && !existing) {
    return (
      <Screen withDock={false}>
        <BackButton onPress={() => navigation.goBack()} />
        {loading ? (
          <LoadingState label="Memuat laboratorium…" />
        ) : (
          <ErrorState
            title="Laboratorium tidak ditemukan"
            message={error ?? 'Lab mungkin sudah dihapus oleh asisten lain.'}
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
      saving={saving}
      deleting={deletingId !== null}
      onSave={saveLab}
      onDelete={removeLab}
      onDone={() => navigation.goBack()}
    />
  );
}

type LabFormProps = {
  labId: string | null;
  existing: Lab | undefined;
  saving: boolean;
  deleting: boolean;
  onSave: LabManagementViewModel['saveLab'];
  onDelete: LabManagementViewModel['removeLab'];
  onDone: () => void;
};

function LabForm({
  labId,
  existing,
  saving,
  deleting,
  onSave,
  onDelete,
  onDone,
}: LabFormProps) {
  const [name, setName] = useState(existing?.name ?? '');
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
  const [active, setActive] = useState<ActiveValue>(
    existing?.isActive === false ? 'inactive' : 'active',
  );
  const [errors, setErrors] = useState<LabInputErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [locating, setLocating] = useState(false);

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
    latitude: parseCoordinate(latitude),
    longitude: parseCoordinate(longitude),
    radiusMeters: Number(radius.trim()),
    isActive: active === 'active',
  });

  const handleSubmit = async () => {
    setSubmitError(null);
    const input = buildInput();
    const nextErrors = validateLabInput(input);
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
    const result = await onDelete(labId);
    if (!result.ok) {
      setSubmitError(result.message || 'Gagal menghapus laboratorium');
      return;
    }
    onDone();
  };

  return (
    <Screen withDock={false}>
      <BackButton onPress={onDone} />

      <View style={styles.form}>
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

      {submitError ? (
        <Banner tone="danger" title="Gagal" message={submitError} />
      ) : null}

      <Button
        label={labId ? 'Simpan perubahan' : 'Tambah lab'}
        loading={saving}
        disabled={saving || deleting}
        onPress={handleSubmit}
      />
      {labId ? (
        <Button
          label="Hapus lab"
          variant="outline"
          icon="trash-outline"
          loading={deleting}
          disabled={saving || deleting}
          onPress={() => setConfirmDelete(true)}
        />
      ) : null}

      <ConfirmSheet
        visible={confirmDelete}
        title="Hapus laboratorium?"
        description={`${existing?.name ?? 'Lab ini'} tidak bisa lagi dipakai sebagai acuan presensi dan peta.`}
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
