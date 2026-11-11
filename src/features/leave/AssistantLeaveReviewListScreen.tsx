import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Banner, Button, Screen } from '../../shared/ui';
import { ListFeedback, RequestCard, styles } from './components';
import { useAssistantLeaveViewModel } from './useAssistantLeaveViewModel';

export function AssistantLeaveReviewListScreen() {
  const vm = useAssistantLeaveViewModel();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState<{
    id: string;
    approve: boolean;
  } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  async function confirm() {
    if (!confirmation) return;
    const result = await (
      confirmation.approve ? vm.approveLeave : vm.rejectLeave
    )(confirmation.id, notes[confirmation.id]);
    if (result.ok) {
      setFeedback('Keputusan berhasil disimpan.');
      setConfirmation(null);
    }
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
              <TextInput
                accessibilityLabel={`Catatan untuk ${item.studentName}`}
                placeholder="Catatan asisten (opsional)"
                multiline
                style={styles.input}
                value={notes[item.id] ?? ''}
                editable={!vm.reviewingId}
                onChangeText={(note) =>
                  setNotes((current) => ({ ...current, [item.id]: note }))
                }
              />
              {confirmation?.id === item.id ? (
                <>
                  <Text style={styles.body}>
                    Konfirmasi {confirmation.approve ? 'terima' : 'tolak'}{' '}
                    pengajuan {item.studentName}?
                  </Text>
                  <Button
                    label="Simpan Keputusan"
                    loading={vm.reviewingId === item.id}
                    disabled={!!vm.reviewingId}
                    onPress={() => {
                      void confirm();
                    }}
                  />
                  <Button
                    label="Batal"
                    variant="outline"
                    disabled={!!vm.reviewingId}
                    onPress={() => setConfirmation(null)}
                  />
                </>
              ) : (
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
              )}
            </>
          ) : null}
        </View>
      ))}
    </Screen>
  );
}
