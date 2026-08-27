import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summariseSession } from './summary.ts';
import { createProfile } from './profile.ts';
import type { CoachResponse, LearnerProfile } from './contracts.ts';

function response(over: Partial<CoachResponse>): CoachResponse {
  return {
    misconceptionId: 'TS_BRUTE_FORCE_ONLY',
    confidence: 0.9,
    message: 'a question?',
    hintLevel: 1,
    modality: 'question',
    offeredActions: [],
    blockedActions: [],
    analogy: null,
    visual: null,
    video: null,
    comprehensionQuestion: null,
    profileDelta: {
      skillUpdates: {},
      incrementMisconception: null,
      recordDelivered: null,
      creditModality: null,
      appendCoachMessage: null,
      summary: '',
    },
    learningGoal: '',
    meta: { fallbackUsed: false, model: 'test', latencyMs: 0 },
    ...over,
  };
}

function profileWith(over: Partial<LearnerProfile>): LearnerProfile {
  return { ...createProfile(0), ...over };
}

test('an empty session says so instead of inventing progress', () => {
  const s = summariseSession([], createProfile(0));
  assert.match(s.headline, /Nothing covered yet/);
  assert.deepEqual(s.strengths, []);
});

test('it never restates the coach message', () => {
  const s = summariseSession(
    [response({ message: 'What are you asking the rest of the array for?' })],
    profileWith({ misconceptionCounts: { TS_BRUTE_FORCE_ONLY: 1 } }),
  );
  const all = [s.headline, ...s.strengths, ...s.struggles, ...s.path].join(' ');
  assert.ok(!all.includes('asking the rest of the array'), 'summary leaked the transcript');
});

test('a repeated misconception is named as the headline problem', () => {
  const s = summariseSession(
    [response({}), response({}), response({})],
    profileWith({ misconceptionCounts: { TS_BRUTE_FORCE_ONLY: 3 } }),
  );
  assert.match(s.headline, /doing all the damage/);
  assert.ok(s.struggles[0].includes('came back 3 times'));
});

test('praise is only given when it is earned', () => {
  const nothing = summariseSession([response({})], profileWith({}));
  assert.deepEqual(nothing.strengths, [], 'praised a learner who has done nothing yet');

  const earned = summariseSession(
    [response({}), response({ misconceptionId: 'NONE', hintLevel: null, modality: 'question' })],
    profileWith({
      skills: { ...createProfile(0).skills, hash_maps: 'improving' },
      preferredModality: 'visual',
    }),
  );
  assert.ok(earned.strengths.some((s) => s.includes('Hash maps — improving')));
  assert.ok(earned.strengths.some((s) => s.includes('worked your way out')));
  assert.ok(earned.strengths.some((s) => s.includes('drawn')));
});

test('the path describes the kind of help, not the words', () => {
  const s = summariseSession(
    [response({ hintLevel: 3, modality: 'analogy', message: 'coat check story' })],
    profileWith({ misconceptionCounts: { TS_BRUTE_FORCE_ONLY: 1 } }),
  );
  assert.equal(s.path[0], 'Hint 3 — a real-life comparison, about nested loops, no hash-map insight');
});

test('different sessions produce genuinely different reads', () => {
  const one = summariseSession(
    [response({})],
    profileWith({ misconceptionCounts: { TS_BRUTE_FORCE_ONLY: 1 } }),
  );
  const stuck = summariseSession(
    [response({}), response({}), response({}), response({})],
    profileWith({
      misconceptionCounts: { TS_BRUTE_FORCE_ONLY: 4 },
      deliveredInterventions: { TS_BRUTE_FORCE_ONLY: ['question', 'analogy', 'visual'] },
    }),
  );
  const wide = summariseSession(
    [response({}), response({}), response({})],
    profileWith({
      misconceptionCounts: {
        TS_BRUTE_FORCE_ONLY: 1,
        TS_COMPLEMENT_CONFUSION: 1,
        TS_OFF_BY_ONE_INNER_LOOP: 1,
      },
    }),
  );
  const done = summariseSession(
    [response({}), response({}), response({ misconceptionId: 'NONE', hintLevel: null })],
    profileWith({ misconceptionCounts: { TS_BRUTE_FORCE_ONLY: 2 } }),
  );

  const heads = [one.headline, stuck.headline, wide.headline, done.headline];
  assert.equal(new Set(heads).size, 4, `headlines repeated: ${JSON.stringify(heads)}`);
  assert.match(one.headline, /Early read/);
  assert.match(stuck.headline, /doing all the damage/);
  assert.match(wide.headline, /Several things/);
  assert.match(done.headline, /Cleared it/);
});

test('it names how hard the coach has already worked', () => {
  const s = summariseSession(
    [response({}), response({}), response({})],
    profileWith({
      misconceptionCounts: { TS_BRUTE_FORCE_ONLY: 3 },
      deliveredInterventions: { TS_BRUTE_FORCE_ONLY: ['question', 'analogy', 'visual'] },
    }),
  );
  assert.ok(s.struggles.some((x) => x.includes('We have tried')), s.struggles.join(' | '));
});

test('persistence counts as a strength, guessing does not', () => {
  const s = summariseSession(
    [response({}), response({}), response({})],
    profileWith({ misconceptionCounts: { TS_BRUTE_FORCE_ONLY: 3 } }),
  );
  assert.ok(s.strengths.some((x) => x.includes('re-explained your thinking 3 times')));
});
