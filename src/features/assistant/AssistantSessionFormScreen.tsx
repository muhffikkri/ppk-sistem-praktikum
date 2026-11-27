import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Banner,
  Button,
  DateTimeField,
  Screen,
  SelectField,
  spacing,
  TextField,
  BackButton,
  Header,
} from '../../shared/ui';
import { useAssistantSessionsViewModel } from '../../state';
import { useLabManagement } from '../labs';

type Props = NativeStackScreenProps<RootStackParamList, 'AssistantSessionForm'>;

const TWO_HOURS = 2 * 60 * 60 * 1000;

/** Date part from `day`, hours and minutes from `clock`. */
function combine(day: Date, clock: Date): Date {
  const result = new Date(day);
  result.setHours(clock.getHours(), clock.getMinutes(), 0, 0);
  return result;
}

export function AssistantSessionFormScreen({ route, navigation }: Props) {
  const { classes, getSessionById, createSession, updateSession } =
    useAssistantSessionsViewModel();
  const { labs, loading: labsLoading, error: labsError } = useLabManagement();
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
  const [start, setStart] = useState(
    () => new Date(existing?.startsAt ?? Date.now()),
  );
  const [end, setEnd] = useState(
    () =>
      new Date(existing?.endsAt ?? new Date(Date.now() + TWO_HOURS).getTime()),
  );
  const [endTouched, setEndTouched] = useState(isEditing);
  const [classError, setClassError] = useState<string>();
  const [endError, setEndError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const editable = isEditing ? existing?.status === 'scheduled' : true;

  const onStartChange = (value: Date) => {
    setStart(value);
    setEndError(undefined);
    if (!endTouched) setEnd(new Date(value.getTime() + TWO_HOURS));
  };

  const handleSubmit = async () => {
    if (!editable) return;
    const startsAt = combine(day, start);
    const endsAt = combine(day, end);
    setFormError(null);
    setClassError(classId ? undefined : 'Pilih kelas terlebih dahulu');
    setLabError(selectedLab ? undefined : 'Pilih lab tempat praktikum');
    const endInvalid = endsAt.getTime() <= startsAt.getTime();
    setEndError(endInvalid ? 'Jam selesai harus setelah jam mulai' : undefined);
    if (!classId || !selectedLab || endInvalid) return;

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
              message="Tambahkan lab beserta koordinat dan radiusnya agar presensi bisa divalidasi."
            />
            <Button
              label="Tambah lab"
              variant="soft"
              onPress={() => navigation.navigate('AssistantLabForm', {})}
            />
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
        <DateTimeField
          label="Jam mulai"
          mode="time"
          value={start}
          onChange={onStartChange}
        />
        <DateTimeField
          label="Jam selesai"
          mode="time"
          value={end}
          onChange={(value) => {
            setEnd(value);
            setEndTouched(true);
            setEndError(undefined);
          }}
          error={endError}
        />

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
