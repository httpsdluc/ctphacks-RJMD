/**
 * C6 — the escalation state machine. Deterministic, in code, never a prompt
 * instruction. Pure functions so C can unit-test them without a network call.
 *
 * count -> intervention
 *   1   hint L1                          (Socratic question, no content)
 *   2   hint L2 + offer analogy
 *   3   deliver analogy + offer visual
 *   4   deliver visual + comprehension question
 *   5+  deliver video (with `why`) + comprehension question
 *
 * Invariants, enforced here:
 *   1. Never deliver the same intervention kind twice for one misconception
 *   2. Never reuse prior wording (the do-not-repeat list is passed to the model)
 * Override: preferredModality with 2+ wins jumps straight in at count === 2.
 *
 * TODO(C6): implement + unit tests in escalation.test.ts
 */

import type {
  HelpAction,
  HintLevel,
  LearnerProfile,
  MisconceptionId,
  Modality,
} from '../../shared/contracts';

export interface Intervention {
  hintLevel: HintLevel | null;
  modality: Modality;
  offeredActions: HelpAction[];
  askComprehension: boolean;
  /** Passed to the model verbatim as "do not say any of these again". */
  doNotRepeat: string[];
}

export function decideIntervention(
  _profile: LearnerProfile,
  _misconceptionId: MisconceptionId,
): Intervention {
  throw new Error('TODO(C6)');
}
