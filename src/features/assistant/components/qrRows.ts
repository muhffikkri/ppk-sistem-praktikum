import createQr from 'qrcode-generator';

export type QrRun = { dark: boolean; length: number };

/**
 * Membuat matriks QR lalu menggabungkan modul berwarna sama yang
 * berdampingan dalam satu baris menjadi satu "run", supaya jumlah view
 * yang digambar tetap sedikit.
 */
export function buildQrRows(value: string): QrRun[][] {
  const qr = createQr(0, 'M');
  qr.addData(value);
  qr.make();
  const count = qr.getModuleCount();
  const rows: QrRun[][] = [];
  for (let row = 0; row < count; row += 1) {
    const runs: QrRun[] = [];
    for (let col = 0; col < count; col += 1) {
      const dark = qr.isDark(row, col);
      const last = runs[runs.length - 1];
      if (last && last.dark === dark) {
        last.length += 1;
      } else {
        runs.push({ dark, length: 1 });
      }
    }
    rows.push(runs);
  }
  return rows;
}
