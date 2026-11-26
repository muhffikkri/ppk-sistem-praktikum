import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';

import { parseCoordinate } from '../../domain/geofenceRules';
import {
  type ImportEntityType,
  type ImportExecutionSummary,
  type ImportPreviewRow,
  summarizeImportExecution,
} from '../../domain/labImportRules';
import { db } from '../firebase';

const LABS = 'labs';
const IMPORT_RECORDS = 'labImportRecords';

export function getImportTemplateCsv(entityType: ImportEntityType): string {
  if (entityType === 'lab') {
    return [
      'name,building,latitude,longitude,radiusMeters,isActive,description',
      'Lab Jaringan,Gedung E Lt. 2,-7.050000,110.438000,50,true,Laboratorium jaringan komputer',
    ].join('\n');
  }

  if (entityType === 'praktikan') {
    return [
      'nim,name,classCode,labName',
      '24060124120001,Budi Santoso,IF-A,Lab Jaringan',
    ].join('\n');
  }

  return [
    'nimOrEmail,name,role,labName',
    '24060123120009,Siti Rahma,asprak,Lab Jaringan',
  ].join('\n');
}

function buildDeterministicDocId(prefix: string, rawKey: string): string {
  const normalized = rawKey
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${prefix}_${normalized || 'record'}`;
}

export async function executeLabImport(
  actorUid: string,
  entityType: ImportEntityType,
  rows: ImportPreviewRow[],
): Promise<ImportExecutionSummary> {
  const now = new Date().toISOString();
  const executedMap = new Map<number, { ok: boolean; message: string }>();

  for (const row of rows) {
    if (row.decision !== 'accepted' || row.errors.length > 0) {
      continue;
    }

    try {
      if (entityType === 'lab') {
        const name = row.fields.name ?? '';
        const building = row.fields.building ?? '';
        const latitude = parseCoordinate(row.fields.latitude ?? '');
        const longitude = parseCoordinate(row.fields.longitude ?? '');
        const radiusMeters = Number(row.fields.radiusMeters ?? '50');
        const isActive = row.fields.isActive !== 'false';
        const description = row.fields.description?.trim() || null;

        const existingSnap = await getDocs(
          query(collection(db, LABS), where('name', '==', name)),
        );
        const targetRef = !existingSnap.empty
          ? existingSnap.docs[0].ref
          : doc(db, LABS, buildDeterministicDocId('lab', `${name}_${building}`));

        await setDoc(
          targetRef,
          {
            name,
            building,
            description,
            location: { latitude, longitude },
            radiusMeters,
            isActive,
            updatedAt: now,
            updatedBy: actorUid,
            ...(existingSnap.empty
              ? { createdAt: now, createdBy: actorUid }
              : {}),
          },
          { merge: true },
        );

        executedMap.set(row.rowNumber, {
          ok: true,
          message: existingSnap.empty
            ? `Lab "${name}" ditambahkan.`
            : `Lab "${name}" diperbarui (idempoten).`,
        });
      } else {
        const keyField = entityType === 'praktikan' ? 'nim' : 'nimOrEmail';
        const identifier = row.fields[keyField] ?? '';
        const docId = buildDeterministicDocId(entityType, identifier);
        const recordRef = doc(db, IMPORT_RECORDS, `${entityType}_${docId}`);

        await setDoc(
          recordRef,
          {
            entityType,
            identifier,
            fields: row.fields,
            updatedAt: now,
            updatedBy: actorUid,
          },
          { merge: true },
        );

        executedMap.set(row.rowNumber, {
          ok: true,
          message: `Data ${entityType} (${identifier}) diproses secara idempoten.`,
        });
      }
    } catch (e) {
      executedMap.set(row.rowNumber, {
        ok: false,
        message: e instanceof Error ? e.message : 'Gagal memproses baris.',
      });
    }
  }

  return summarizeImportExecution(entityType, rows, executedMap);
}
