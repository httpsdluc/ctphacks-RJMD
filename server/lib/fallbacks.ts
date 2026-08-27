/**
 * C2 — one fallback per MisconceptionId, each reading like a real coach.
 * These ship at CP1 and are what the demo falls back to if the model is down.
 * TODO(C2): write all 7.
 */

import type { CoachResponse, MisconceptionId } from '../../shared/contracts';

export const FALLBACK_RESPONSES: Record<MisconceptionId, string> = {
  TS_BRUTE_FORCE_ONLY: '',
  TS_COMPLEMENT_CONFUSION: '',
  TS_MAP_DIRECTION_FLIPPED: '',
  TS_INSERT_BEFORE_CHECK: '',
  TS_RETURNS_VALUES_NOT_INDICES: '',
  TS_OFF_BY_ONE_INNER_LOOP: '',
  NONE: '',
};

export function fallbackFor(_id: MisconceptionId): CoachResponse {
  throw new Error('TODO(C2)');
}
