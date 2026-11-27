import {
  DEFAULT_RADIUS_METERS,
  MAX_RADIUS_METERS,
  MIN_RADIUS_METERS,
  parseCoordinate,
} from './geofenceRules';

export type ImportEntityType = 'lab' | 'praktikan' | 'asprak';

export type ImportRowStatus = 'valid' | 'warning' | 'invalid';

export type ImportRowDecision = 'accepted' | 'rejected';

export type ImportPreviewRow = {
  id: string;
  rowNumber: number;
  rawText: string;
  fields: Record<string, string>;
  status: ImportRowStatus;
  decision: ImportRowDecision;
  errors: string[];
  warnings: string[];
};

export type ImportRowOutcome = {
  rowNumber: number;
  ok: boolean;
  status: 'imported' | 'skipped' | 'failed';
  message: string;
};

export type ImportExecutionSummary = {
  entityType: ImportEntityType;
  totalRows: number;
  acceptedCount: number;
  rejectedCount: number;
  succeededCount: number;
  failedCount: number;
  outcomes: ImportRowOutcome[];
};

function detectDelimiter(lines: string[]): ',' | ';' | '\t' {
  const sample = lines.slice(0, 5).join('\n');
  const tabs = (sample.match(/\t/g) ?? []).length;
  const semis = (sample.match(/;/g) ?? []).length;
  const commas = (sample.match(/,/g) ?? []).length;

  if (tabs > semis && tabs > commas) return '\t';
  if (semis > commas) return ';';
  return ',';
}

export function parseCsvLine(line: string, delimiter = ','): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }

  cells.push(current.trim());
  return cells;
}

function isHeaderRow(cells: string[], entityType: ImportEntityType): boolean {
  const lower = cells.map((c) => c.trim().toLowerCase());
  if (entityType === 'lab') {
    return (
      lower.includes('name') ||
      lower.includes('nama') ||
      lower.includes('latitude')
    );
  }
  if (entityType === 'praktikan') {
    return (
      lower.includes('nim') || lower.includes('name') || lower.includes('nama')
    );
  }
  return (
    lower.includes('nim') || lower.includes('email') || lower.includes('role')
  );
}

function parseActiveFlag(raw: string | undefined): boolean {
  if (!raw || raw.trim() === '') return true;
  const val = raw.trim().toLowerCase();
  if (['false', '0', 'nonaktif', 'inactive', 'no', 'tidak'].includes(val)) {
    return false;
  }
  return true;
}

export function buildImportPreviewRows(
  csvContent: string,
  entityType: ImportEntityType,
  existingKeys: Set<string> = new Set(),
): ImportPreviewRow[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return [];

  const delimiter = detectDelimiter(lines);
  const parsed = lines.map((line) => parseCsvLine(line, delimiter));
  const startIdx = isHeaderRow(parsed[0], entityType) ? 1 : 0;

  const seenBatchKeys = new Set<string>();
  const previewRows: ImportPreviewRow[] = [];

  for (let i = startIdx; i < parsed.length; i += 1) {
    const cells = parsed[i];
    const rowNumber = i + 1;
    const errors: string[] = [];
    const warnings: string[] = [];
    let fields: Record<string, string> = {};

    if (entityType === 'lab') {
      const [
        name = '',
        building = '',
        latRaw = '',
        lngRaw = '',
        radiusRaw = String(DEFAULT_RADIUS_METERS),
        activeRaw = 'true',
        description = '',
      ] = cells;

      const lat = parseCoordinate(latRaw);
      const lng = parseCoordinate(lngRaw);
      const radius = Number(radiusRaw.trim());
      const isActive = parseActiveFlag(activeRaw);
      const key = `${name.trim().toLowerCase()}::${building.trim().toLowerCase()}`;

      fields = {
        name: name.trim(),
        building: building.trim(),
        latitude: latRaw.trim(),
        longitude: lngRaw.trim(),
        radiusMeters: radiusRaw.trim() || String(DEFAULT_RADIUS_METERS),
        isActive: String(isActive),
        description: description.trim(),
      };

      if (!name.trim()) errors.push('Nama lab wajib diisi.');
      if (!building.trim()) errors.push('Gedung/ruang wajib diisi.');
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        errors.push('Latitude harus berupa angka antara -90 sampai 90.');
      }
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        errors.push('Longitude harus berupa angka antara -180 sampai 180.');
      }
      if (
        !Number.isInteger(radius) ||
        radius < MIN_RADIUS_METERS ||
        radius > MAX_RADIUS_METERS
      ) {
        errors.push(
          `Radius harus bilangan bulat ${MIN_RADIUS_METERS}–${MAX_RADIUS_METERS} m.`,
        );
      }

      if (key !== '::') {
        if (seenBatchKeys.has(key)) {
          errors.push('Duplikat lab pada file impor.');
        } else if (existingKeys.has(key)) {
          warnings.push(
            'Lab sudah terdaftar; impor ulang akan memperbarui data.',
          );
        }
        seenBatchKeys.add(key);
      }
    } else if (entityType === 'praktikan') {
      const [nim = '', name = '', classCode = '', labName = ''] = cells;
      const cleanNim = nim.trim();
      const key = cleanNim.toLowerCase();

      fields = {
        nim: cleanNim,
        name: name.trim(),
        classCode: classCode.trim(),
        labName: labName.trim(),
      };

      if (!cleanNim) errors.push('NIM praktikan wajib diisi.');
      if (!name.trim()) errors.push('Nama praktikan wajib diisi.');

      if (key) {
        if (seenBatchKeys.has(key)) {
          errors.push(`Duplikat NIM ${cleanNim} dalam file impor.`);
        } else if (existingKeys.has(key)) {
          warnings.push('Praktikan sudah ada; pemrosesan bersifat idempoten.');
        }
        seenBatchKeys.add(key);
      }
    } else {
      const [nimOrEmail = '', name = '', roleRaw = 'asprak', labName = ''] =
        cells;
      const cleanId = nimOrEmail.trim();
      const normalizedRole = roleRaw.trim().toLowerCase();
      const key = cleanId.toLowerCase();

      fields = {
        nimOrEmail: cleanId,
        name: name.trim(),
        role: normalizedRole,
        labName: labName.trim(),
      };

      if (!cleanId) errors.push('NIM atau email asprak wajib diisi.');
      if (!name.trim()) errors.push('Nama asprak wajib diisi.');
      if (normalizedRole !== 'asprak') {
        errors.push('Role harus "asprak".');
      }

      if (key) {
        if (seenBatchKeys.has(key)) {
          errors.push(`Duplikat identitas ${cleanId} dalam file impor.`);
        } else if (existingKeys.has(key)) {
          warnings.push('Asprak sudah ada; pemrosesan bersifat idempoten.');
        }
        seenBatchKeys.add(key);
      }
    }

    const status: ImportRowStatus =
      errors.length > 0 ? 'invalid' : warnings.length > 0 ? 'warning' : 'valid';

    previewRows.push({
      id: `row-${rowNumber}`,
      rowNumber,
      rawText: lines[i],
      fields,
      status,
      decision: errors.length === 0 ? 'accepted' : 'rejected',
      errors,
      warnings,
    });
  }

  return previewRows;
}

export function summarizeImportExecution(
  entityType: ImportEntityType,
  rows: ImportPreviewRow[],
  executedMap: Map<number, { ok: boolean; message: string }>,
): ImportExecutionSummary {
  let acceptedCount = 0;
  let rejectedCount = 0;
  let succeededCount = 0;
  let failedCount = 0;

  const outcomes: ImportRowOutcome[] = rows.map((row) => {
    const isEligible = row.decision === 'accepted' && row.errors.length === 0;
    if (!isEligible) {
      rejectedCount += 1;
      return {
        rowNumber: row.rowNumber,
        ok: false,
        status: 'skipped',
        message:
          row.errors[0] ??
          (row.decision === 'rejected'
            ? 'Ditolak pada pratinjau.'
            : 'Baris belum valid.'),
      };
    }

    acceptedCount += 1;
    const result = executedMap.get(row.rowNumber);
    if (result?.ok) {
      succeededCount += 1;
      return {
        rowNumber: row.rowNumber,
        ok: true,
        status: 'imported',
        message: result.message || 'Berhasil diimpor.',
      };
    }

    failedCount += 1;
    return {
      rowNumber: row.rowNumber,
      ok: false,
      status: 'failed',
      message: result?.message || 'Gagal mengimpor baris.',
    };
  });

  return {
    entityType,
    totalRows: rows.length,
    acceptedCount,
    rejectedCount,
    succeededCount,
    failedCount,
    outcomes,
  };
}
