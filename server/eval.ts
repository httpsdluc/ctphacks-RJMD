/**
 * C3 — diagnosis eval.
 *
 *   npm run eval           against the local handler (fast prompt iteration)
 *   npm run eval -- --live against https://ctp-rjmd.vercel.app/api/coach
 *
 * Bar from the plan: 10 hand-written wrong explanations, >=8 classified
 * correctly. Also checks the things the demo depends on that a classifier
 * score would not catch — that L1 replies are questions, that no reply leaks
 * a solution, and that we are not quietly falling back.
 */

import { COACH_ENDPOINT } from '../shared/contracts.ts';
import { createProfile } from '../shared/profile.ts';
import { countCodeLines } from './lib/validate.ts';
import { coach } from './api/coach.ts';
import type { CoachRequest, CoachResponse, MisconceptionId } from '../shared/contracts.ts';

const LIVE = process.argv.includes('--live');

const STATEMENT =
  'Given an array of integers nums and an integer target, return indices of the two ' +
  'numbers such that they add up to target. You may not use the same element twice. ' +
  'Example: nums = [2,7,11,15], target = 9.';

interface Case {
  expect: MisconceptionId;
  text: string;
}

const CASES: Case[] = [
  {
    expect: 'TS_BRUTE_FORCE_ONLY',
    text: "I'll loop through every number, and for each one loop through the rest of the array to see if the two add up to the target.",
  },
  {
    expect: 'TS_BRUTE_FORCE_ONLY',
    text: "I'd compare the first number against all the others, then the second against all the others, and keep going until a pair works.",
  },
  {
    expect: 'TS_COMPLEMENT_CONFUSION',
    text: "I'll put every number into a hash map first. Then I'll loop through the array again and check whether nums[i] is in the map.",
  },
  {
    expect: 'TS_MAP_DIRECTION_FLIPPED',
    text: "I'll build a dictionary where the key is the index and the value is the number at that index, then look up the number I still need.",
  },
  {
    expect: 'TS_INSERT_BEFORE_CHECK',
    text: 'For each number I add it into the map first, and then I check whether target minus that number is already in the map.',
  },
  {
    expect: 'TS_RETURNS_VALUES_NOT_INDICES',
    text: 'Once I find the two numbers that add up to the target, I return those two numbers.',
  },
  {
    expect: 'TS_OFF_BY_ONE_INNER_LOOP',
    text: 'My two loops mostly work, but on nums = [3,2,4] with target 6 it returns [0,0] instead of [1,2]. The inner loop starts at j = 0 like the outer one.',
  },
  {
    expect: 'NONE',
    text: "I'll walk the array once, keeping a dictionary of the numbers I've already seen mapped to their index. For each number I check whether target minus it is already in there — if it is I return both indices, otherwise I store it and move on.",
  },
  {
    expect: 'NONE',
    text: 'As I go through, I remember each number and where it was. Before I remember the current one, I check whether the number that would complete the pair has already shown up.',
  },
  {
    expect: 'TS_BRUTE_FORCE_ONLY',
    text: 'I want to check every possible combination of two numbers in the list and stop as soon as one of them sums to the target.',
  },
];

function buildRequest(text: string): CoachRequest {
  return {
    problem: {
      source: 'paste',
      slug: 'two-sum',
      title: 'Two Sum',
      statement: STATEMENT,
      code: '',
      language: 'python',
      sampleInput: { nums: [2, 7, 11, 15], target: 9 },
      capturedAt: 0,
    },
    attempt: { kind: 'explanation', text, at: 0 },
    profile: createProfile(0),
    requestedAction: null,
  };
}

async function ask(text: string): Promise<CoachResponse> {
  const payload = buildRequest(text);
  if (LIVE) {
    const res = await fetch(COACH_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return (await res.json()) as CoachResponse;
  }
  const res = await coach(
    new Request('https://local/api/coach', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  );
  return (await res.json()) as CoachResponse;
}

console.log(`\n  C3 diagnosis eval — ${LIVE ? 'LIVE' : 'local'}, ${CASES.length} cases\n`);

let correct = 0;
let notQuestions = 0;
let leakedCode = 0;
let fellBack = 0;
const confusions: string[] = [];

/**
 * The free tier allows 15 requests/minute and each case costs TWO (diagnose,
 * then coach). Without pacing the back half of this eval 429s and silently
 * scores itself on fallbacks. 9s between cases keeps us at ~13/min.
 */
const PACE_MS = 9_000;

for (const [i, c] of CASES.entries()) {
  if (i > 0) await new Promise((r) => setTimeout(r, PACE_MS));
  const r = await ask(c.text);
  const hit = r.misconceptionId === c.expect;

  if (hit) correct += 1;
  else confusions.push(`${c.expect} -> ${r.misconceptionId}`);
  if (r.hintLevel === 1 && !r.message.trim().endsWith('?')) notQuestions += 1;
  if (countCodeLines(r.message) > 3) leakedCode += 1;
  if (r.meta.fallbackUsed) {
    fellBack += 1;
    console.log(`         (fell back: ${r.meta.note ?? 'no note'})`);
  }

  const mark = hit ? 'ok  ' : 'MISS';
  console.log(`  ${mark} ${String(i + 1).padStart(2)}. expected ${c.expect}`);
  if (!hit) console.log(`         got      ${r.misconceptionId} (conf ${r.confidence})`);
  console.log(`         "${r.message.slice(0, 110)}${r.message.length > 110 ? '…' : ''}"`);
}

const pct = Math.round((correct / CASES.length) * 100);
console.log(`\n  diagnosis      ${correct}/${CASES.length}  (${pct}%)   bar is 8/10`);
console.log(`  L1 not a question   ${notQuestions}`);
console.log(`  leaked code         ${leakedCode}`);
console.log(`  silent fallback     ${fellBack}`);
if (confusions.length) console.log(`\n  confusions:\n    ${confusions.join('\n    ')}`);
console.log(correct >= 8 ? '\n  PASS\n' : '\n  BELOW BAR — the prompt needs work\n');
