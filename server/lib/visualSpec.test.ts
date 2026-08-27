import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTwoSumVisual } from './visualSpec.ts';

test('C7: the diagram uses the learner values, not canned ones', () => {
  const a = buildTwoSumVisual({ nums: [2, 7, 11, 15], target: 9 });
  const b = buildTwoSumVisual({ nums: [3, 2, 4], target: 6 });
  assert.notDeepEqual(a.steps, b.steps, 'changing the input must change the steps');
  assert.deepEqual(b.values.nums, [3, 2, 4]);
  assert.ok(JSON.stringify(b.steps).includes('6 - 3 = 3'));
});

test('stops as soon as it finds the pair', () => {
  const v = buildTwoSumVisual({ nums: [2, 7, 11, 15], target: 9 });
  const last = v.steps[v.steps.length - 1];
  assert.match(last.note ?? '', /return \[0, 1\]/);
  assert.ok(!JSON.stringify(v.steps).includes('15'), 'never reaches the tail of the array');
});

test('handles an input with no answer without crashing', () => {
  const v = buildTwoSumVisual({ nums: [1, 2], target: 99 });
  assert.match(v.steps[v.steps.length - 1].caption, /no pair/);
});
