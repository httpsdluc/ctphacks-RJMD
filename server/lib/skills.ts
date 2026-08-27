/** Which skill each misconception is evidence about. Used to build profileDelta. */

import type { MisconceptionId, SkillId } from '../../shared/contracts.ts';

export const SKILL_FOR: Record<MisconceptionId, SkillId | null> = {
  TS_BRUTE_FORCE_ONLY: 'hash_maps',
  TS_COMPLEMENT_CONFUSION: 'problem_decomposition',
  TS_MAP_DIRECTION_FLIPPED: 'hash_maps',
  TS_INSERT_BEFORE_CHECK: 'hash_maps',
  TS_RETURNS_VALUES_NOT_INDICES: 'problem_decomposition',
  TS_OFF_BY_ONE_INNER_LOOP: 'array_traversal',
  NONE: null,
};
