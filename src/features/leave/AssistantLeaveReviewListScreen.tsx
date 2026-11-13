import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { AiClassificationResult } from '../../domain/types';
import { Banner, Button, ConfirmSheet, Screen } from '../../shared/ui';
import { ListFeedback, RequestCard, styles } from './components';
import { useAssistantLeaveViewModel } from './useAssistantLeaveViewModel';

function aiPredictionLabel(prediction: AiClassificationResult): string {
  if (prediction.status !== 'classified') return 'tidak tersedia';

  const confidence =
    prediction.confidence !== null
      ? ` (${Math.round(prediction.confidence * 100)}%)`
      : '';
  return `${prediction.category ?? '-'}${confidence}`;
}

export function AssistantLeaveReviewListScreen() {
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
    <Screen>
      <Text style={styles.title}>Pemeriksaan Izin</Text>
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
            <>
              <Button
                label="Terima"
                disabled={!!vm.reviewingId}
                onPress={() => {
                  setFeedback(null);
                  setConfirmation({ id: item.id, approve: true });
                }}
              />
              <Button
                label="Tolak"
                variant="destructive"
                disabled={!!vm.reviewingId}
                onPress={() => {
                  setFeedback(null);
                  setConfirmation({ id: item.id, approve: false });
                }}
              />
            </>
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
          <TextInput
            accessibilityLabel={`Catatan untuk ${activeItem.studentName}`}
            placeholder="Catatan asisten (opsional)"
            multiline
            style={styles.input}
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
