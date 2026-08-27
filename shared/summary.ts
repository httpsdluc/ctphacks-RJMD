/**
 * shared/summary.ts
 *
 * "What we've covered" used to replay the coach's questions back at the
 * learner. They had just read those. A transcript is not a diagnostic.
 *
 * Everything needed for a real one is already in the profile — which
 * misconceptions keep recurring, which help actually moved them, which skills
 * shifted. So this derives it in code: no extra model call, no latency, no
 * rate limit, and it cannot hallucinate praise the learner did not earn.
 *
 * Pure functions. No imports beyond the contract.
 */

import { MISCONCEPTION_LABELS, SKILL_IDS, SKILL_LABELS } from './contracts.ts';
import type {
  CoachResponse,
  LearnerProfile,
  MisconceptionId,
  Modality,
} from './contracts.ts';

export interface SessionSummary {
  /** One line, the thing to read first. */
  headline: string;
  /** Honest — empty when nothing has been earned yet. */
  strengths: string[];
  struggles: string[];
  /** How the coach tried to help, in order. Not what it said. */
  path: string[];
}

const MODALITY_NOUN: Record<Modality, string> = {
  question: 'a question',
  analogy: 'a real-life comparison',
  visual: 'a diagram',
  video: 'a video',
};

const MODALITY_WORKS: Record<Modality, string> = {
  question: 'Questions get you unstuck fastest — you think best out loud.',
  analogy: 'Real-life comparisons land best for you.',
  visual: 'Seeing it drawn is what moves you.',
  video: 'Watching someone work through it is what moves you.',
};

/** Ordered worst-first: what is costing them the most attempts. */
function rankedStruggles(profile: LearnerProfile): Array<[MisconceptionId, number]> {
  return (Object.entries(profile.misconceptionCounts) as Array<[MisconceptionId, number]>)
    .filter(([id, n]) => id !== 'NONE' && n > 0)
    .sort((a, b) => b[1] - a[1]);
}

export function summariseSession(
  history: CoachResponse[],
  profile: LearnerProfile,
): SessionSummary {
  const strengths: string[] = [];
  const struggles: string[] = [];
  const path: string[] = [];

  for (const r of history) {
    if (r.misconceptionId === 'NONE') {
      path.push('You talked through a sound approach');
      continue;
    }
    const label = MISCONCEPTION_LABELS[r.misconceptionId];
    const how = MODALITY_NOUN[r.modality];
    path.push(
      r.hintLevel ? `Hint ${r.hintLevel} — ${how}, about ${label}` : `${how}, about ${label}`,
    );
  }

  /* ---- what is going well ---- */

  for (const skill of SKILL_IDS) {
    const state = profile.skills[skill];
    if (state === 'improving') strengths.push(`${SKILL_LABELS[skill]} — improving`);
    if (state === 'solid') strengths.push(`${SKILL_LABELS[skill]} — solid`);
  }

  // A correction is the only thing that really counts as progress here.
  const corrected = history.some((r, i) => i > 0 && r.misconceptionId === 'NONE');
  if (corrected) {
    const before = [...history].reverse().find((r) => r.misconceptionId !== 'NONE');
    strengths.push(
      before
        ? `You worked your way out of "${MISCONCEPTION_LABELS[before.misconceptionId]}" yourself`
        : 'You corrected your own approach',
    );
  }

  if (profile.preferredModality) {
    strengths.push(MODALITY_WORKS[profile.preferredModality]);
  }

  /* ---- what keeps tripping them ---- */

  for (const [id, count] of rankedStruggles(profile)) {
    struggles.push(
      count === 1
        ? MISCONCEPTION_LABELS[id]
        : `${MISCONCEPTION_LABELS[id]} — came back ${count} times`,
    );
  }

  /* ---- headline ---- */

  const worst = rankedStruggles(profile)[0];
  let headline: string;
  if (history.length === 0) {
    headline = 'Nothing covered yet. Tell me how you would approach it.';
  } else if (corrected && !worst) {
    headline = 'You got there, and you got there yourself.';
  } else if (worst && worst[1] >= 3) {
    headline = `One idea is doing all the damage: ${MISCONCEPTION_LABELS[worst[0]]}.`;
  } else if (worst) {
    headline = `Mostly one thing in the way so far: ${MISCONCEPTION_LABELS[worst[0]]}.`;
  } else {
    headline = 'Your approach is holding up.';
  }

  return { headline, strengths, struggles, path };
}
