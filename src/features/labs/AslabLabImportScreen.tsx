import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { canManageLabMaster } from '../../domain/asprakScope';
import {
  buildImportPreviewRows,
  type ImportEntityType,
  type ImportExecutionSummary,
  type ImportPreviewRow,
} from '../../domain/labImportRules';
import {
  executeLabImport,
  getImportTemplateCsv,
} from '../../services/firestore/labImportService';
import {
  BackButton,
  Banner,
  Button,
  Screen,
  SectionHeader,
  SegmentedControl,
  spacing,
  Text,
  TextField,
} from '../../shared/ui';
import { useAuth } from '../../state';

type Props = {
  navigation: { goBack: () => void };
};

export function AslabLabImportScreen({ navigation }: Props) {
  const { user } = useAuth();
  const isAuthorized = canManageLabMaster(user?.role);

  const [entityType, setEntityType] = useState<ImportEntityType>('lab');
  const [csvText, setCsvText] = useState(() => getImportTemplateCsv('lab'));
  const [rows, setRows] = useState<ImportPreviewRow[]>(() =>
    buildImportPreviewRows(getImportTemplateCsv('lab'), 'lab'),
  );
  const [editingRowNumber, setEditingRowNumber] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<ImportExecutionSummary | null>(null);

  const readyCount = useMemo(
    () =>
      rows.filter((r) => r.decision === 'accepted' && r.errors.length === 0)
        .length,
    [rows],
  );

  if (!isAuthorized) {
    return (
      <Screen withDock={false}>
        <BackButton onPress={() => navigation.goBack()} />
        <Banner
          tone="warning"
          title="Kewenangan Aslab"
          message="Impor massal lab, praktikan, dan asprak hanya dapat diakses oleh Aslab."
        />
      </Screen>
    );
  }

  const handleEntityChange = (nextType: ImportEntityType) => {
    setEntityType(nextType);
    const template = getImportTemplateCsv(nextType);
    setCsvText(template);
    setRows(buildImportPreviewRows(template, nextType));
    setEditingRowNumber(null);
    setSummary(null);
  };

  const handleBuildPreview = () => {
    setSummary(null);
    setRows(buildImportPreviewRows(csvText, entityType));
  };

  const handleDecision = (
    rowNumber: number,
    decision: 'accepted' | 'rejected',
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.rowNumber === rowNumber
          ? {
              ...row,
              decision:
                decision === 'accepted' && row.errors.length > 0
                  ? 'rejected'
                  : decision,
            }
          : row,
      ),
    );
  };

  const handleEditStart = (row: ImportPreviewRow) => {
    setEditingRowNumber(row.rowNumber);
    setEditText(row.rawText);
  };

  const handleEditSave = (rowNumber: number) => {
    const reparsed = buildImportPreviewRows(editText, entityType)[0];
    if (!reparsed) return;

    setRows((prev) =>
      prev.map((row) =>
        row.rowNumber === rowNumber
          ? {
              ...reparsed,
              id: row.id,
              rowNumber,
              decision: reparsed.errors.length === 0 ? 'accepted' : 'rejected',
            }
          : row,
      ),
    );
    setEditingRowNumber(null);
    setEditText('');
  };

  const handleExecute = async () => {
    if (!user?.uid) return;
    setSubmitting(true);
    try {
      const result = await executeLabImport(user.uid, entityType, rows);
      setSummary(result);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen withDock={false}>
      <BackButton onPress={() => navigation.goBack()} />

      <SectionHeader title="Tipe Impor" />
      <SegmentedControl<ImportEntityType>
        accessibilityLabel="Tipe impor data"
        value={entityType}
        onChange={handleEntityChange}
        options={[
          { value: 'lab', label: 'Lab' },
          { value: 'praktikan', label: 'Praktikan' },
          { value: 'asprak', label: 'Asprak' },
        ]}
      />

      <View style={styles.section}>
        <SectionHeader title={`Template & Data CSV (${entityType})`} />
        <Button
          label={`Reset Template ${entityType}`}
          variant="outline"
          onPress={() => handleEntityChange(entityType)}
        />
        <TextField
          label="Konten CSV"
          value={csvText}
          onChangeText={setCsvText}
          multiline
          placeholder="Tempel atau ubah baris CSV…"
        />
        <Button label="Pratinjau Data" onPress={handleBuildPreview} />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title={`Pratinjau Baris (${readyCount}/${rows.length} siap diproses)`}
        />
        {rows.map((row) => (
          <View key={row.id} style={styles.rowBox}>
            <Text variant="body">
              Baris {row.rowNumber} ·{' '}
              {row.decision === 'accepted' && row.errors.length === 0
                ? 'Diterima'
                : 'Ditolak / Tidak Valid'}
            </Text>
            <Text variant="caption" tone="muted">
              {Object.entries(row.fields)
                .filter(([, val]) => Boolean(val))
                .map(([key, val]) => `${key}: ${val}`)
                .join(' | ')}
            </Text>
            {row.errors.map((err) => (
              <Text key={err} variant="caption">
                Error: {err}
              </Text>
            ))}
            {row.warnings.map((warn) => (
              <Text key={warn} variant="caption" tone="muted">
                Info: {warn}
              </Text>
            ))}

            {editingRowNumber === row.rowNumber ? (
              <View style={styles.section}>
                <TextField
                  label={`Edit Baris ${row.rowNumber}`}
                  value={editText}
                  onChangeText={setEditText}
                />
                <Button
                  label="Terapkan Baris"
                  onPress={() => handleEditSave(row.rowNumber)}
                />
              </View>
            ) : (
              <View style={styles.actions}>
                <Button
                  label="Terima"
                  variant="outline"
                  disabled={row.errors.length > 0}
                  onPress={() => handleDecision(row.rowNumber, 'accepted')}
                />
                <Button
                  label="Tolak"
                  variant="outline"
                  onPress={() => handleDecision(row.rowNumber, 'rejected')}
                />
                <Button
                  label="Edit"
                  variant="outline"
                  onPress={() => handleEditStart(row)}
                />
              </View>
            )}
          </View>
        ))}
      </View>

      <Button
        label={submitting ? 'Memproses Impor…' : 'Eksekusi Baris Diterima'}
        loading={submitting}
        disabled={submitting || readyCount === 0}
        onPress={handleExecute}
      />

      {summary ? (
        <View style={styles.section}>
          <Banner
            tone={summary.failedCount > 0 ? 'warning' : 'success'}
            title="Ringkasan Eksekusi Impor"
            message={`Total: ${summary.totalRows} | Berhasil: ${summary.succeededCount} | Gagal: ${summary.failedCount} | Dilewati/Ditolak: ${summary.rejectedCount}`}
          />
          {summary.outcomes.map((item) => (
            <Text key={item.rowNumber} variant="caption">
              Baris {item.rowNumber} [{item.status}]: {item.message}
            </Text>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  rowBox: { gap: spacing.xs },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});