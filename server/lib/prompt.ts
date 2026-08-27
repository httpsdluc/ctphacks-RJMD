/**
 * C3 — the prompts.
 *
 * Two calls, deliberately:
 *   1. DIAGNOSE  — what did they misunderstand? Small, cheap, easy to eval.
 *   2. COACH     — say the next thing, under constraints OUR code chose.
 *
 * The hint level and the modality are never up to the model. They arrive as
 * constraints from escalation.ts. The model's only job is wording.
 */

import type { JsonSchema } from './gemini.ts';
import { MISCONCEPTION_IDS, MISCONCEPTION_LABELS } from '../../shared/contracts.ts';
import type { LearnerAttempt, MisconceptionId, ProblemContext } from '../../shared/contracts.ts';
import type { Intervention } from './escalation.ts';

const TAXONOMY = MISCONCEPTION_IDS.map((id) => `  ${id} — ${MISCONCEPTION_LABELS[id]}`).join('\n');

export const DIAGNOSIS_SYSTEM = `You are diagnosing a beginner's understanding of the Two Sum problem.

You are NOT grading their code. You are naming the single misunderstanding that best
explains what they wrote. Choose exactly one id from this list:

${TAXONOMY}

Rules:
- Judge the IDEA, not the syntax. A correct hash-map approach with a typo is NONE.
- A working brute-force solution is still TS_BRUTE_FORCE_ONLY. Working is not the bar.
- If they describe the right approach in words but have not written it yet, that is NONE.
- If two apply, pick the one that is furthest upstream — the one that, once fixed,
  makes the other disappear.
- If nothing fits, or you are guessing, return NONE with a low confidence rather than
  inventing a misconception. A wrong diagnosis is worse than no diagnosis.`;

export const DIAGNOSIS_SCHEMA = {
  type: 'object',
  properties: {
    misconceptionId: { type: 'string', enum: [...MISCONCEPTION_IDS] },
    confidence: { type: 'number' },
    evidence: {
      type: 'string',
      description: 'One short sentence quoting what in their work led you here.',
    },
  },
  required: ['misconceptionId', 'confidence', 'evidence'],
} as JsonSchema;

export function buildDiagnosisInput(problem: ProblemContext, attempt: LearnerAttempt): string {
  return `${DIAGNOSIS_SYSTEM}

PROBLEM
${problem.statement.slice(0, 1200)}

WHAT THE LEARNER SAID
${attempt.text || '(nothing yet)'}

THEIR CODE
${problem.code ? problem.code.slice(0, 1500) : '(editor is empty)'}`;
}

/* ------------------------------------------------------------------ */

export const COACH_SYSTEM = `You are a patient coding coach. You teach by asking, not by telling.

HARD RULES — breaking any one of these fails the response:
- Never give the solution, in code or in prose. Never name the data structure that
  solves the problem. The learner has to arrive there themselves.
- Never write more than 3 lines of code, and only ever to point at something they
  already wrote.
- Sound like a person talking, not documentation. Short sentences. No bullet lists.
- Never open with praise you do not mean, and never open with "Great question".
- Lead with what is RIGHT about their thinking before you point anywhere else.`;

const MODALITY_BRIEF = {
  question:
    'Ask ONE question that makes them notice the gap themselves. No content, no hint ' +
    'at the answer. It must end in a question mark.',
  analogy:
    'Give a short real-life comparison — a coat check, a guest list, a phone book. ' +
    'Do NOT mention arrays, maps, dictionaries, hashes, or indices anywhere in it. ' +
    'End by asking what the comparison maps onto in their code.',
  visual:
    'Introduce the diagram they are about to see in one or two sentences. Tell them ' +
    'what to watch for. Do not describe the whole algorithm.',
  video:
    'Hand off to the video warmly and specifically — say what the clip will show them ' +
    'that you have not managed to. Keep it to two sentences.',
} as const;

export const COACH_SCHEMA = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    analogy: { type: 'string', description: 'Only when the modality is analogy. Otherwise "".' },
    comprehensionQuestion: {
      type: 'string',
      description: 'Only when asked for. A question they answer in one sentence. Otherwise "".',
    },
    expectedIdea: {
      type: 'string',
      description: 'What a correct answer to the comprehension question contains. Otherwise "".',
    },
  },
  required: ['message', 'analogy', 'comprehensionQuestion', 'expectedIdea'],
} as JsonSchema;

export function buildCoachInput(
  problem: ProblemContext,
  attempt: LearnerAttempt,
  misconceptionId: MisconceptionId,
  intervention: Intervention,
): string {
  const doNotRepeat = intervention.doNotRepeat.length
    ? intervention.doNotRepeat.map((m) => `- "${m}"`).join('\n')
    : '(nothing yet)';

  const exhaustion = intervention.exhausted
    ? '\nYou have already tried every approach on this misunderstanding. Say so honestly, ' +
      'and ask them to explain their thinking back to you from the beginning.'
    : '';

  return `${COACH_SYSTEM}

THE MISUNDERSTANDING YOU ARE ADDRESSING
${misconceptionId} — ${MISCONCEPTION_LABELS[misconceptionId]}

WHAT YOU ARE DOING THIS TURN (chosen for you — do not deviate)
Hint level: ${intervention.hintLevel ?? 'past the ladder'} of 4
Mode: ${intervention.modality}
${MODALITY_BRIEF[intervention.modality]}${exhaustion}
${intervention.askComprehension ? '\nAlso ask ONE comprehension question they can answer in a sentence.' : ''}

YOU HAVE ALREADY SAID THESE THINGS. Do not repeat them, do not rephrase them,
do not make the same point with different words:
${doNotRepeat}

PROBLEM
${problem.statement.slice(0, 800)}

WHAT THE LEARNER SAID
${attempt.text || '(they pressed a help button rather than typing)'}

THEIR CODE
${problem.code ? problem.code.slice(0, 1200) : '(editor is empty)'}`;
}
