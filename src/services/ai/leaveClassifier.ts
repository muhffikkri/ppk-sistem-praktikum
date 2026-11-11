import type { AiClassificationResult } from '../../domain/types';

export const AI_TIMEOUT_MS = 8000;
const unavailable = (): AiClassificationResult => ({
  status: 'unavailable',
  category: null,
  confidence: null,
  errorMessage:
    'Klasifikasi AI tidak tersedia. Pengajuan tetap dapat diperiksa asisten.',
});

export async function classifyLeaveReason(
  reason: string,
  endpoint = process.env.EXPO_PUBLIC_AI_CLASSIFIER_URL,
): Promise<AiClassificationResult> {
  if (!endpoint || !reason.trim()) return unavailable();
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async (): Promise<AiClassificationResult> => {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: reason.trim(), reason: reason.trim() }),
          signal: controller.signal,
        });
        if (!response.ok) return unavailable();
        const data: unknown = await response.json();
        if (!data || typeof data !== 'object') return unavailable();
        const fields = data as Record<string, unknown>;
        const category = fields.category ?? fields.label ?? fields.prediction;
        const confidence = fields.confidence ?? fields.score ?? null;
        if (typeof category !== 'string' || !category.trim())
          return unavailable();
        if (
          confidence !== null &&
          (typeof confidence !== 'number' ||
            !Number.isFinite(confidence) ||
            confidence < 0 ||
            confidence > 1)
        )
          return unavailable();
        return {
          status: 'classified',
          category: category.trim(),
          confidence: confidence as number | null,
        };
      })(),
      new Promise<AiClassificationResult>((resolve) => {
        timer = setTimeout(() => {
          controller.abort();
          resolve(unavailable());
        }, AI_TIMEOUT_MS);
      }),
    ]);
  } catch {
    return unavailable();
  } finally {
    clearTimeout(timer);
  }
}
