/**
 * shared/summary.ts
 *
 * "What we've covered" used to replay the coach's questions back at the
 * learner. They had just read those. A transcript is not a diagnostic.
 *
 * Everything needed for a real one is already in the profile — which
 * misconceptions recur, how deep the coach has had to escalate, which help
 * actually moved them, which skills shifted, whether they have been here
 * before. So this derives it in code: no extra model call, no latency, no
 * rate limit, and it cannot hallucinate praise the learner did not earn.
 *
 * The wording is chosen by the data rather than fixed: a first attempt, a
 * third repeat, a wide-but-shallow session and a learner who corrected
 * themselves each produce a different read. Same session in, same words out —
 * which is what makes it trustworthy in a demo.
 *
 * Pure functions. No imports beyond the contract.
 */

import { MISCONCEPTION_LABELS, MODALITIES, SKILL_IDS, SKILL_LABELS } from './contracts.ts';
import type {
  CoachResponse,
  LearnerProfile,
  MisconceptionId,
  Modality,
} from './contracts.ts';

export interface SessionSummary {
  headline: string;
  strengths: string[];
  struggles: string[];
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

  const ranked = rankedStruggles(profile);
  const worst = ranked[0];
  const distinct = ranked.length;
  const totalMisses = ranked.reduce((n, [, c]) => n + c, 0);
  const corrected = history.some((r, i) => i > 0 && r.misconceptionId === 'NONE');
  const answered = history.filter((r) => r.comprehensionQuestion !== null).length;

  /* ---- the path ---- */

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

  if (corrected) {
    const before = [...history].reverse().find((r) => r.misconceptionId !== 'NONE');
    strengths.push(
      before
        ? `You worked your way out of "${MISCONCEPTION_LABELS[before.misconceptionId]}" yourself`
        : 'You corrected your own approach',
    );
  }

  // Persistence is worth naming — most people guess again instead of re-explaining.
  if (!corrected && history.length >= 3) {
    strengths.push(`You have re-explained your thinking ${history.length} times instead of guessing`);
  }

  if (answered > 0) {
    strengths.push(
      answered === 1
        ? 'You answered a comprehension check rather than skipping it'
        : `You answered ${answered} comprehension checks`,
    );
  }

  if (profile.preferredModality) {
    strengths.push(MODALITY_WORKS[profile.preferredModality]);
  }

  if (profile.sessionCount > 1) {
    strengths.push(`Session ${profile.sessionCount} — you came back`);
  }

  /* ---- what keeps tripping them ---- */

  for (const [id, count] of ranked) {
    struggles.push(
      count === 1
        ? MISCONCEPTION_LABELS[id]
        : `${MISCONCEPTION_LABELS[id]} — came back ${count} times`,
    );
  }

  // How hard the coach has had to work on the worst one.
  if (worst) {
    const tried = profile.deliveredInterventions[worst[0]] ?? [];
    const content = tried.filter((m) => m !== 'question');
    if (content.length >= 2) {
      struggles.push(
        `We have tried ${content.map((m) => MODALITY_NOUN[m]).join(', ')} on this one`,
      );
    }
    if (tried.length >= MODALITIES.length) {
      struggles.push('Every kind of explanation is spent — worth talking it through from scratch');
    }
  }

  /* ---- headline, chosen by the shape of the session ---- */

  let headline: string;
  if (history.length === 0) {
    headline = 'Nothing covered yet. Tell me how you would approach it.';
  } else if (corrected && !worst) {
    headline = 'You got there, and you got there yourself.';
  } else if (corrected && worst) {
    headline = `Cleared it — after ${totalMisses} run${totalMisses === 1 ? '' : 's'} at ${MISCONCEPTION_LABELS[worst[0]]}.`;
  } else if (worst && worst[1] >= 3) {
    headline = `One idea is doing all the damage: ${MISCONCEPTION_LABELS[worst[0]]}.`;
  } else if (distinct >= 3) {
    headline = `Several things are moving at once. The biggest is ${MISCONCEPTION_LABELS[worst[0]]}.`;
  } else if (history.length === 1 && worst) {
    headline = `Early read: ${MISCONCEPTION_LABELS[worst[0]]}.`;
  } else if (worst) {
    headline = `Mostly one thing in the way so far: ${MISCONCEPTION_LABELS[worst[0]]}.`;
  } else {
    headline = 'Your approach is holding up.';
  }

  return { headline, strengths, struggles, path };
}
