import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  buildFineFinance,
  type FineFinanceSummary,
} from '../../domain/fineFinanceRules';
import type { PeriodRange } from '../../domain/labDashboardRules';
import type { Fine } from '../../domain/types';
import { subscribeFinesForLabs } from '../../services/firestore/labDashboardService';

export type AslabFinanceViewModel = {
  loading: boolean;
  error: string | null;
  summary: FineFinanceSummary;
  retry: () => void;
};

type FineState = { key: string; fines: Fine[] } | null;

/**
 * Tagihan denda di lab yang dikelola. Satu listener per daftar lab; mengganti
 * periode hanya menghitung ulang ringkasan tanpa query baru.
 */
export function useAslabFinance(
  labIds: readonly string[],
  range: PeriodRange,
): AslabFinanceViewModel {
  const labKey = [...labIds].sort().join('|');
  const [state, setState] = useState<FineState>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(
    null,
  );
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${labKey}#${attempt}`;

  useEffect(() => {
    const ids = labKey ? labKey.split('|') : [];
    return subscribeFinesForLabs(ids, {
      onData: (fines) => setState({ key: requestKey, fines }),
      onError: (message) => setError({ key: requestKey, message }),
    });
  }, [labKey, requestKey]);

  const ready = state?.key === requestKey;
  const fines = ready ? state.fines : NO_FINES;
  const summary = useMemo(() => buildFineFinance(fines, range), [fines, range]);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const currentError = error?.key === requestKey ? error.message : null;

  return {
    loading: !ready && !currentError,
    error: currentError,
    summary,
    retry,
  };
}

const NO_FINES: Fine[] = [];
