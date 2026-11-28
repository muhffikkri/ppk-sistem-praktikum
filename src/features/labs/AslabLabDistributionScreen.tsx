import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../app/navigation';
import { canManageLabMaster } from '../../domain/asprakScope';
import { changeLabAssignment } from '../../services/firestore/labDistributionService';
import {
  BackButton,
  Banner,
  Button,
  EmptyState,
  ErrorState,
  Screen,
  SectionHeader,
  SegmentedControl,
  SelectField,
  SkeletonList,
  TextField,
} from '../../shared/ui';
import { useAuth } from '../../state';
import { LabAccessDenied } from './LabAccessDenied';
import { useLabManagement } from './useLabManagement';

type Props = NativeStackScreenProps<RootStackParamList, 'AslabLabDistribution'>;
type Action = 'participant' | 'assistant' | 'move';

export function AslabLabDistributionScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { labs, loading, error, retry } = useLabManagement();
  const [action, setAction] = useState<Action>('participant');
  const [targetId, setTargetId] = useState(route.params?.labId ?? '');
  const [sourceId, setSourceId] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const scoped = labs.filter((lab) =>
    user?.managedCourseIds?.includes(lab.courseId ?? ''),
  );
  const source = scoped.find((lab) => lab.id === sourceId);
  const targets = scoped.filter(
    (lab) =>
      lab.isActive &&
      (action !== 'move' ||
        (source?.courseId === lab.courseId && sourceId !== lab.id)),
  );
  const target = targets.find((lab) => lab.id === targetId);
  const options = (items: typeof labs) =>
    items.map((lab) => ({
      value: lab.id,
      label: lab.name,
      description: lab.courseCode ?? undefined,
    }));

  async function submit() {
    if (!target || !identifier.trim() || submitting) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const input = { identifier: identifier.trim(), labId: target.id };
      const result = await changeLabAssignment(
        action === 'move'
          ? { ...input, action, fromLabId: sourceId }
          : { ...input, action },
      );
      setFeedback(
        result.ok ? { ok: true, message: 'Penempatan tersimpan.' } : result,
      );
      if (result.ok) setIdentifier('');
    } finally {
      setSubmitting(false);
    }
  }

  if (!canManageLabMaster(user?.role)) {
    return <LabAccessDenied onBack={() => navigation.goBack()} />;
  }

  return (
    <Screen withDock={false}>
      <BackButton onPress={() => navigation.goBack()} />
      <SectionHeader title="Distribusi Lab" />
      {loading ? (
        <SkeletonList variant="row" count={3} label="Memuat laboratorium…" />
      ) : error ? (
        <ErrorState title="Gagal memuat lab" message={error} onRetry={retry} />
      ) : scoped.length === 0 ? (
        <EmptyState
          icon="business-outline"
          title="Belum ada lab"
          description="Tambahkan lab pada mata kuliah yang ditugaskan sebelum menempatkan praktikan atau Asprak."
          action={
            <Button
              label="Tambah lab"
              variant="primary"
              onPress={() => navigation.navigate('AssistantLabForm', {})}
            />
          }
        />
      ) : (
        <>
          <SegmentedControl<Action>
            accessibilityLabel="Jenis penempatan"
            value={action}
            onChange={(value) => {
              setAction(value);
              setFeedback(null);
            }}
            options={[
              { value: 'participant', label: 'Praktikan' },
              { value: 'assistant', label: 'Asprak' },
              { value: 'move', label: 'Pindah lab' },
            ]}
          />
          {action === 'move' ? (
            <SelectField
              label="Lab asal"
              options={options(scoped)}
              value={source?.id ?? null}
              onChange={(value) => {
                setSourceId(value);
                setTargetId('');
              }}
              placeholder="Pilih lab asal"
            />
          ) : null}
          <SelectField
            label="Lab tujuan"
            options={options(targets)}
            value={target?.id ?? null}
            onChange={setTargetId}
            placeholder="Pilih lab tujuan"
          />
          <TextField
            label={
              action === 'assistant'
                ? 'Email atau NIM Asprak'
                : 'Email atau NIM praktikan'
            }
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            label={
              action === 'move' ? 'Pindahkan praktikan' : 'Simpan penempatan'
            }
            onPress={submit}
            disabled={!target || !identifier.trim() || submitting}
            loading={submitting}
          />
        </>
      )}
      {feedback ? (
        <Banner
          tone={feedback.ok ? 'success' : 'danger'}
          title={feedback.ok ? 'Tersimpan' : 'Gagal'}
          message={feedback.message}
        />
      ) : null}
    </Screen>
  );
}
