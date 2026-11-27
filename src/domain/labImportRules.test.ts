import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildImportPreviewRows,
  summarizeImportExecution,
} from './labImportRules';

describe('labImportRules', () => {
  it('memvalidasi baris lab dan mendeteksi duplikat dalam batch', () => {
    const csv = [
      'name,building,latitude,longitude,radiusMeters,isActive,description',
      'Lab RPL,Gedung B,-7.05068,110.43828,50,true,Lab RPL',
      'Lab RPL,Gedung B,-7.05068,110.43828,50,true,Duplikat',
      'Lab Rusak,,120,200,2,invalid,Invalid',
    ].join('\n');

    const rows = buildImportPreviewRows(csv, 'lab');
    assert.equal(rows.length, 3);
    assert.equal(rows[0].errors.length, 0);
    assert.equal(rows[0].decision, 'accepted');

    assert.ok(rows[1].errors.some((e) => e.toLowerCase().includes('duplikat')));
    assert.equal(rows[1].decision, 'rejected');

    assert.ok(rows[2].errors.length >= 3);
    assert.equal(rows[2].decision, 'rejected');
  });

  it('memvalidasi baris praktikan dan asprak termasuk role', () => {
    const asprakCsv = [
      'nimOrEmail,name,role,labName',
      '24060123120001,Andi,asprak,Lab Jaringan',
      '24060123120002,Budi,admin,Lab Jaringan',
    ].join('\n');

    const asprakRows = buildImportPreviewRows(asprakCsv, 'asprak');
    assert.equal(asprakRows[0].errors.length, 0);
    assert.ok(asprakRows[1].errors.some((e) => e.includes('Role')));

    const praktikanCsv = [
      'nim,name,classCode,labName',
      '24060124120001,Sari,IF-A,Lab RPL',
    ].join('\n');

    const praktikanRows = buildImportPreviewRows(praktikanCsv, 'praktikan');
    assert.equal(praktikanRows.length, 1);
    assert.equal(praktikanRows[0].errors.length, 0);
  });

  it('menyusun ringkasan eksekusi idempoten dengan baris yang ditolak/dilewati', () => {
    const csv = [
      'nim,name,classCode,labName',
      '24060124120001,Sari,IF-A,Lab RPL',
      ',Tanpa NIM,IF-A,Lab RPL',
    ].join('\n');

    const rows = buildImportPreviewRows(csv, 'praktikan');
    assert.equal(rows[0].rowNumber, 2);
    const summary = summarizeImportExecution(
      'praktikan',
      rows,
      new Map([[2, { ok: true, message: 'Berhasil diimpor.' }]]),
    );

    assert.equal(summary.totalRows, 2);
    assert.equal(summary.acceptedCount, 1);
    assert.equal(summary.rejectedCount, 1);
    assert.equal(summary.succeededCount, 1);
    assert.equal(summary.failedCount, 0);
    assert.equal(summary.outcomes[0].status, 'imported');
    assert.equal(summary.outcomes[1].status, 'skipped');
  });
});
