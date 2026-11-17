// EDOM sentiment model - diimpor dari src/
import type { AiClassificationResult } from '../src/domain/types';
// Inference engine + data lokal EDOM. Tanpa endpoint eksternal.
import { createSentimentClassifier } from './sentiment';
import model from './model-edom.json';

// ponytail: margin decision function bukan probabilitas. Upgrade: tambah
// probabilitas (softmax/ Platt) saat validasi data EDOM selesai.
const marginConfidence = (margin: number) =>
  Math.min(1, 0.5 + Math.tanh(margin) / 2);

const CATEGORY_MAP: Record<string, string> = {
  positif: 'alasan_strong',
  netral: 'alasan_netral',
  negatif: 'alasan_weak',
};

const unavailable = (): AiClassificationResult => ({
  status: 'unavailable',
  category: null,
  confidence: null,
  errorMessage:
    'Klasifikasi AI tidak tersedia. Pengajuan tetap dapat diperiksa asisten.',
});

/**
 * Klasifikasi alasan cuti pakai model EDOM lokal (LinearSVC sentimen).
 * Async (tanpa await) agar kontrak pemanggil & type view model tidak berubah.
 */
export async function classifyLeaveReason(
  reason: string,
): Promise<AiClassificationResult> {
  if (!reason?.trim()) {
    return unavailable();
  }

  try {
    const classify = createSentimentClassifier(model);
    const result = classify(reason.trim());

    if (result.label === null) {
      // Teks tanpa kata yang dikenal model EDOM: netral, jangan diklaim terprediksi.
      return {
        status: 'classified',
        category: 'alasan_netral',
        confidence: 0.5,
      };
    }

    if (result.scores === null || result.scores.length !== 3) {
      return unavailable();
    }

    const scores = result.scores;
    const margin = Math.max(...scores) - Math.min(...scores);
    return {
      status: 'classified',
      category: CATEGORY_MAP[result.label] ?? 'alasan_netral',
      confidence: Math.round(marginConfidence(margin) * 100) / 100,
    };
  } catch {
    return unavailable();
  }
}
