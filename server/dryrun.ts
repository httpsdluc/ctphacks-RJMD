/**
 * Offline dry-run of the escalation machine. No API key, no network.
 *
 *   npm run dry-run
 *
 * This is how you check CP4 ("the full spine runs twice") without burning
 * quota, and how Track D checks that the demo beats actually land in order.
 */

import { applyProfileDelta, createProfile } from '../shared/profile.ts';
import { decideIntervention } from './lib/escalation.ts';
import { FALLBACK_RESPONSES } from './lib/fallbacks.ts';
import { buildTwoSumVisual } from './lib/visualSpec.ts';
import type { LearnerProfile, MisconceptionId } from '../shared/contracts.ts';

const ID: MisconceptionId = 'TS_BRUTE_FORCE_ONLY';
let profile: LearnerProfile = createProfile(Date.now());

console.log('\n  The learner keeps reaching for nested loops. Six attempts.\n');

for (let attempt = 1; attempt <= 6; attempt += 1) {
  profile = {
    ...profile,
    misconceptionCounts: {
      ...profile.misconceptionCounts,
      [ID]: (profile.misconceptionCounts[ID] ?? 0) + 1,
    },
  };

  const i = decideIntervention(profile, ID);

  console.log(`  ── attempt ${attempt} ${'─'.repeat(46)}`);
  console.log(`     level     ${i.hintLevel ?? 'past the ladder'}`);
  console.log(`     mode      ${i.modality}${i.exhausted ? '  (exhausted)' : ''}`);
  console.log(`     offers    ${i.offeredActions.join(', ')}`);
  console.log(`     machine   ${i.reason}`);
  if (i.askComprehension) console.log('     + comprehension question');
  if (i.modality === 'visual') {
    const v = buildTwoSumVisual({ nums: [3, 2, 4], target: 6 });
    console.log(`     + diagram, ${v.steps.length} steps on THEIR values [3,2,4] target 6`);
  }
  console.log('');

  profile = applyProfileDelta(
    profile,
    {
      skillUpdates: {},
      incrementMisconception: null, // already counted above
      recordDelivered: { misconceptionId: ID, modality: i.modality },
      creditModality: null,
      appendCoachMessage: FALLBACK_RESPONSES[ID],
      summary: '',
    },
    Date.now(),
  );
}

const used = profile.deliveredInterventions[ID] ?? [];
console.log(`  Delivered, in order: ${used.join(' → ')}`);
console.log(
  used.length === new Set(used).size
    ? '  INVARIANT 1 held: nothing was repeated.\n'
    : '  INVARIANT 1 VIOLATED.\n',
);
