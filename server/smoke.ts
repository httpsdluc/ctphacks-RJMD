/**
 * End-to-end smoke test against the real Gemini API, with no Vercel involved.
 *
 *   npm run smoke
 *
 * Calls the actual handler with a realistic CoachRequest and prints what comes
 * back. Use this before deploying, and any time /coach starts behaving oddly —
 * it isolates "is the model working" from "is Vercel working".
 */

import handler from './api/coach.ts';
import { createProfile } from '../shared/profile.ts';
import type { CoachRequest } from '../shared/contracts.ts';

const request: CoachRequest = {
  problem: {
    source: 'paste',
    slug: 'two-sum',
    title: 'Two Sum',
    statement:
      'Given an array of integers nums and an integer target, return indices of the two ' +
      'numbers such that they add up to target. Example: nums = [2,7,11,15], target = 9.',
    code: '',
    language: 'python',
    sampleInput: { nums: [2, 7, 11, 15], target: 9 },
    capturedAt: Date.now(),
  },
  attempt: {
    kind: 'explanation',
    text: "I'll loop through every pair of numbers and check if they add up to the target.",
    at: Date.now(),
  },
  profile: createProfile(Date.now()),
  requestedAction: null,
};

const res = await handler(
  new Request('https://local/api/coach', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  }),
);

const body = await res.json();

console.log(`\n  status        ${res.status}`);
console.log(`  diagnosed     ${body.misconceptionId}  (confidence ${body.confidence})`);
console.log(`  level         ${body.hintLevel}   mode: ${body.modality}`);
console.log(`  model         ${body.meta.model}   ${body.meta.latencyMs}ms`);
console.log(`  fallback used ${body.meta.fallbackUsed}${body.meta.note ? `  (${body.meta.note})` : ''}`);
console.log(`  offers        ${body.offeredActions.join(', ')}`);
console.log(`\n  coach says:\n\n    ${body.message.replace(/\n/g, '\n    ')}\n`);
if (body.comprehensionQuestion) console.log(`  check: ${body.comprehensionQuestion.prompt}\n`);
