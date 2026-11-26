/**
 * Cloud Function error yang dilempar dengan `new HttpsError(..., details)`
 * membawa alasan mesin di `details.reason`. Baca di satu tempat agar pemanggil
 * tidak perlu mengurai objek error Firebase yang mentah.
 */
type CallableFailure = {
  details?: { reason?: string } | null;
};

export function callableFailureReason(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const reason = (error as CallableFailure).details?.reason;
  return typeof reason === 'string' && reason ? reason : undefined;
}
