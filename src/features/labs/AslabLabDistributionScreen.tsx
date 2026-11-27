import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation';
import { canManageLabMaster } from '../../domain/asprakScope';
import type { Lab } from '../../domain/geoTypes';
import {
  assignAssistantToLabByEmail,
  assignParticipantToLabByEmail,
  moveParticipantBetweenLabs,
} from '../../services/firestore/labDistributionService';
import { subscribeLabs } from '../../services/firestore/labService';
import { useAuth } from '../../state/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'AslabLabDistribution'>;

export function AslabLabDistributionScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const isAuthorized = canManageLabMaster(user?.role);

  const [labs, setLabs] = useState<Lab[]>([]);
  const [loadingLabs, setLoadingLabs] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedLabId, setSelectedLabId] = useState(route.params?.labId ?? '');
  const [participantEmail, setParticipantEmail] = useState('');
  const [assistantEmail, setAssistantEmail] = useState('');

  const [moveUid, setMoveUid] = useState('');
  const [fromLabId, setFromLabId] = useState('');
  const [toLabId, setToLabId] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeLabs(
      (items) => {
        setLabs(items);
        setLoadingLabs(false);
        if (!selectedLabId && items.length > 0) {
          setSelectedLabId(items[0].id);
        }
        if (!fromLabId && items.length > 0) {
          setFromLabId(items[0].id);
        }
        if (!toLabId && items.length > 1) {
          setToLabId(items[1].id);
        }
      },
      (msg) => {
        setLoadingLabs(false);
        setStatusMessage(msg);
      },
    );
    return unsub;
  }, [selectedLabId, fromLabId, toLabId]);

  const selectedLab = useMemo(
    () => labs.find((l) => l.id === selectedLabId) ?? null,
    [labs, selectedLabId],
  );

  if (!isAuthorized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guardBox}>
          <Text style={styles.title}>Akses Terbatas</Text>
          <Text style={styles.body}>
            Hanya Aslab (lab_assistant) yang dapat mengelola distribusi praktikan dan asisten antar lab.
          </Text>
          <Pressable style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.secondaryBtnText}>Kembali</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  async function handleAssignParticipant() {
    setStatusMessage(null);
    setSubmitting(true);
    const res = await assignParticipantToLabByEmail({
      email: participantEmail,
      labId: selectedLabId,
      actorRole: user?.role,
    });
    setSubmitting(false);
    setStatusMessage(res.ok ? `Praktikan berhasil ditempatkan ke lab (${res.data?.uid}).` : res.message);
    if (res.ok) setParticipantEmail('');
  }

  async function handleAssignAssistant() {
    setStatusMessage(null);
    setSubmitting(true);
    const res = await assignAssistantToLabByEmail({
      email: assistantEmail,
      labId: selectedLabId,
      actorRole: user?.role,
    });
    setSubmitting(false);
    setStatusMessage(res.ok ? `Asisten berhasil ditugaskan ke lab (${res.data?.uid}).` : res.message);
    if (res.ok) setAssistantEmail('');
  }

  async function handleMoveParticipant() {
    setStatusMessage(null);
    setSubmitting(true);
    const res = await moveParticipantBetweenLabs({
      participantUid: moveUid,
      fromLabId,
      toLabId,
      actorRole: user?.role,
    });
    setSubmitting(false);
    if (!res.ok) {
      setStatusMessage(res.message);
      return;
    }
    setStatusMessage('Praktikan berhasil dipindahkan antar lab tanpa mengubah jadwal maupun presensi.');
    Alert.alert('Sukses', 'Pemindahan praktikan antar lab selesai.');
    setMoveUid('');
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Distribusi Praktikan & Asisten Lab</Text>
        <Text style={styles.subtitle}>
          {selectedLab ? `Lab aktif: ${selectedLab.name}` : 'Pilih laboratorium terlebih dahulu'}
        </Text>

        {loadingLabs ? (
          <ActivityIndicator />
        ) : (
          <View style={styles.chipRow}>
            {labs.map((lab) => {
              const active = lab.id === selectedLabId;
              return (
                <Pressable
                  key={lab.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSelectedLabId(lab.id)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {lab.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tempatkan Praktikan (by Email)</Text>
          <TextInput
            style={styles.input}
            placeholder="email.praktikan@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={participantEmail}
            onChangeText={setParticipantEmail}
          />
          <Pressable
            style={styles.primaryBtn}
            disabled={submitting}
            onPress={handleAssignParticipant}>
            <Text style={styles.primaryBtnText}>Assign Praktikan</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tugaskan Asisten (by Email)</Text>
          <TextInput
            style={styles.input}
            placeholder="email.asisten@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={assistantEmail}
            onChangeText={setAssistantEmail}
          />
          <Pressable
            style={styles.primaryBtn}
            disabled={submitting}
            onPress={handleAssignAssistant}>
            <Text style={styles.primaryBtnText}>Assign Asisten</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pindahkan Praktikan Antar Lab</Text>
          <TextInput
            style={styles.input}
            placeholder="UID Praktikan"
            autoCapitalize="none"
            value={moveUid}
            onChangeText={setMoveUid}
          />
          <Text style={styles.label}>Dari Lab ID</Text>
          <TextInput
            style={styles.input}
            placeholder="fromLabId"
            autoCapitalize="none"
            value={fromLabId}
            onChangeText={setFromLabId}
          />
          <Text style={styles.label}>Ke Lab ID</Text>
          <TextInput
            style={styles.input}
            placeholder="toLabId"
            autoCapitalize="none"
            value={toLabId}
            onChangeText={setToLabId}
          />
          <Pressable
            style={styles.primaryBtn}
            disabled={submitting}
            onPress={handleMoveParticipant}>
            <Text style={styles.primaryBtnText}>Pindahkan Praktikan</Text>
          </Pressable>
        </View>

        {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, gap: 12 },
  guardBox: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#475569' },
  body: { fontSize: 14, color: '#334155', lineHeight: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  chipActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  chipText: { fontSize: 12, color: '#334155' },
  chipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  label: { fontSize: 12, color: '#475569', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  primaryBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  secondaryBtn: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  secondaryBtnText: { color: '#0F172A', fontWeight: '600' },
  statusText: { fontSize: 13, color: '#1E293B', fontWeight: '500' },
});