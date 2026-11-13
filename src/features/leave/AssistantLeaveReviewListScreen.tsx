import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import type { RootStackParamList } from '../../app/navigation';
import type { AiClassificationResult } from '../../domain/types';
import {
  Banner,
  Button,
  ConfirmSheet,
  Header,
  Screen,
  spacing,
  TextField,
  TopBar,
} from '../../shared/ui';
import { ListFeedback, RequestCard } from './components';
import { useAssistantLeaveViewModel } from './useAssistantLeaveViewModel';

function aiPredictionLabel(prediction: AiClassificationResult): string {
  if (prediction.status !== 'classified') return 'tidak tersedia';

  const confidence =
    prediction.confidence !== null
      ? ` (${Math.round(prediction.confidence * 100)}%)`
      : '';
  return `${prediction.category ?? '-'}${confidence}`;
}

type Props = NativeStackScreenProps<
  RootStackParamList,
  'AssistantLeaveReviewList'
>;

export function AssistantLeaveReviewListScreen({ navigation }: Props) {
  const vm = useAssistantLeaveViewModel();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState<{
    id: string;
    approve: boolean;
  } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);

  const activeItem = confirmation
    ? vm.leaveRequests.find((item) => item.id === confirmation.id)
    : undefined;

  async function confirm() {
    if (!confirmation) return;
    const result = await (
      confirmation.approve ? vm.approveLeave : vm.rejectLeave
    )(confirmation.id, notes[confirmation.id]);
    if (result.ok) {
      setSheetError(null);
      setFeedback('Keputusan berhasil disimpan.');
      setConfirmation(null);
    } else {
      // Banner di layar tertutup Modal, jadi error ditampilkan di dalam sheet.
      setSheetError(result.message);
    }
  }

  function closeSheet() {
    setSheetError(null);
    setConfirmation(null);
  }

  return (
    <Screen withDock={false}>
      <TopBar onBack={() => navigation.goBack()} />
      <Header
        title="Pemeriksaan izin"
        description="Prediksi AI hanya pendukung; keputusan ada pada asisten."
      />
      <ListFeedback {...vm} empty={vm.leaveRequests.length === 0} />
      {feedback ? (
        <Banner
          title="Keputusan tersimpan"
          message={feedback}
          onDismiss={() => setFeedback(null)}
        />
      ) : null}
      {vm.leaveRequests.map((item) => (
        <View key={item.id} style={styles.group}>
          <RequestCard item={item} />
          {item.status === 'pending' ? (
            <View style={styles.actions}>
              <View style={styles.action}>
                <Button
                  label="Terima"
                  disabled={!!vm.reviewingId}
                  onPress={() => {
                    setFeedback(null);
                    setConfirmation({ id: item.id, approve: true });
                  }}
                />
              </View>
              <View style={styles.action}>
                <Button
                  label="Tolak"
                  variant="destructive"
                  disabled={!!vm.reviewingId}
                  onPress={() => {
                    setFeedback(null);
                    setConfirmation({ id: item.id, approve: false });
                  }}
                />
              </View>
            </View>
          ) : null}
        </View>
      ))}

      {confirmation && activeItem ? (
        <ConfirmSheet
          visible
          title={
            confirmation.approve ? 'Terima pengajuan?' : 'Tolak pengajuan?'
          }
          description={`${activeItem.studentName} · ${activeItem.courseName} · ${activeItem.groupName}. Prediksi AI (bukan keputusan): ${aiPredictionLabel(activeItem.aiPrediction)}.`}
          tone={confirmation.approve ? 'default' : 'danger'}
          confirmLabel="Simpan Keputusan"
          loading={vm.reviewingId === activeItem.id}
          onConfirm={() => {
            void confirm();
          }}
          onCancel={closeSheet}
        >
          {sheetError ? (
            <Banner
              title="Gagal menyimpan keputusan"
              message={sheetError}
              tone="danger"
            />
          ) : null}
          <TextField
            label="Catatan asisten (opsional)"
            multiline
            value={notes[activeItem.id] ?? ''}
            editable={!vm.reviewingId}
            onChangeText={(note) =>
              setNotes((current) => ({ ...current, [activeItem.id]: note }))
            }
          />
        </ConfirmSheet>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
