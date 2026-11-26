import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../../../shared/ui';
import { buildQrRows } from './qrRows';

type Props = {
  value: string;
  /** Lebar & tinggi QR (termasuk quiet zone) dalam dp. */
  size: number;
};

/** Modul kosong di sekeliling QR agar mudah dibaca kamera (standar: 4). */
const QUIET_ZONE = 4;

/**
 * QR code yang digambar dengan `View` biasa (tanpa react-native-svg),
 * jadi tidak butuh modul native tambahan.
 */
export function SessionQrCode({ value, size }: Props) {
  const rows = useMemo(() => buildQrRows(value), [value]);

  const cell = size / (rows.length + QUIET_ZONE * 2);
  // Ukuran QR berubah saat `size`/`value` berubah, tapi style dihitung di luar
  // JSX agar tidak dibuat ulang setiap render.
  const frameStyle = useMemo(
    () => ({ width: size, height: size, padding: cell * QUIET_ZONE }),
    [cell, size],
  );
  const rowStyle = useMemo(() => ({ height: cell }), [cell]);
  const runStyles = useMemo(
    () =>
      rows.map((runs) =>
        runs.map((run) => ({
          width: cell * run.length,
          height: cell,
          backgroundColor: run.dark ? colors.ink : colors.panel,
        })),
      ),
    [cell, rows],
  );

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Kode presensi sesi"
      style={[styles.frame, frameStyle]}
    >
      {rows.map((runs, rowIndex) => (
        <View key={rowIndex} style={[styles.row, rowStyle]}>
          {runs.map((run, runIndex) => (
            <View key={runIndex} style={runStyles[rowIndex][runIndex]} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: colors.panel,
  },
  row: {
    flexDirection: 'row',
  },
});
