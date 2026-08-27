/**
 * C7 — build a VisualSpec from the learner's REAL values.
 *
 * This is a simulation, not a template with the numbers swapped in. If they
 * change the array in the editor, the diagram changes with it. That is the
 * whole point: a judge can edit nums and watch the steps recompute.
 */

import type { TwoSumInput, VisualSpec, VisualStep, HashMapRow } from '../../shared/contracts.ts';

export function buildTwoSumVisual(values: TwoSumInput): VisualSpec {
  const { nums, target } = values;
  const steps: VisualStep[] = [];
  const seen = new Map<number, number>();

  const rows = (highlightKey?: number, state: HashMapRow['state'] = 'idle'): HashMapRow[] =>
    [...seen.entries()].map(([key, value]) => ({
      key,
      value,
      state: key === highlightKey ? state : 'idle',
    }));

  steps.push({
    caption:
      'We walk the array once. Alongside it we keep a table of every number we have already ' +
      'seen, and where we saw it.',
    activeIndex: null,
    processedIndices: [],
    map: [],
    highlight: 'none',
  });

  for (let i = 0; i < nums.length; i += 1) {
    const n = nums[i];
    const complement = target - n;
    const processed = Array.from({ length: i }, (_, k) => k);

    steps.push({
      caption: `i = ${i}. The number here is ${n}.`,
      activeIndex: i,
      processedIndices: processed,
      map: rows(),
      highlight: 'active',
    });

    if (seen.has(complement)) {
      steps.push({
        caption: 'One lookup — not a scan of everything to the right.',
        activeIndex: i,
        processedIndices: processed,
        map: rows(complement, 'matched'),
        highlight: 'match',
        note: `${target} - ${n} = ${complement} — and ${complement} is right there, at index ${seen.get(complement)}.`,
      });
      steps.push({
        caption: `Two indices, one pass. We never had to look at what comes after index ${i}.`,
        activeIndex: i,
        processedIndices: processed,
        map: rows(complement, 'matched'),
        highlight: 'match',
        note: `return [${seen.get(complement)}, ${i}]`,
      });
      return { kind: 'hash_map_fill', title: 'One pass, one lookup table', values, steps };
    }

    steps.push({
      caption:
        i === 0
          ? 'Before storing anything, ask the table a question: have I already seen the partner this number needs?'
          : 'Same question, every time. Ask first, store second.',
      activeIndex: i,
      processedIndices: processed,
      map: rows(),
      highlight: 'miss',
      note: `${target} - ${n} = ${complement} — is ${complement} in the table?`,
    });

    seen.set(n, i);
    steps.push({
      caption: `Not there. Store ${n} and where it lives, then move on.`,
      activeIndex: i,
      processedIndices: processed,
      map: rows(n, 'just_added'),
      highlight: 'none',
      note: `${n} → index ${i}`,
    });
  }

  steps.push({
    caption: 'We reached the end without a match. For this input there is no pair.',
    activeIndex: null,
    processedIndices: nums.map((_, i) => i),
    map: rows(),
    highlight: 'none',
  });

  return { kind: 'hash_map_fill', title: 'One pass, one lookup table', values, steps };
}
