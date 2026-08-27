import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countCodeLines, rejectionFor } from './validate.ts';
import { fallbackFor } from './fallbacks.ts';

test('every hand-written fallback passes its own validator', () => {
  for (const id of ['TS_BRUTE_FORCE_ONLY', 'TS_COMPLEMENT_CONFUSION', 'NONE'] as const) {
    assert.equal(rejectionFor(fallbackFor(id)), null, `${id} failed validation`);
  }
});

test('a fenced solution is rejected', () => {
  const r = fallbackFor('TS_BRUTE_FORCE_ONLY');
  r.message = 'Here you go:\n```python\nseen = {}\nfor i, n in enumerate(nums):\n    if target - n in seen:\n        return [seen[target - n], i]\n    seen[n] = i\n```';
  assert.match(rejectionFor(r)?.reason ?? '', /lines of code/);
});

test('a one-line illustration is allowed', () => {
  assert.ok(countCodeLines('What if you asked `if target - n in seen:` before storing?') <= 3);
});

test('an L1 hint that is not a question is rejected', () => {
  const r = fallbackFor('TS_BRUTE_FORCE_ONLY');
  r.message = 'You should use a hash map to store what you have seen so far.';
  assert.match(rejectionFor(r)?.reason ?? '', /question/);
});

test('garbage is rejected without throwing', () => {
  assert.ok(rejectionFor(null));
  assert.ok(rejectionFor('{}'));
  assert.ok(rejectionFor({ misconceptionId: 'NOT_REAL' }));
});
