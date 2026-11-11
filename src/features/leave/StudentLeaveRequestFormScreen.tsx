import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation';
import type { AiClassificationResult, Session } from '../../domain/types';
import { Banner, Button, Screen } from '../../shared/ui';
import { leaveFailure } from '../../services/firestore/leaveService';
import { AiResult, styles } from './components';
import { useLeaveDependencies } from './LeaveProvider';
import { useStudentLeaveViewModel } from './useStudentLeaveViewModel';

type FormProps = NativeStackScreenProps<
  RootStackParamList,
  'StudentLeaveRequestForm'
>;

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
  return (
    <Screen>
      <Text style={styles.title}>Ajukan Izin</Text>
      {loading ? <ActivityIndicator accessibilityLabel="Memuat sesi" /> : null}
      {error || vm.error ? (
        <>
          <Banner
            tone="danger"
            title="Pengajuan belum selesai"
            message={error ?? vm.error ?? ''}
          />
          <Button
            label="Coba Lagi"
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
          <Text style={styles.subtitle}>
            {session.courseName} · {session.groupName}
          </Text>
          <Text style={styles.body}>
            {new Date(session.startsAt).toLocaleString('id-ID')}
          </Text>
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
            <>
              {duplicate ? (
                <Banner
                  tone="warning"
                  title="Pengajuan sudah ada"
                  message="Anda sudah memiliki izin menunggu atau diterima untuk sesi ini."
                />
              ) : null}
              <Text style={styles.body}>
                Alasan ketidakhadiran (minimal 5 karakter)
              </Text>
              <TextInput
                accessibilityLabel="Alasan ketidakhadiran"
                placeholder="Tuliskan alasan izin Anda"
                style={styles.input}
                multiline
                value={reason}
                editable={!busy && !!eligible && !duplicate}
                onChangeText={(value) => {
                  setReason(value);
                  setPrediction(null);
                }}
              />
              <Button
                label="Pratinjau Klasifikasi AI"
                variant="outline"
                loading={previewing}
                disabled={
                  busy || !eligible || !!duplicate || reason.trim().length < 5
                }
                onPress={() => {
                  void preview();
                }}
              />
              <Button
                label="Kirim Pengajuan"
                loading={vm.submitting}
                disabled={
                  busy ||
                  vm.loading ||
                  !!vm.error ||
                  !eligible ||
                  !!duplicate ||
                  reason.trim().length < 5
                }
                onPress={() => {
                  void submit();
                }}
              />
            </>
          )}
          {prediction ? <AiResult prediction={prediction} /> : null}
        </>
      ) : null}
      <Button
        label="Lihat Pengajuan Saya"
        variant="soft"
        onPress={() => navigation.navigate('StudentLeaveList')}
      />
    </Screen>
  );
}
