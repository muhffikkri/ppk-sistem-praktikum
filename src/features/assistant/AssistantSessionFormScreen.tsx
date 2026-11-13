import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  Banner,
  Button,
  DateTimeField,
  Header,
  Screen,
  SelectField,
  spacing,
  TextField,
  TopBar,
} from '../../shared/ui';
import { useAssistantSessionsViewModel } from '../../state';

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

  const { classId: routeClassId, sessionId } = route.params ?? {};
  const existing = sessionId ? getSessionById(sessionId) : undefined;
  const isEditing = !!sessionId;

  const [classId, setClassId] = useState(
    routeClassId ?? existing?.classId ?? '',
  );
  const [title, setTitle] = useState(existing?.title ?? '');
  const [lab, setLab] = useState(existing?.lab ?? '');
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

  const onStartChange = (value: Date) => {
    setStart(value);
    setEndError(undefined);
    if (!endTouched) setEnd(new Date(value.getTime() + TWO_HOURS));
  };

  const handleSubmit = async () => {
    const startsAt = combine(day, start);
    const endsAt = combine(day, end);
    setFormError(null);
    setClassError(classId ? undefined : 'Pilih kelas terlebih dahulu');
    const endInvalid = endsAt.getTime() <= startsAt.getTime();
    setEndError(endInvalid ? 'Jam selesai harus setelah jam mulai' : undefined);
    if (!classId || endInvalid) return;

    const input = {
      classId,
      title,
      lab,
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
      <TopBar onBack={() => navigation.goBack()} />
      <Header title={isEditing ? 'Edit sesi' : 'Buat sesi'} />

      <View style={styles.form}>
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
        <TextField
          label="Lokasi lab"
          value={lab}
          onChangeText={setLab}
          placeholder="Mis. Lab Komputer 2"
        />

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
          disabled={submitting}
          onPress={handleSubmit}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
});
