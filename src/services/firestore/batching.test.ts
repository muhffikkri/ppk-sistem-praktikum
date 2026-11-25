import assert from 'node:assert/strict';
import { test } from 'node:test';

import { chunkIds, groupBySession, MAX_IN_FILTER_VALUES } from './batching';

test('chunkIds splits ids into in-filter sized chunks', () => {
  const ids = Array.from({ length: 65 }, (_, i) => `s${i}`);
  const chunks = chunkIds(ids);
  assert.deepEqual(
    chunks.map((c) => c.length),
    [MAX_IN_FILTER_VALUES, MAX_IN_FILTER_VALUES, 5],
  );
  assert.deepEqual(chunks.flat(), ids);
});

test('chunkIds returns no chunks for no ids', () => {
  assert.deepEqual(chunkIds([]), []);
});

test('groupBySession keeps an empty entry for every requested session', () => {
  const grouped = groupBySession(
    ['a', 'b', 'c'],
    [
      { sessionId: 'a', id: '1' },
      { sessionId: 'a', id: '2' },
      { sessionId: 'c', id: '3' },
      { sessionId: 'zzz', id: '4' },
    ],
  );
  assert.deepEqual(Object.keys(grouped), ['a', 'b', 'c']);
  assert.deepEqual(
    grouped.a.map((r) => r.id),
    ['1', '2'],
  );
  assert.deepEqual(grouped.b, []);
  assert.deepEqual(
    grouped.c.map((r) => r.id),
    ['3'],
  );
});
