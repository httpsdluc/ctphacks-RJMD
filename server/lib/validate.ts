/**
 * C4 — response validator + no-answer guard.
 *
 * Two jobs:
 *   1. Shape. Anything that is not a CoachResponse gets thrown away silently.
 *   2. Restraint. The whole product is "asks instead of answers", so a reply
 *      that quietly hands over the solution is a FAILURE even if it parses.
 *
 * Invalid output falls back silently — the learner never sees a validation
 * error, and we never ship a stack trace to the panel.
 */

import {
  HELP_ACTIONS,
  MAX_CODE_LINES_IN_RESPONSE,
  MISCONCEPTION_IDS,
  MODALITIES,
} from '../../shared/contracts.ts';
import type { CoachResponse } from '../../shared/contracts.ts';

/** Lines that read like code rather than like a person talking. */
const CODE_LINE = /(^|\s)(for|while|if|return|def|function|const|let|var|class)\s|[{};]\s*$|=>|\w+\[[^\]]*\]\s*=/;

export function countCodeLines(message: string): number {
  let total = 0;

  // Fenced blocks count in full — every line, even the blank ones.
  const fences = message.match(/```[\s\S]*?```/g) ?? [];
  for (const block of fences) {
    total += block.split('\n').length - 2; // drop the two fence lines
  }

  // Loose code outside fences.
  const withoutFences = message.replace(/```[\s\S]*?```/g, '');
  for (const line of withoutFences.split('\n')) {
    if (CODE_LINE.test(line.trim())) total += 1;
  }

  return total;
}

export interface Rejection {
  reason: string;
}

/**
 * Returns null when the response is good, or a Rejection explaining why we
 * are falling back. The reason is for our logs, never for the learner.
 */
export function rejectionFor(value: unknown): Rejection | null {
  if (typeof value !== 'object' || value === null) {
    return { reason: 'not an object' };
  }
  const r = value as Partial<CoachResponse>;

  if (!MISCONCEPTION_IDS.includes(r.misconceptionId as never)) {
    return { reason: `unknown misconceptionId: ${String(r.misconceptionId)}` };
  }
  if (typeof r.message !== 'string' || r.message.trim().length < 10) {
    return { reason: 'message missing or too short' };
  }
  if (!MODALITIES.includes(r.modality as never)) {
    return { reason: `unknown modality: ${String(r.modality)}` };
  }
  if (!Array.isArray(r.offeredActions) || r.offeredActions.some((a) => !HELP_ACTIONS.includes(a))) {
    return { reason: 'offeredActions contains something that is not a HelpAction' };
  }
  if (typeof r.confidence !== 'number' || r.confidence < 0 || r.confidence > 1) {
    return { reason: 'confidence out of range' };
  }

  // The no-answer guard. This is the one that matters.
  const codeLines = countCodeLines(r.message);
  if (codeLines > MAX_CODE_LINES_IN_RESPONSE) {
    return { reason: `answered with ${codeLines} lines of code` };
  }

  // A level-1 hint that is not a question is not a level-1 hint.
  if (r.hintLevel === 1 && !r.message.trim().endsWith('?')) {
    return { reason: 'L1 hint did not end in a question' };
  }

  return null;
}

export function isValidCoachResponse(value: unknown): value is CoachResponse {
  return rejectionFor(value) === null;
}
