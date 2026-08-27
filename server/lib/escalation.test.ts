/**
 * C6 unit tests. The escalation rules are the product; they get real tests.
 * Run: npm test
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decideIntervention } from './escalation.ts';
import { createProfile } from '../../shared/profile.ts';
import type { LearnerProfile, MisconceptionId, Modality } from '../../shared/contracts.ts';

const ID: MisconceptionId = 'TS_BRUTE_FORCE_ONLY';

function profileWith(overrides: {
  count?: number;
  delivered?: Modality[];
  preferred?: Modality | null;
  wins?: Partial<Record<Modality, number>>;
}): LearnerProfile {
  const p = createProfile(0);
  if (overrides.count !== undefined) p.misconceptionCounts[ID] = overrides.count;
  if (overrides.delivered) p.deliveredInterventions[ID] = overrides.delivered;
  if (overrides.preferred !== undefined) p.preferredModality = overrides.preferred;
  if (overrides.wins) Object.assign(p.modalityWins, overrides.wins);
  return p;
}

test('count 1 asks a question and refuses to draw anything', () => {
  const i = decideIntervention(profileWith({ count: 1 }), ID);
  assert.equal(i.hintLevel, 1);
  assert.equal(i.modality, 'question');
  assert.ok(!i.offeredActions.includes('visual'), 'must not offer the visual at L1');
  assert.ok(!i.offeredActions.includes('video'), 'must not offer a video at L1');
  assert.ok(!i.offeredActions.includes('analogy'), 'L1 is the question standing alone');
  assert.ok(i.offeredActions.includes('retry'));
});

test('every blocked action explains itself', () => {
  const i = decideIntervention(profileWith({ count: 1 }), ID);
  assert.ok(i.blockedActions.length > 0);
  for (const b of i.blockedActions) {
    assert.ok(b.reason.length > 20, `"${b.action}" needs a real reason, got: ${b.reason}`);
  }
});

test('count 3 delivers the analogy and offers the visual next', () => {
  const i = decideIntervention(
    profileWith({ count: 3, delivered: ['question'] }),
    ID,
  );
  assert.equal(i.modality, 'analogy');
  assert.equal(i.hintLevel, 3);
  assert.ok(i.offeredActions.includes('visual'));
});

test('count 4 delivers the visual and asks a comprehension question', () => {
  const i = decideIntervention(
    profileWith({ count: 4, delivered: ['question', 'analogy'] }),
    ID,
  );
  assert.equal(i.modality, 'visual');
  assert.equal(i.askComprehension, true);
});

test('INVARIANT 1: never delivers the same modality twice', () => {
  // The ladder wants an analogy at count 3, but we already gave one.
  const i = decideIntervention(
    profileWith({ count: 3, delivered: ['question', 'analogy'] }),
    ID,
  );
  assert.notEqual(i.modality, 'analogy');
  assert.equal(i.modality, 'visual');
});

test('the ladder walks the spec exactly: question, question, analogy, visual, video', () => {
  const expected: Modality[] = ['question', 'question', 'analogy', 'visual', 'video'];
  const seen: Modality[] = [];
  for (let count = 1; count <= 5; count += 1) {
    const i = decideIntervention(profileWith({ count, delivered: [...seen] }), ID);
    seen.push(i.modality);
  }
  assert.deepEqual(seen, expected);
});

test('INVARIANT 1: no piece of content is ever delivered twice in a session', () => {
  const seen: Modality[] = [];
  for (let count = 1; count <= 6; count += 1) {
    const i = decideIntervention(profileWith({ count, delivered: [...seen] }), ID);
    if (i.modality !== 'question' && !i.exhausted) {
      assert.ok(!seen.includes(i.modality), `repeated ${i.modality} at count ${count}`);
    }
    seen.push(i.modality);
  }
});

test('a second question is a new rung, not a repeat', () => {
  const i = decideIntervention(profileWith({ count: 2, delivered: ['question'] }), ID);
  assert.equal(i.modality, 'question');
  assert.equal(i.hintLevel, 2);
  assert.ok(i.offeredActions.includes('analogy'), 'L2 offers the analogy');
});

test('INVARIANT 2: prior wording is passed forward as a do-not-repeat list', () => {
  const p = profileWith({ count: 2 });
  p.priorCoachMessages = ['What are you asking the rest of the array for?'];
  const i = decideIntervention(p, ID);
  assert.deepEqual(i.doNotRepeat, p.priorCoachMessages);
});

test('OVERRIDE: a preferred modality with 2 wins jumps in at count 2', () => {
  const i = decideIntervention(
    profileWith({ count: 2, delivered: ['question'], preferred: 'visual', wins: { visual: 2 } }),
    ID,
  );
  assert.equal(i.modality, 'visual', 'should skip the ladder for what works');
  assert.match(i.reason, /override/);
});

test('OVERRIDE does not fire with only one win', () => {
  const i = decideIntervention(
    profileWith({ count: 2, preferred: 'visual', wins: { visual: 1 } }),
    ID,
  );
  assert.equal(i.modality, 'question');
});

test('OVERRIDE does not fire if the preferred modality was already used here', () => {
  const i = decideIntervention(
    profileWith({
      count: 2,
      delivered: ['visual'],
      preferred: 'visual',
      wins: { visual: 3 },
    }),
    ID,
  );
  assert.notEqual(i.modality, 'visual');
});

test('exhaustion is admitted, not faked', () => {
  const i = decideIntervention(
    profileWith({ count: 6, delivered: ['question', 'analogy', 'visual', 'video'] }),
    ID,
  );
  assert.equal(i.exhausted, true);
  assert.deepEqual(i.offeredActions, ['retry']);
});

test('an exhausted coach asks again rather than re-sending the same video', () => {
  const delivered: Modality[] = ['question', 'analogy', 'visual', 'video'];
  for (const count of [6, 7, 12]) {
    const i = decideIntervention(profileWith({ count, delivered }), ID);
    assert.equal(i.modality, 'question', `count ${count} would re-deliver ${i.modality}`);
  }
});

test('a sound approach is never escalated', () => {
  const i = decideIntervention(profileWith({ count: 0 }), 'NONE');
  assert.equal(i.hintLevel, 1);
  assert.equal(i.modality, 'question');
});
