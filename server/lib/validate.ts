/**
 * C4 — response validator + no-answer guard.
 * Any response with more than MAX_CODE_LINES_IN_RESPONSE lines of code is rejected.
 * Invalid output falls back silently — the learner never sees a validation error.
 * TODO(C4).
 */
import type { CoachResponse } from '../../shared/contracts';

export function isValidCoachResponse(_value: unknown): _value is CoachResponse {
  return false;
}
