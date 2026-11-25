import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Clipboard, Pressable, StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../app/navigation';
import {
  getCsvTemplate,
  parseLabImportCsv,
  parseMemberImportCsv,
  toLabInputFromDraft,
  validateLabImportDraft,
  validateMemberEmailFormat,
  type ImportExecutionSummary,
  type ImportKind,
  type LabImportRowDraft,
  type MemberImportRowDraft,
} from '../../domain/labImportRules';
import {
  assignAssistantToLabByEmail,
  assignParticipantToLabByEmail,
} from '../../services/firestore/labDistributionService';
import { createLab } from '../../services/firestore/labService';
import {
  Banner,
  Button,
  Card,
  EmptyState,
  Header,
  Screen,
  SectionHeader,
  SegmentedControl,
  SelectField,
  spacing,
  StatusBadge,
  Text,
  TextField,
  TopBar,
} from '../../shared/ui';
import { colors, radius } from '../../theme/tokens';
import { useAuth } from '../../state';
import { useLabManagement } from './useLabManagement';

type Props = NativeStackScreenProps<RootStackParamList, 'AslabLabImport'>;

export function AslabLabImportScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const { labs, canManage, managedCourseIds } = useLabManagement();

  const [kind, setKind] = useState<ImportKind>(route.params?.kind ?? 'labs');
  const [targetLabId, setTargetLabId] = useState<string | null>(
    route.params?.labId ?? labs[0]?.id ?? null,
  );
  const [selectedCourseId, setSelectedCourseId] = useState(
    managedCourseIds[0] ?? '',
  );
  const [csvText, setCsvText] = useState('');

  const [labRows, setLabRows] = useState<LabImportRowDraft[]>([]);
  const [memberRows, setMemberRows] = useState<MemberImportRowDraft[]>([]);
  const [editingLabIndex, setEditingLabIndex] = useState<number | null>(null);
  const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(
    null,
  );

  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ImportExecutionSummary | null>(null);
  const [feedback, setFeedback] = useState<{
    tone: 'success' | 'warning' | 'danger';
    title: string;
    message: string;
  } | null>(null);

  const activeLabId = useMemo<string | null>(() => {
    if (targetLabId && labs.some((l) => l.id === targetLabId)) return targetLabId;
    return labs[0]?.id ?? null;
  }, [labs, targetLabId]);

  const labOptions = useMemo(
    () =>
      labs.map((lab) => ({
        value: lab.id,
        label: lab.courseId ? `${lab.name} (${lab.courseId})` : lab.name,
        description: lab.building,
      })),
    [labs],
  );

  const existingLabKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const lab of labs) {
      const cKey = (lab.courseId ?? '').trim().toLowerCase();
      const nKey = lab.name.trim().toLowerCase();
      if (nKey) keys.add(`${cKey}::${nKey}`);
    }
    return keys;
  }, [labs]);

  const handleLoadTemplate = () => {
    const tpl = getCsvTemplate(kind);
    setCsvText(tpl.sampleCsv);
    setSummary(null);
    setFeedback({
      tone: 'success',
      title: `Template ${tpl.filename} dimuat`,
      message: `Kolom: ${tpl.headers.join(', ')}. Anda bisa mengedit baris sebelum memproses pratinjau.`,
    });
  };

  const handleCopyTemplate = () => {
    const tpl = getCsvTemplate(kind);
    Clipboard.setString(tpl.sampleCsv);
    setFeedback({
      tone: 'success',
      title: 'Template disalin',
      message: `Format CSV untuk ${tpl.filename} telah disalin ke clipboard.`,
    });
  };

  const handleParsePreview = () => {
    setSummary(null);
    setFeedback(null);
    setEditingLabIndex(null);
    setEditingMemberIndex(null);

    if (!csvText.trim()) {
      setFeedback({
        tone: 'warning',
        title: 'CSV masih kosong',
        message: 'Muat template atau tempel data CSV terlebih dahulu.',
      });
      return;
    }

    if (kind === 'labs') {
      const parsed = parseLabImportCsv(csvText, selectedCourseId);
      setLabRows(parsed);
      setMemberRows([]);
    } else {
      const parsed = parseMemberImportCsv(csvText);
      setMemberRows(parsed);
      setLabRows([]);
    }
  };

  const toggleLabAccepted = (idx: number) => {
    setLabRows((prev) =>
      prev.map((row, i) =>
        i === idx ? { ...row, accepted: !row.accepted } : row,
      ),
    );
  };

  const updateLabRowField = (
    idx: number,
    patch: Partial<LabImportRowDraft>,
  ) => {
    setLabRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)),
    );
  };

  const toggleMemberAccepted = (idx: number) => {
    setMemberRows((prev) =>
      prev.map((row, i) =>
        i === idx ? { ...row, accepted: !row.accepted } : row,
      ),
    );
  };

  const updateMemberRowField = (
    idx: number,
    patch: Partial<MemberImportRowDraft>,
  ) => {
    setMemberRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)),
    );
  };

  const handleCommitImport = async () => {
    setFeedback(null);
    setSummary(null);

    if (!user || !canManage) {
      setFeedback({
        tone: 'danger',
        title: 'Akses ditolak',
        message: 'Hanya Aslab yang dapat menyimpan data impor.',
      });
      return;
    }

    setImporting(true);
    try {
      if (kind === 'labs') {
        const seenBatch = new Set<string>();
        let succeededCount = 0;
        let failedCount = 0;
        let skippedCount = 0;
        const failures: ImportExecutionSummary['failures'] = [];

        for (const row of labRows) {
          if (!row.accepted) {
            skippedCount += 1;
            continue;
          }
          const validation = validateLabImportDraft(
            row,
            managedCourseIds,
            existingLabKeys,
            seenBatch,
          );
          const dedupeKey = `${row.courseId.trim().toLowerCase()}::${row.name.trim().toLowerCase()}`;
          if (row.name.trim()) seenBatch.add(dedupeKey);

          if (!validation.valid) {
            failedCount += 1;
            failures.push({
              rowNumber: row.rowNumber,
              label: row.name || `Baris ${row.rowNumber}`,
              message: validation.errors.join('; '),
            });
            continue;
          }

          if (validation.duplicate) {
            skippedCount += 1;
            continue;
          }

          const res = await createLab(user.uid, toLabInputFromDraft(row));
          if (res.ok) {
            succeededCount += 1;
          } else {
            failedCount += 1;
            failures.push({
              rowNumber: row.rowNumber,
              label: row.name || `Baris ${row.rowNumber}`,
              message: res.message,
            });
          }
        }

        const totalRows = labRows.length;
        const selectedRows = labRows.filter((r) => r.accepted).length;
        setSummary({
          totalRows,
          selectedRows,
          succeededCount,
          failedCount,
          skippedCount,
          failures,
        });
        setFeedback({
          tone: failedCount > 0 ? 'warning' : 'success',
          title: 'Proses impor lab selesai',
          message: `Berhasil: ${succeededCount}, Gagal: ${failedCount}, Dilewati/Ditolak: ${skippedCount}.`,
        });
        return;
      }

      if (!activeLabId) {
        setFeedback({
          tone: 'danger',
          title: 'Lab tujuan belum dipilih',
          message: 'Pilih lab tujuan sebelum menyimpan impor praktikan/Asprak.',
        });
        return;
      }

      const seenEmails = new Set<string>();
      let succeededCount = 0;
      let failedCount = 0;
      let skippedCount = 0;
      const failures: ImportExecutionSummary['failures'] = [];

      for (const row of memberRows) {
        if (!row.accepted) {
          skippedCount += 1;
          continue;
        }
        const normalizedEmail = row.email.trim().toLowerCase();
        const check = validateMemberEmailFormat(normalizedEmail, seenEmails);
        if (normalizedEmail) seenEmails.add(normalizedEmail);

        if (!check.valid) {
          failedCount += 1;
          failures.push({
            rowNumber: row.rowNumber,
            label: row.email || `Baris ${row.rowNumber}`,
            message: check.errors.join('; '),
          });
          continue;
        }

        if (check.duplicate) {
          skippedCount += 1;
          continue;
        }

        const res =
          kind === 'students'
            ? await assignParticipantToLabByEmail(
                activeLabId,
                normalizedEmail,
                managedCourseIds,
              )
            : await assignAssistantToLabByEmail(
                activeLabId,
                normalizedEmail,
                managedCourseIds,
              );

        if (res.ok) {
          succeededCount += 1;
        } else {
          failedCount += 1;
          failures.push({
            rowNumber: row.rowNumber,
            label: row.email,
            message: res.message,
          });
        }
      }

      const totalRows = memberRows.length;
      const selectedRows = memberRows.filter((r) => r.accepted).length;
      setSummary({
        totalRows,
        selectedRows,
        succeededCount,
        failedCount,
        skippedCount,
        failures,
      });
      setFeedback({
        tone: failedCount > 0 ? 'warning' : 'success',
        title:
          kind === 'students'
            ? 'Proses impor praktikan selesai'
            : 'Proses impor Asprak selesai',
        message: `Berhasil: ${succeededCount}, Gagal: ${failedCount}, Dilewati/Ditolak: ${skippedCount}.`,
      });
    } finally {
      setImporting(false);
    }
  };

  const currentTemplate = getCsvTemplate(kind);
  const hasPreviewRows =
    kind === 'labs' ? labRows.length > 0 : memberRows.length > 0;

  return (
    <Screen withDock={false}>
      <TopBar onBack={() => navigation.goBack()} />
      <Header
        title="Pratinjau & Impor CSV"
        description="Gunakan template terpisah untuk Lab, Praktikan, dan Asprak. Periksa & edit baris sebelum menyimpan."
      />

      {feedback ? (
        <Banner
          tone={feedback.tone}
          title={feedback.title}
          message={feedback.message}
        />
      ) : null}

      <Card style={styles.card}>
        <SectionHeader title="1. Jenis impor & cakupan" />
        <SegmentedControl<ImportKind>
          accessibilityLabel="Jenis data impor CSV"
          value={kind}
          onChange={(next) => {
            setKind(next);
            setLabRows([]);
            setMemberRows([]);
            setSummary(null);
          }}
          options={[
            { value: 'labs', label: 'Lab' },
            { value: 'students', label: 'Praktikan' },
            { value: 'assistants', label: 'Asprak' },
          ]}
        />

        {kind === 'labs' ? (
          <TextField
            label="Mata kuliah default (opsional)"
            value={selectedCourseId}
            onChangeText={setSelectedCourseId}
            placeholder={
              managedCourseIds[0]
                ? `Mis. ${managedCourseIds[0]}`
                : 'Kode/ID mata kuliah'
            }
          />
        ) : (
          <SelectField
            label="Lab tujuan"
            placeholder="Pilih lab tujuan"
            value={activeLabId}
            options={labOptions}
            onChange={(val) => setTargetLabId(val)}
          />
        )}

        <Text variant="caption" tone="muted">
          Nama template: {currentTemplate.filename} · Kolom:{' '}
          {currentTemplate.headers.join(', ')}
        </Text>

        <View style={styles.rowActions}>
          <Button
            label="Muat contoh template"
            variant="outline"
            onPress={handleLoadTemplate}
          />
          <Button
            label="Salin template CSV"
            variant="outline"
            onPress={handleCopyTemplate}
          />
        </View>

        <TextField
          label="Isi CSV"
          value={csvText}
          onChangeText={setCsvText}
          placeholder={currentTemplate.sampleCsv}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Button
          label="Tampilkan pratinjau baris"
          variant="accent"
          onPress={handleParsePreview}
        />
      </Card>

      {hasPreviewRows ? (
        <View style={styles.previewSection}>
          <SectionHeader
            title={`2. Pratinjau baris (${kind === 'labs' ? labRows.length : memberRows.length} baris)`}
          />

          {kind === 'labs'
            ? labRows.map((row, idx) => {
                const isEditing = editingLabIndex === idx;
                return (
                  <Card key={`${row.rowNumber}-${idx}`} style={styles.rowCard}>
                    <View style={styles.rowHeader}>
                      <Text variant="label">
                        Baris {row.rowNumber}: {row.name || '(Nama kosong)'}
                      </Text>
                      <StatusBadge
                        label={row.accepted ? 'Diterima' : 'Ditolak'}
                        tone={row.accepted ? 'success' : 'neutral'}
                      />
                    </View>
                    <Text variant="caption" tone="muted">
                      Gedung: {row.building || '-'} · MK: {row.courseId || '-'} ·
                      Koordinat: {row.latitudeText || '-'},{' '}
                      {row.longitudeText || '-'} · Radius: {row.radiusText} m ·
                      Toleransi: {row.lateToleranceText} mnt
                    </Text>

                    {isEditing ? (
                      <View style={styles.editBox}>
                        <TextField
                          label="Nama lab"
                          value={row.name}
                          onChangeText={(v) =>
                            updateLabRowField(idx, { name: v })
                          }
                        />
                        <TextField
                          label="Gedung"
                          value={row.building}
                          onChangeText={(v) =>
                            updateLabRowField(idx, { building: v })
                          }
                        />
                        <TextField
                          label="Latitude"
                          value={row.latitudeText}
                          onChangeText={(v) =>
                            updateLabRowField(idx, { latitudeText: v })
                          }
                        />
                        <TextField
                          label="Longitude"
                          value={row.longitudeText}
                          onChangeText={(v) =>
                            updateLabRowField(idx, { longitudeText: v })
                          }
                        />
                        <TextField
                          label="Radius (m)"
                          value={row.radiusText}
                          onChangeText={(v) =>
                            updateLabRowField(idx, { radiusText: v })
                          }
                        />
                        <TextField
                          label="Toleransi (menit)"
                          value={row.lateToleranceText}
                          onChangeText={(v) =>
                            updateLabRowField(idx, { lateToleranceText: v })
                          }
                        />
                      </View>
                    ) : null}

                    <View style={styles.rowButtons}>
                      <Pressable
                        onPress={() => toggleLabAccepted(idx)}
                        style={styles.miniBtn}
                      >
                        <Text variant="caption" tone="violet">
                          {row.accepted ? 'Tolak baris' : 'Terima baris'}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          setEditingLabIndex(isEditing ? null : idx)
                        }
                        style={styles.miniBtn}
                      >
                        <Text variant="caption" tone="violet">
                          {isEditing ? 'Selesai edit' : 'Edit baris'}
                        </Text>
                      </Pressable>
                    </View>
                  </Card>
                );
              })
            : memberRows.map((row, idx) => {
                const isEditing = editingMemberIndex === idx;
                return (
                  <Card key={`${row.rowNumber}-${idx}`} style={styles.rowCard}>
                    <View style={styles.rowHeader}>
                      <Text variant="label">
                        Baris {row.rowNumber}: {row.email || '(Email kosong)'}
                      </Text>
                      <StatusBadge
                        label={row.accepted ? 'Diterima' : 'Ditolak'}
                        tone={row.accepted ? 'success' : 'neutral'}
                      />
                    </View>
                    {row.note ? (
                      <Text variant="caption" tone="muted">
                        Catatan: {row.note}
                      </Text>
                    ) : null}

                    {isEditing ? (
                      <View style={styles.editBox}>
                        <TextField
                          label="Email akun"
                          value={row.email}
                          onChangeText={(v) =>
                            updateMemberRowField(idx, { email: v })
                          }
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                        <TextField
                          label="Catatan"
                          value={row.note}
                          onChangeText={(v) =>
                            updateMemberRowField(idx, { note: v })
                          }
                        />
                      </View>
                    ) : null}

                    <View style={styles.rowButtons}>
                      <Pressable
                        onPress={() => toggleMemberAccepted(idx)}
                        style={styles.miniBtn}
                      >
                        <Text variant="caption" tone="violet">
                          {row.accepted ? 'Tolak baris' : 'Terima baris'}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          setEditingMemberIndex(isEditing ? null : idx)
                        }
                        style={styles.miniBtn}
                      >
                        <Text variant="caption" tone="violet">
                          {isEditing ? 'Selesai edit' : 'Edit baris'}
                        </Text>
                      </Pressable>
                    </View>
                  </Card>
                );
              })}

          <Button
            label={importing ? 'Menyimpan baris terpilih…' : 'Simpan baris terpilih'}
            loading={importing}
            disabled={importing}
            onPress={handleCommitImport}
          />
        </View>
      ) : (
        <EmptyState
          title="Belum ada pratinjau baris"
          description="Muat template atau tempel CSV lalu tekan 'Tampilkan pratinjau baris'."
        />
      )}

      {summary ? (
        <Card style={styles.card}>
          <SectionHeader title="Ringkasan hasil impor" />
          <Text variant="body">
            Total baris: {summary.totalRows} · Dipilih: {summary.selectedRows} ·
            Berhasil: {summary.succeededCount} · Gagal: {summary.failedCount} ·
            Ditolak/Dilewati: {summary.skippedCount}
          </Text>
          {summary.failures.map((f) => (
            <Text
              key={`${f.rowNumber}-${f.label}`}
              variant="caption"
              tone="danger"
            >
              Baris {f.rowNumber} ({f.label}): {f.message}
            </Text>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderRadius: radius.lg,
  },
  rowActions: {
    gap: spacing.sm,
  },
  previewSection: {
    gap: spacing.md,
  },
  rowCard: {
    gap: spacing.sm,
    borderRadius: radius.md,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  editBox: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  rowButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  miniBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.lavenderSubtle,
  },
});