import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guardDiagnosis } from './guard.ts';

const g = (text: string, code = '') => guardDiagnosis('NONE', text, code).misconceptionId;

test('the miss that motivated this guard is caught', () => {
  assert.equal(
    g('I want to check every possible combination of two numbers in the list and stop as soon as one of them sums to the target.'),
    'TS_BRUTE_FORCE_ONLY',
  );
});

test('exhaustive search wearing different words is caught', () => {
  assert.equal(g("I'll compare the first number against all the others, then the second."), 'TS_BRUTE_FORCE_ONLY');
  assert.equal(g('Two loops over the array, checking each pair as I go along the way.'), 'TS_BRUTE_FORCE_ONLY');
  assert.equal(g('Just brute-force it and check them all until something adds up.'), 'TS_BRUTE_FORCE_ONLY');
});

test('a genuinely sound approach survives', () => {
  assert.equal(
    g('I walk the array once, keeping a dictionary of numbers I have seen mapped to their index, and check for the complement.'),
    'NONE',
  );
  assert.equal(
    g('As I go I remember each number and where it was, then check whether the one completing the pair already showed up.'),
    'NONE',
  );
});

test('a help-button press with no explanation is never overridden', () => {
  assert.equal(g(''), 'NONE');
  assert.equal(g('idk'), 'NONE');
});

test('it never touches a diagnosis that is not NONE', () => {
  const r = guardDiagnosis('TS_MAP_DIRECTION_FLIPPED', 'every pair', '');
  assert.equal(r.misconceptionId, 'TS_MAP_DIRECTION_FLIPPED');
  assert.equal(r.overridden, false);
});
