/**
 * C2 — one fallback per MisconceptionId.
 *
 * These ship at CP1 and are what the learner sees when Gemini is slow, down,
 * or returns something that fails validation. They are not placeholders: if
 * the model never responds during the demo, THIS is our product. Every line
 * has to read like a coach who has taught this problem a hundred times.
 *
 * Rules every line here obeys:
 *   - It is a question, not an answer (except NONE, which is praise + exit).
 *   - It never names the data structure. That is the insight we are protecting.
 *   - It gives the learner something to DO — trace this input, re-read that line.
 */

import { CONFIDENCE_FLOOR } from '../../shared/contracts.ts';
import type {
  CoachResponse,
  HelpAction,
  HintLevel,
  MisconceptionId,
  Modality,
} from '../../shared/contracts.ts';

export const FALLBACK_RESPONSES: Record<MisconceptionId, string> = {
  TS_BRUTE_FORCE_ONLY:
    "That will find the answer every single time, so let's leave correctness alone. " +
    "Here's what I'm curious about: when you're standing on the number 2, what exactly " +
    'are you asking the rest of the array for?',

  TS_COMPLEMENT_CONFUSION:
    "You're checking pairs as you meet them. Try this instead — if I tell you the " +
    'current number is 7 and the target is 9, can you name the number you are hunting ' +
    'for before you look at a single other element?',

  TS_MAP_DIRECTION_FLIPPED:
    "Your table lets you ask \"what number lives at index 3?\" — but read your own lookup " +
    'back to me. At that moment, which of the two do you already have in your hand, and ' +
    'which one are you trying to find?',

  TS_INSERT_BEFORE_CHECK:
    'Walk your code by hand on nums = [3, 2, 4] with target 6. When 3 goes looking for ' +
    'its partner, who does it find — and is that a pair of two different elements?',

  TS_RETURNS_VALUES_NOT_INDICES:
    'Read the last sentence of the problem statement out loud. Is it asking you to hand ' +
    'back the two numbers, or something about where they were sitting?',

  TS_OFF_BY_ONE_INNER_LOOP:
    'Your two loops can both be sitting on the same element at the same time. On paper, ' +
    'what is the very first pair they hand you — and are those genuinely two different ' +
    'positions in the array?',

  NONE:
    "That's the right shape. One pass, and you're using what you've already seen instead " +
    "of looking ahead. Go write it — I'll be here if the edge cases bite.",
};

/** Shown above the textarea. One per misconception, learner-facing. */
export const LEARNING_GOALS: Record<MisconceptionId, string> = {
  TS_BRUTE_FORCE_ONLY: 'Recognising when a lookup can replace a scan.',
  TS_COMPLEMENT_CONFUSION: 'Turning "find a pair" into "find one known value".',
  TS_MAP_DIRECTION_FLIPPED: 'Choosing what to key a lookup table on.',
  TS_INSERT_BEFORE_CHECK: 'Ordering your operations so an element cannot match itself.',
  TS_RETURNS_VALUES_NOT_INDICES: 'Reading the problem statement as a contract.',
  TS_OFF_BY_ONE_INNER_LOOP: 'Reasoning about loop bounds without running the code.',
  NONE: 'Committing to an approach and writing it.',
};

export interface FallbackOptions {
  hintLevel?: HintLevel | null;
  modality?: Modality;
  offeredActions?: HelpAction[];
  note?: string;
}

/**
 * Always returns a schema-valid CoachResponse. Never throws.
 * The profileDelta is deliberately conservative — a fallback should not
 * teach the profile anything it did not actually learn.
 */
export function fallbackFor(
  id: MisconceptionId,
  options: FallbackOptions = {},
): CoachResponse {
  const {
    hintLevel = id === 'NONE' ? null : 1,
    modality = 'question',
    offeredActions = id === 'NONE' ? ['retry'] : ['hint', 'analogy', 'retry'],
    note,
  } = options;

  const message = FALLBACK_RESPONSES[id];

  return {
    misconceptionId: id,
    confidence: CONFIDENCE_FLOOR,
    message,
    hintLevel,
    modality,
    offeredActions,
    blockedActions: [],
    analogy: null,
    visual: null,
    video: null,
    comprehensionQuestion: null,
    insight: null,
    profileDelta: {
      skillUpdates: {},
      incrementMisconception: id === 'NONE' ? null : id,
      recordDelivered: id === 'NONE' ? null : { misconceptionId: id, modality },
      creditModality: null,
      appendCoachMessage: message,
      summary: '',
    },
    learningGoal: LEARNING_GOALS[id],
    meta: { fallbackUsed: true, model: 'fallback', latencyMs: 0, note },
  };
}
