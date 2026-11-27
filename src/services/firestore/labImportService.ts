import { httpsCallable } from 'firebase/functions';

import { parseCoordinate } from '../../domain/geofenceRules';
import {
  type ImportEntityType,
  type ImportExecutionSummary,
  type ImportPreviewRow,
  summarizeImportExecution,
} from '../../domain/labImportRules';
import { functions } from '../firebase';
import { changeLabAssignment } from './labDistributionService';

const headers: Record<ImportEntityType, string> = {
  lab: 'name,building,latitude,longitude,radiusMeters,isActive,description',
  praktikan: 'nim,name,classCode,labName',
  asprak: 'nimOrEmail,name,role,labName',
};

export function getImportTemplateCsv(entityType: ImportEntityType): string {
  return headers[entityType] + '\n';
}

type ImportTarget = { courseId: string; labId?: string; labName?: string };

export async function executeLabImport(
  entityType: ImportEntityType,
  rows: ImportPreviewRow[],
  target: ImportTarget,
): Promise<ImportExecutionSummary> {
  const executed = new Map<number, { ok: boolean; message: string }>();
  const saveLab = httpsCallable(functions, 'importLab');
  for (const row of rows) {
    if (row.decision !== 'accepted' || row.errors.length > 0) continue;
    try {
      if (entityType === 'lab') {
        const fields = row.fields;
        await saveLab({
          courseId: target.courseId,
          input: {
            name: fields.name,
            building: fields.building,
            description: fields.description,
            latitude: parseCoordinate(fields.latitude),
            longitude: parseCoordinate(fields.longitude),
            radiusMeters: Number(fields.radiusMeters),
            isActive: fields.isActive !== 'false',
          },
        });
      } else {
        const namedLab = row.fields.labName?.trim().toLowerCase();
        if (
          !target.labId ||
          (namedLab && namedLab !== target.labName?.trim().toLowerCase())
        ) {
          executed.set(row.rowNumber, {
            ok: false,
            message: 'Nama lab pada baris berbeda dari lab tujuan.',
          });
          continue;
        }
        const result = await changeLabAssignment({
          action: entityType === 'praktikan' ? 'participant' : 'assistant',
          identifier:
            entityType === 'praktikan' ? row.fields.nim : row.fields.nimOrEmail,
          labId: target.labId,
        });
        if (!result.ok) {
          executed.set(row.rowNumber, { ok: false, message: result.message });
          continue;
        }
      }
      executed.set(row.rowNumber, { ok: true, message: 'Data tersimpan.' });
    } catch (error) {
      executed.set(row.rowNumber, {
        ok: false,
        message:
          error instanceof Error ? error.message : 'Gagal memproses baris.',
      });
    }
  }
  return summarizeImportExecution(entityType, rows, executed);
}
