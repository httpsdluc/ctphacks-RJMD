/**
 * C6 — the escalation state machine.
 *
 * Deterministic, in code, never a prompt instruction. A model asked to "not
 * repeat yourself" will repeat itself in front of a judge. So we decide the
 * level and the modality here, and pass them to Gemini as constraints.
 *
 *   count -> intervention
 *     1   hint L1                          (Socratic question, no content)
 *     2   hint L2 + offer analogy
 *     3   deliver analogy + offer visual
 *     4   deliver visual + comprehension question
 *     5+  deliver video (with `why`) + comprehension question
 *
 * Invariants, enforced here and not in the prompt:
 *   1. Never deliver the same intervention kind twice for one misconception.
 *   2. Never reuse prior wording — priorCoachMessages goes to the model as an
 *      explicit do-not-repeat list.
 *
 * Override: a preferredModality with PREFERRED_MODALITY_THRESHOLD wins jumps
 * straight in at count === 2.
 *
 * Pure functions. No network, no clock, no storage.
 */

import { HELP_ACTIONS, MODALITIES, PREFERRED_MODALITY_THRESHOLD } from '../../shared/contracts.ts';
import { countFor, deliveredFor } from '../../shared/profile.ts';
import type {
  BlockedAction,
  HelpAction,
  HintLevel,
  LearnerProfile,
  MisconceptionId,
  Modality,
} from '../../shared/contracts.ts';

export interface Intervention {
  hintLevel: HintLevel | null;
  /** What we are about to do. */
  modality: Modality;
  /** true = actually deliver it. false = we are only asking a question about it. */
  deliver: boolean;
  offeredActions: HelpAction[];
  blockedActions: BlockedAction[];
  askComprehension: boolean;
  /** Passed to the model verbatim: "do not say any of these again." */
  doNotRepeat: string[];
  /** Every modality has been used on this misconception. Change the angle. */
  exhausted: boolean;
  /** For the demo-day console, so we can see the machine working. */
  reason: string;
}

const ACTION_FOR: Record<Modality, HelpAction> = {
  question: 'hint',
  analogy: 'analogy',
  visual: 'visual',
  video: 'video',
};

/** The ladder, before any invariant or override is applied. */
function ladderFor(count: number): { level: HintLevel | null; modality: Modality; deliver: boolean } {
  if (count <= 1) return { level: 1, modality: 'question', deliver: true };
  if (count === 2) return { level: 2, modality: 'question', deliver: true };
  if (count === 3) return { level: 3, modality: 'analogy', deliver: true };
  if (count === 4) return { level: 4, modality: 'visual', deliver: true };
  return { level: null, modality: 'video', deliver: true };
}

/**
 * Invariant 1 governs CONTENT — an analogy, a diagram, a video. Asking a
 * second, differently-worded question is not a repeat, it is the L2 rung of
 * the ladder. Wording is policed separately by the do-not-repeat list.
 */
const CONTENT: Modality[] = ['analogy', 'visual', 'video'];

/** Walk forward to the first piece of content we have not used yet. */
function firstUnused(delivered: Modality[], from: Modality): Modality | null {
  const start = Math.max(CONTENT.indexOf(from), 0);
  for (let i = start; i < CONTENT.length; i += 1) {
    if (!delivered.includes(CONTENT[i])) return CONTENT[i];
  }
  for (let i = 0; i < start; i += 1) {
    if (!delivered.includes(CONTENT[i])) return CONTENT[i];
  }
  return null;
}

function whyBlocked(
  action: HelpAction,
  delivered: Modality[],
  current: Modality,
  exhausted: boolean,
): string {
  const modality = MODALITIES.find((m) => ACTION_FOR[m] === action);

  if (modality && delivered.includes(modality)) {
    return "We've already been down that road. Let's try a different angle.";
  }
  if (exhausted) {
    return "I've used every trick I have on this one. Talk it through with me instead.";
  }
  switch (action) {
    case 'analogy':
      return 'Give the question above a real shot first — then I\'ll reach for a comparison.';
    case 'visual':
      return "Let's try one more idea in words. I'll draw it if that doesn't land.";
    case 'video':
      return "A video is a big detour this early. Ask again if you're still stuck.";
    case 'hint':
      return current === 'video'
        ? "I'm out of hints — the video covers the rest better than I can."
        : 'Answer what I just asked and the next hint will actually be useful.';
    default:
      return 'Not right now.';
  }
}

export function decideIntervention(
  profile: LearnerProfile,
  misconceptionId: MisconceptionId,
): Intervention {
  const count = countFor(profile, misconceptionId);
  const delivered = deliveredFor(profile, misconceptionId);
  const base = ladderFor(count);

  let modality = base.modality;
  let reason = `count=${count} -> ladder ${base.modality}`;

  // Override: if something demonstrably works for this learner, stop climbing
  // the ladder and go straight to it.
  const wins = profile.modalityWins[profile.preferredModality ?? 'question'] ?? 0;
  if (
    count === 2 &&
    profile.preferredModality &&
    wins >= PREFERRED_MODALITY_THRESHOLD &&
    !delivered.includes(profile.preferredModality)
  ) {
    modality = profile.preferredModality;
    reason = `count=2 + preferredModality=${modality} (${wins} wins) -> override`;
  }

  // Invariant 1 — content only. A repeat question is a new rung, not a repeat.
  let exhausted = false;
  if (modality !== 'question' && delivered.includes(modality)) {
    const next = firstUnused(delivered, modality);
    if (next) {
      reason += ` -> ${modality} already delivered, advancing to ${next}`;
      modality = next;
    } else {
      exhausted = true;
      // Every piece of content is spent. Re-sending the video would hand them
      // the identical clip twice. A fresh question is the one move that is
      // always still available — the prompt is told to admit we are out of ideas.
      modality = 'question';
      reason += ' -> every modality exhausted, falling back to a fresh question';
    }
  }

  const level = base.level;
  const askComprehension = modality === 'visual' || modality === 'video' || count >= 4;

  // Offer the next unused modality after this one, plus retry, always.
  const offered: HelpAction[] = ['retry'];
  if (!exhausted) {
    if (level !== null && level < 4) offered.push('hint');

    // At L1 the question stands alone — no escape hatches on the first ask.
    // From L2 we offer the next rung. From L3, once the learner has actually
    // engaged, they can reach for ANY help they have not had yet: the ladder
    // decides what the coach volunteers, not what the learner is allowed to
    // want. Without this the video rung needs five turns on one misconception
    // and effectively never appears.
    const used = [...delivered, modality];
    if (count === 2) {
      const next = firstUnused(used, modality);
      if (next) offered.push(ACTION_FOR[next]);
    } else if (count >= 3) {
      for (const m of CONTENT) {
        if (!used.includes(m)) offered.push(ACTION_FOR[m]);
      }
    }
  }

  const blocked: BlockedAction[] = HELP_ACTIONS.filter((a) => !offered.includes(a)).map(
    (action) => ({ action, reason: whyBlocked(action, delivered, modality, exhausted) }),
  );

  return {
    hintLevel: level,
    modality,
    deliver: base.deliver,
    offeredActions: offered,
    blockedActions: blocked,
    askComprehension,
    doNotRepeat: profile.priorCoachMessages,
    exhausted,
    reason,
  };
}

/**
 * C8 — attribution. A corrected attempt credits whatever intervention
 * immediately preceded it, not whatever we happen to be doing now.
 */
export function creditFor(
  profile: LearnerProfile,
  corrected: boolean,
): Modality | null {
  if (!corrected) return null;
  return profile.lastIntervention?.modality ?? null;
}
