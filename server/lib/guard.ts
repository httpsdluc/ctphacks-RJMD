/**
 * The NONE guard.
 *
 * NONE is the one label with a consequence we cannot take back: it tells the
 * learner their approach is sound and to go write it. Getting it wrong on a
 * brute-force description is the single worst thing this product can do — the
 * coach congratulates someone for the exact misconception it exists to catch.
 *
 * The diagnosis prompt already forbids it. It still slipped through on
 * confident-sounding brute force ("check every possible combination and stop
 * as soon as one works" -> NONE, confidence 0.9). So this is enforced in code,
 * for the same reason escalation is: a rule the demo depends on does not live
 * in a prompt.
 *
 * The test is evidential rather than clever. NONE claims the learner is
 * remembering what they have already seen. If nothing in what they wrote
 * mentions remembering anything, the claim has no support.
 */

import type { MisconceptionId } from '../../shared/contracts.ts';

/** Any sign that they are keeping track of what they have already looked at. */
const MEMORY = /\b(map|maps|dict|dictionary|hash(?:map|table)?|set|seen|store[ds]?|storing|remember(?:ing|ed)?|lookup|look ?up|table|cache|index(?:es|ed)?|previous(?:ly)?)\b/i;

/** Descriptions of exhaustive pairwise search, in the wordings learners use. */
const EXHAUSTIVE =
  /\b(every|all|each)\b[^.]{0,40}\b(pair|pairs|combination|combinations|possibilit\w+)\b|\bnested loops?\b|\btwo loops\b|\bloop (?:through|over)[^.]{0,30}\bagain\b|\bcompare\b[^.]{0,40}\b(?:with|against)\b[^.]{0,20}\bothers?\b|\bcheck them all\b|\bbrute[- ]force\b/i;

export interface GuardResult {
  misconceptionId: MisconceptionId;
  overridden: boolean;
  reason?: string;
}

export function guardDiagnosis(
  diagnosed: MisconceptionId,
  attemptText: string,
  code: string,
): GuardResult {
  if (diagnosed !== 'NONE') return { misconceptionId: diagnosed, overridden: false };

  const evidence = `${attemptText}\n${code}`;

  // A help-button press carries no explanation. Nothing to contradict.
  if (attemptText.trim().length < 20) return { misconceptionId: 'NONE', overridden: false };

  if (MEMORY.test(evidence)) return { misconceptionId: 'NONE', overridden: false };

  if (EXHAUSTIVE.test(evidence)) {
    return {
      misconceptionId: 'TS_BRUTE_FORCE_ONLY',
      overridden: true,
      reason: 'NONE claimed, but nothing is remembered and the search is exhaustive',
    };
  }

  return { misconceptionId: 'NONE', overridden: false };
}
