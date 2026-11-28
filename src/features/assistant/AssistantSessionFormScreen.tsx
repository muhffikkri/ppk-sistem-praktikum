import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  SESSION_FIRST_HOUR,
  blockHourOf,
  defaultEndHour,
  endHourOptions,
  formatHourLabel,
  startHourOptions,
  validateSessionTimeBlock,
} from '../../domain/sessionTimeRules';
import {
  Banner,
  Button,
  DateTimeField,
  Screen,
  SelectField,
  spacing,
  Text,
  TextField,
  BackButton,
  Header,
} from '../../shared/ui';
import { useAssistantSessionsViewModel } from '../../state';
import { useLabManagement } from '../labs/useLabManagement';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantSessionForm'>;

const START_HOURS = startHourOptions();
const START_OPTIONS = START_HOURS.map((hour) => ({
  value: String(hour),
  label: formatHourLabel(hour),
}));

/** Tanggal dari `day` pada jam bulat `hour`. */
function atHour(day: Date, hour: number): Date {
  const result = new Date(day);
  result.setHours(hour, 0, 0, 0);
  return result;
}

/** Jam mulai bawaan sesi baru: jam bulat berikutnya dalam blok. */
function nextStartHour(now: Date): number {
  const hour = now.getHours() + 1;
  return START_HOURS.includes(hour) ? hour : SESSION_FIRST_HOUR;
}

export function AssistantSessionFormScreen({ route, navigation }: Props) {
  const { classes, getSessionById, createSession, updateSession } =
    useAssistantSessionsViewModel();
  const {
    labs,
    loading: labsLoading,
    error: labsError,
    canManage: canManageLabs,
  } = useLabManagement();
  const activeLabs = useMemo(() => labs.filter((l) => l.isActive), [labs]);

  const { classId: routeClassId, sessionId } = route.params ?? {};
  const existing = sessionId ? getSessionById(sessionId) : undefined;
  const isEditing = !!sessionId;

  const [classId, setClassId] = useState(
    routeClassId ?? existing?.classId ?? '',
  );
  const [title, setTitle] = useState(existing?.title ?? '');
  // Sesi lama hanya punya label teks; pilih lab dengan nama yang sama bila ada.
  const [pickedLabId, setPickedLabId] = useState<string | null>(
    existing?.labId ?? null,
  );
  const labId =
    pickedLabId ??
    activeLabs.find(
      (l) =>
        !!existing?.lab &&
        l.name.trim().toLowerCase() === existing.lab.trim().toLowerCase(),
    )?.id ??
    null;

  const selectableLabs = useMemo(() => {
    if (!isEditing || !labId) return activeLabs;
    const existingLab = labs.find((l) => l.id === labId);
    if (!existingLab || existingLab.isActive) return activeLabs;
    return [existingLab, ...activeLabs];
  }, [activeLabs, isEditing, labId, labs]);

  const selectedLab = selectableLabs.find((l) => l.id === labId);
  const [labError, setLabError] = useState<string>();
  const [day, setDay] = useState(
    () => new Date(existing?.startsAt ?? Date.now()),
  );
  // Sesi lama di luar blok jam (mis. 09.31) wajib dipilih ulang.
  const [startHour, setStartHour] = useState<number | null>(() =>
    existing
      ? blockHourOf(new Date(existing.startsAt), START_HOURS)
      : nextStartHour(new Date()),
  );
  const [endHour, setEndHour] = useState<number | null>(() => {
    if (!existing) return startHour === null ? null : defaultEndHour(startHour);
    if (startHour === null) return null;
    return blockHourOf(new Date(existing.endsAt), endHourOptions(startHour));
  });
  const [endTouched, setEndTouched] = useState(isEditing);
  const [startError, setStartError] = useState<string>();
  const [classError, setClassError] = useState<string>();
  const [endError, setEndError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const editable = isEditing ? existing?.status === 'scheduled' : true;

  const endOptions = useMemo(
    () =>
      startHour === null
        ? []
        : endHourOptions(startHour).map((hour) => ({
            value: String(hour),
            label: formatHourLabel(hour),
            description: `${hour - startHour} jam`,
          })),
    [startHour],
  );

  const onStartChange = (value: string) => {
    const hour = Number(value);
    setStartHour(hour);
    setStartError(undefined);
    setEndError(undefined);
    const stillValid =
      endHour !== null && endHourOptions(hour).includes(endHour);
    if (!endTouched || !stillValid) setEndHour(defaultEndHour(hour));
  };

  const handleSubmit = async () => {
    if (!editable) return;
    setFormError(null);
    setClassError(classId ? undefined : 'Pilih kelas terlebih dahulu');
    setLabError(selectedLab ? undefined : 'Pilih lab tempat praktikum');
    setStartError(startHour === null ? 'Pilih jam mulai' : undefined);
    if (startHour === null || endHour === null) {
      setEndError('Pilih jam selesai');
      return;
    }
    const startsAt = atHour(day, startHour);
    const endsAt = atHour(day, endHour);
    const timeBlock = validateSessionTimeBlock(startsAt, endsAt);
    setEndError(timeBlock.ok ? undefined : timeBlock.message);
    if (!classId || !selectedLab || !timeBlock.ok) return;

    const input = {
      classId,
      title,
      lab: selectedLab.name,
      labId: selectedLab.id,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    };
    setSubmitting(true);
    try {
      const result =
        isEditing && sessionId
          ? await updateSession(sessionId, input)
          : await createSession(input);
      if (!result.ok) {
        setFormError(result.message || 'Gagal menyimpan sesi');
        return;
      }
      navigation.goBack();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Gagal menyimpan sesi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen withDock={false}>
      <BackButton onPress={() => navigation.goBack()} />

      <Header title="Buka Sesi Baru" description="Informasi Sesi" />

      <View style={styles.form}>
        {isEditing && !editable ? (
          <Banner
            tone="warning"
            title="Sesi tidak bisa diedit"
            message="Hanya sesi berstatus terjadwal yang bisa diubah."
          />
        ) : null}
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
            value={classId || null}
            options={classes.map((c) => ({
              value: c.id,
              label: `${c.courseName} · ${c.groupName}`,
              description: `${c.participantIds.length} peserta`,
            }))}
            onChange={(id) => {
              setClassId(id);
              setClassError(undefined);
            }}
            error={classError}
          />
        )}

        <TextField
          label="Judul sesi"
          value={title}
          onChangeText={setTitle}
          placeholder="Mis. Pertemuan 1"
        />
        {labsError ? (
          <Banner tone="danger" title="Gagal memuat lab" message={labsError} />
        ) : !labsLoading && selectableLabs.length === 0 ? (
          <>
            <Banner
              tone="warning"
              title="Belum ada lab"
              message={
                canManageLabs
                  ? 'Tambahkan lab beserta koordinat dan radiusnya agar presensi bisa divalidasi.'
                  : 'Lab dikelola Aslab. Minta Aslab mata kuliah ini menambahkan lab beserta koordinat dan radiusnya.'
              }
            />
            {canManageLabs ? (
              <Button
                label="Tambah lab"
                variant="soft"
                onPress={() => navigation.navigate('AssistantLabForm', {})}
              />
            ) : null}
          </>
        ) : (
          <SelectField
            label="Lokasi lab"
            placeholder={labsLoading ? 'Memuat lab…' : 'Pilih lab'}
            value={labId}
            options={selectableLabs.map((l) => ({
              value: l.id,
              label: l.isActive ? l.name : `${l.name} (Nonaktif)`,
              description: `${l.building} · radius ${l.radiusMeters} m`,
            }))}
            onChange={(id) => {
              setPickedLabId(id);
              setLabError(undefined);
            }}
            error={labError}
          />
        )}

        <DateTimeField
          label="Tanggal"
          mode="date"
          value={day}
          onChange={setDay}
        />
        <SelectField
          label="Jam mulai"
          placeholder="Pilih jam mulai"
          value={startHour === null ? null : String(startHour)}
          options={START_OPTIONS}
          onChange={onStartChange}
          error={startError}
        />
        <SelectField
          label="Jam selesai"
          placeholder={
            startHour === null ? 'Pilih jam mulai dulu' : 'Pilih jam selesai'
          }
          value={endHour === null ? null : String(endHour)}
          options={endOptions}
          onChange={(value) => {
            setEndHour(Number(value));
            setEndTouched(true);
            setEndError(undefined);
          }}
          error={endError}
        />
        <Text variant="caption" tone="muted">
          Sesi berlangsung pada jam bulat antara 07.00 dan 20.00, durasi 1–4
          jam.
        </Text>

        {formError ? (
          <Banner tone="danger" title="Gagal menyimpan" message={formError} />
        ) : null}

        <Button
          label={isEditing ? 'Simpan perubahan' : 'Buat sesi'}
          loading={submitting}
          disabled={submitting || !editable}
          onPress={handleSubmit}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
});
