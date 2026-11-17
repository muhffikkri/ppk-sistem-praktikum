import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation';
import type { AiClassificationResult, Session } from '../../domain/types';
import {
  Banner,
  Button,
  Card,
  CardContent,
  Header,
  InfoRow,
  LoadingState,
  Screen,
  spacing,
  Text,
  TextField,
  TopBar,
} from '../../shared/ui';
import { leaveFailure } from '../../services/firestore/leaveService';
import { AiResult } from './components';
import { useLeaveDependencies } from './LeaveProvider';
import { useStudentLeaveViewModel } from './useStudentLeaveViewModel';

type FormProps = NativeStackScreenProps<
  RootStackParamList,
  'StudentLeaveRequestForm'
>;

const MIN_REASON_LENGTH = 5;

export function StudentLeaveRequestFormScreen(props: FormProps) {
  return <LeaveRequestForm key={props.route.params.sessionId} {...props} />;
}

function LeaveRequestForm({ route, navigation }: FormProps) {
  const { service, user } = useLeaveDependencies();
  const vm = useStudentLeaveViewModel();
  const [session, setSession] = useState<Session | null>(null);
  const [reason, setReason] = useState('');
  const [prediction, setPrediction] = useState<AiClassificationResult | null>(
    null,
  );
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    let active = true;
    service
      .getSession(route.params.sessionId)
      .then((value) => {
        if (active) setSession(value);
      })
      .catch((cause) => {
        if (active) setError(leaveFailure(cause).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [service, route.params.sessionId, revision]);
  async function preview() {
    setPreviewing(true);
    setError(null);
    try {
      setPrediction(await vm.previewAiClassification(reason));
    } catch (cause) {
      setError(leaveFailure(cause).message);
    } finally {
      setPreviewing(false);
    }
  }
  async function submit() {
    if (!session) return;
    const result = await vm.submitLeaveRequest({ session, reason });
    if (result.ok) {
      setPrediction(result.data.aiPrediction);
      setSaved(true);
    }
  }
  const existing = vm.getLeaveForSession(route.params.sessionId);
  const duplicate = existing && existing.status !== 'rejected';
  const eligible =
    user?.role === 'student' && session?.participantIds?.includes(user.uid);
  const busy = previewing || vm.submitting;
  const reasonReady = reason.trim().length >= MIN_REASON_LENGTH;

  return (
    <Screen>
      <TopBar
        title={session ? undefined : 'Ajukan izin'}
        onBack={() => navigation.goBack()}
      />
      {loading ? <LoadingState label="Memuat sesi…" /> : null}
      {error || vm.error ? (
        <>
          <Banner
            tone="danger"
            title="Pengajuan belum selesai"
            message={error ?? vm.error ?? ''}
          />
          <Button
            label="Coba lagi"
            variant="outline"
            disabled={busy}
            onPress={() => {
              if (!session) {
                setLoading(true);
                setRevision((value) => value + 1);
              }
              vm.retry();
              setError(null);
            }}
          />
        </>
      ) : null}
      {session ? (
        <>
          <Header title={session.courseName} description={session.groupName} />
          <Card interactive={false}>
            <CardContent>
              <InfoRow
                label="Waktu"
                value={new Date(session.startsAt).toLocaleString('id-ID')}
              />
            </CardContent>
          </Card>
          {!eligible ? (
            <Banner
              tone="warning"
              title="Tidak dapat mengajukan izin"
              message="Gunakan akun praktikan yang terdaftar pada sesi ini."
            />
          ) : null}
          {saved ? (
            <Banner
              title="Izin berhasil dikirim"
              message="Pengajuan tersimpan dengan status Menunggu. Asisten akan memeriksa alasan Anda."
            />
          ) : (
            <View style={styles.form}>
              {duplicate ? (
                <Banner
                  tone="warning"
                  title="Pengajuan sudah ada"
                  message="Anda sudah memiliki izin menunggu atau diterima untuk sesi ini."
                />
              ) : null}
              <TextField
                label="Alasan ketidakhadiran"
                placeholder="Tuliskan alasan izin Anda"
                hint={`${reason.trim().length} dari minimal ${MIN_REASON_LENGTH} karakter`}
                value={reason}
                multiline
                editable={!busy && !!eligible && !duplicate}
                onChangeText={(value) => {
                  setReason(value);
                  setPrediction(null);
                }}
              />
              <Text variant="caption" tone="muted">
                Asisten yang memutuskan izin. Klasifikasi AI hanya membantu.
              </Text>
              <Button
                label="Pratinjau klasifikasi AI"
                variant="outline"
                loading={previewing}
                disabled={busy || !eligible || !!duplicate || !reasonReady}
                onPress={() => {
                  void preview();
                }}
              />
              <Button
                label="Kirim pengajuan"
                loading={vm.submitting}
                disabled={
                  busy ||
                  vm.loading ||
                  !!vm.error ||
                  !eligible ||
                  !!duplicate ||
                  !reasonReady
                }
                onPress={() => {
                  void submit();
                }}
              />
            </View>
          )}
          {prediction ? <AiResult prediction={prediction} /> : null}
        </>
      ) : null}
      <Button
        label="Lihat pengajuan saya"
        variant="soft"
        onPress={() => navigation.navigate('StudentLeaveList')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
});
