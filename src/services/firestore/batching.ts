/** Firestore caps the values of an `in` filter at 30. */
export const MAX_IN_FILTER_VALUES = 30;

/** Split ids into consecutive chunks that each fit one `in` filter. */
export function chunkIds(
  ids: readonly string[],
  size: number = MAX_IN_FILTER_VALUES,
): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }
  return chunks;
}

/**
 * Group records by `sessionId`. Every requested id gets an entry, so a
 * session whose last record disappears is cleared rather than left stale.
 */
export function groupBySession<T extends { sessionId: string }>(
  sessionIds: readonly string[],
  records: readonly T[],
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  for (const id of sessionIds) grouped[id] = [];
  for (const record of records) {
    grouped[record.sessionId]?.push(record);
  }
  return grouped;
}
