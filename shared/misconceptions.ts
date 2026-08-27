/**
 * shared/misconceptions.ts
 *
 * What each misconception actually MEANS, in the learner's terms.
 *
 * The taxonomy ids and one-line labels live in contracts.ts because the model
 * needs them for classification. This is the teaching layer on top: what the
 * idea is really about, how it shows up in your own code, and the one concrete
 * thing to do next.
 *
 * It exists because a diagnosis that names a problem without telling you what
 * to do with it is a label, not help. "nested loops, no hash-map insight" is
 * accurate and useless on its own.
 *
 * Written once, deterministic, no model call — so the diagnostic panel can be
 * specific without spending a request or risking invented advice.
 */

import type { MisconceptionId, SkillId } from './contracts.ts';

export interface MisconceptionDetail {
  /** The idea underneath, not the symptom. */
  about: string;
  /** How it shows up in their own code — the thing to go look at. */
  tell: string;
  /** One concrete action. Never "use a hash map". */
  nextStep: string;
  skill: SkillId | null;
}

export const MISCONCEPTION_DETAIL: Record<MisconceptionId, MisconceptionDetail> = {
  TS_BRUTE_FORCE_ONLY: {
    about: 'Recognising when a lookup can replace a scan.',
    tell: 'Two loops, where the inner one re-reads elements the outer has already passed.',
    nextStep:
      'At each step, write down the single value you would need to find. Then ask what could hand it to you without searching.',
    skill: 'hash_maps',
  },
  TS_COMPLEMENT_CONFUSION: {
    about: 'Turning "find a pair" into "find one known value".',
    tell: 'Elements compared against each other, rather than one value computed first and then looked for.',
    nextStep:
      'Before looking at anything else, write down the exact number you are hunting for. You can always name it.',
    skill: 'problem_decomposition',
  },
  TS_MAP_DIRECTION_FLIPPED: {
    about: 'Choosing what to key a lookup table on.',
    tell: 'A table keyed by position, when position is the thing you already have.',
    nextStep:
      'At the moment you search, name which of the two you are holding and which you need. Key on the one you need.',
    skill: 'hash_maps',
  },
  TS_INSERT_BEFORE_CHECK: {
    about: 'Ordering your operations so an element cannot match itself.',
    tell: 'The current value gets recorded before the table is asked about it.',
    nextStep:
      'Trace nums = [3, 2, 4] with target 6 by hand and watch who 3 finds when it goes looking.',
    skill: 'hash_maps',
  },
  TS_RETURNS_VALUES_NOT_INDICES: {
    about: 'Reading the problem statement as a contract.',
    tell: 'The two numbers come back, when the statement asked where they sit.',
    nextStep:
      'Re-read the last sentence of the problem and underline the noun it asks you to return.',
    skill: 'problem_decomposition',
  },
  TS_OFF_BY_ONE_INNER_LOOP: {
    about: 'Reasoning about loop bounds without running the code.',
    tell: 'Both loops can land on the same index at the same moment.',
    nextStep:
      'Write out the first three (i, j) pairs your loops produce. Check every pair uses two different positions.',
    skill: 'array_traversal',
  },
  NONE: {
    about: 'Committing to an approach and writing it.',
    tell: '',
    nextStep:
      'Before you submit, check two inputs: one with duplicate values, and one where no pair adds up.',
    skill: null,
  },
};
