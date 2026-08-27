import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ANALOGIES } from './analogies.ts';
import { MISCONCEPTION_IDS } from '../shared/contracts.ts';

/** D6: "none of them mention arrays or maps." Enforced, not trusted. */
const FORBIDDEN = /\b(array|arrays|map|maps|hash\w*|dict\w*|index|indices|loop|loops|iterate|nums|target|O\(n\)|key|value)\b/i;

test('every misconception has an analogy', () => {
  for (const id of MISCONCEPTION_IDS) {
    assert.ok(ANALOGIES[id]?.length > 40, `${id} has no real analogy`);
  }
});

test('no analogy uses the vocabulary of the thing it explains', () => {
  for (const id of MISCONCEPTION_IDS) {
    const hit = ANALOGIES[id].match(FORBIDDEN);
    assert.equal(hit, null, `${id} leaks implementation vocabulary: "${hit?.[0]}"`);
  }
});

test('each analogy hands the question back, except the one that gets out of the way', () => {
  for (const id of MISCONCEPTION_IDS) {
    if (id === 'NONE') continue;
    assert.ok(ANALOGIES[id].trim().endsWith('?'), `${id} does not end by asking`);
  }
});
