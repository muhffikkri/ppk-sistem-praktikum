import {
  DEFAULT_LATE_TOLERANCE_MINUTES,
  DEFAULT_RADIUS_METERS,
  hasLabInputErrors,
  parseCoordinate,
  validateLabInput,
} from './geofenceRules';
import type { LabInput } from './geoTypes';

export type ImportKind = 'labs' | 'students' | 'assistants';

export type LabImportRowDraft = {
  rowNumber: number;
  name: string;
  building: string;
  description: string;
  courseId: string;
  latitudeText: string;
  longitudeText: string;
  radiusText: string;
  lateToleranceText: string;
  isActive: boolean;
  accepted: boolean;
};

export type MemberImportRowDraft = {
  rowNumber: number;
  email: string;
  note: string;
  accepted: boolean;
};

export type ImportRowValidation = {
  valid: boolean;
  errors: string[];
  duplicate: boolean;
};

export type ImportExecutionSummary = {
  totalRows: number;
  selectedRows: number;
  succeededCount: number;
  failedCount: number;
  skippedCount: number;
  failures: { rowNumber: number; label: string; message: string }[];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getCsvTemplate(kind: ImportKind): {
  filename: string;
  headers: string[];
  sampleCsv: string;
} {
  if (kind === 'labs') {
    const headers = [
      'name',
      'building',
      'courseId',
      'latitude',
      'longitude',
      'radiusMeters',
      'lateToleranceMinutes',
      'isActive',
      'description',
    ];
    const sampleCsv = [
      headers.join(','),
      `Lab RPL 1,Gedung B Lt. 3,PPK-A1,-7.05068,110.43828,${DEFAULT_RADIUS_METERS},${DEFAULT_LATE_TOLERANCE_MINUTES},true,Lab utama`,
    ].join('\n');
    return { filename: 'template-impor-lab.csv', headers, sampleCsv };
  }

  if (kind === 'students') {
    const headers = ['email', 'note'];
    const sampleCsv = [
      headers.join(','),
      'praktikan1@example.com,Kelompok A1',
      'praktikan2@example.com,Kelompok A1',
    ].join('\n');
    return {
      filename: 'template-impor-praktikan.csv',
      headers,
      sampleCsv,
    };
  }

  const headers = ['email', 'note'];
  const sampleCsv = [
    headers.join(','),
    'asprak1@example.com,Penanggung jawab sesi pagi',
  ].join('\n');
  return { filename: 'template-impor-asprak.csv', headers, sampleCsv };
}

/** Parser CSV sederhana yang mendukung tanda kutip ganda (") dan koma di dalam kutip. */
export function parseCsvRows(rawCsv: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  const text = rawCsv
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        currentCell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if (ch === '\n' && !inQuotes) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += ch;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function isHeaderRow(cells: string[], expectedFirstCols: string[]): boolean {
  const first = (cells[0] ?? '').toLowerCase();
  return expectedFirstCols.includes(first);
}

export function parseLabImportCsv(
  rawCsv: string,
  defaultCourseId: string,
): LabImportRowDraft[] {
  const rows = parseCsvRows(rawCsv);
  if (rows.length === 0) return [];

  const startIdx = isHeaderRow(rows[0], ['name', 'nama', 'nama_lab']) ? 1 : 0;
  const drafts: LabImportRowDraft[] = [];

  for (let i = startIdx; i < rows.length; i += 1) {
    const cols = rows[i];
    const activeRaw = (cols[7] ?? 'true').toLowerCase();
    drafts.push({
      rowNumber: i + 1,
      name: cols[0] ?? '',
      building: cols[1] ?? '',
      description: cols[8] ?? '',
      courseId: (cols[2] ?? '').trim() || defaultCourseId,
      latitudeText: cols[3] ?? '',
      longitudeText: cols[4] ?? '',
      radiusText: cols[5] ?? String(DEFAULT_RADIUS_METERS),
      lateToleranceText: cols[6] ?? String(DEFAULT_LATE_TOLERANCE_MINUTES),
      isActive:
        activeRaw !== 'false' && activeRaw !== '0' && activeRaw !== 'nonaktif',
      accepted: true,
    });
  }
  return drafts;
}

export function parseMemberImportCsv(rawCsv: string): MemberImportRowDraft[] {
  const rows = parseCsvRows(rawCsv);
  if (rows.length === 0) return [];

  const startIdx = isHeaderRow(rows[0], ['email', 'e-mail']) ? 1 : 0;
  const drafts: MemberImportRowDraft[] = [];

  for (let i = startIdx; i < rows.length; i += 1) {
    const cols = rows[i];
    drafts.push({
      rowNumber: i + 1,
      email: cols[0] ?? '',
      note: cols[1] ?? '',
      accepted: true,
    });
  }
  return drafts;
}

export function toLabInputFromDraft(draft: LabImportRowDraft): LabInput {
  return {
    name: draft.name,
    building: draft.building,
    description: draft.description ? draft.description : null,
    courseId: draft.courseId.trim() ? draft.courseId.trim() : null,
    latitude: parseCoordinate(draft.latitudeText),
    longitude: parseCoordinate(draft.longitudeText),
    radiusMeters: Number(draft.radiusText.trim()),
    lateToleranceMinutes: Number(draft.lateToleranceText.trim()),
    isActive: draft.isActive,
  };
}

export function validateLabImportDraft(
  draft: LabImportRowDraft,
  allowedCourseIds: string[],
  existingLabKeys: Set<string>,
  seenKeysInBatch: Set<string>,
): ImportRowValidation {
  const errors: string[] = [];
  const input = toLabInputFromDraft(draft);
  const fieldErrors = validateLabInput(input);
  if (hasLabInputErrors(fieldErrors)) {
    errors.push(...Object.values(fieldErrors));
  }

  if (
    allowedCourseIds.length > 0 &&
    draft.courseId.trim() &&
    !allowedCourseIds.includes(draft.courseId.trim())
  ) {
    errors.push('Mata kuliah di luar cakupan Aslab');
  }

  const dedupeKey = `${draft.courseId.trim().toLowerCase()}::${draft.name.trim().toLowerCase()}`;
  const duplicate =
    Boolean(draft.name.trim()) &&
    (existingLabKeys.has(dedupeKey) || seenKeysInBatch.has(dedupeKey));

  return {
    valid: errors.length === 0,
    errors,
    duplicate,
  };
}

export function validateMemberEmailFormat(
  email: string,
  seenEmailsInBatch: Set<string>,
): ImportRowValidation {
  const normalized = email.trim().toLowerCase();
  const errors: string[] = [];
  if (!normalized || !EMAIL_RE.test(normalized)) {
    errors.push('Format email tidak valid');
  }
  const duplicate = Boolean(normalized) && seenEmailsInBatch.has(normalized);
  return {
    valid: errors.length === 0,
    errors,
    duplicate,
  };
}