import type { MisconceptionId, VideoRecommendation } from '../shared/contracts';

/** The line the panel shows under the thumbnail. This is the curation. */
export const VIDEO_WHY: Record<MisconceptionId, string> = {
  TS_BRUTE_FORCE_ONLY:
    'Watch the moment they count how many pairs the nested-loop version actually ' +
    'checks. Seeing the number is what makes the second approach feel necessary ' +
    'rather than clever.',
  TS_COMPLEMENT_CONFUSION:
    'They spend a full minute on one idea: stop looking for a pair, start looking ' +
    'for one specific number you can name before you search.',
  TS_MAP_DIRECTION_FLIPPED:
    'This is the part where they decide what to key the table on, and say out loud ' +
    'which of the two you have and which you need. That is exactly your question.',
  TS_INSERT_BEFORE_CHECK:
    'Watch the order of the two lines inside the loop. They check first and store ' +
    'second, and explain what breaks if you swap them — which is the bug you have.',
  TS_RETURNS_VALUES_NOT_INDICES:
    'Short and specific: they read the problem statement back and point at the word ' +
    'that decides what you return.',
  TS_OFF_BY_ONE_INNER_LOOP:
    'They trace the loop bounds by hand and show the exact moment an element gets ' +
    'paired with itself. Same trace you just did on paper.',
  NONE: '',
};

export function buildVideo(
  id: MisconceptionId,
  parts: { youtubeId: string; title: string; channel: string; durationSec: number; startSec: number; why?: string },
): VideoRecommendation {
  return {
    misconceptionId: id,
    title: parts.title,
    channel: parts.channel,
    youtubeId: parts.youtubeId,
    durationSec: parts.durationSec,
    startSec: parts.startSec,
    thumbnailUrl: `https://i.ytimg.com/vi/${parts.youtubeId}/hqdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${parts.youtubeId}&t=${parts.startSec}s`,
    why: parts.why ?? VIDEO_WHY[id],
  };
}

/**
 * Curated fallback videos keep the coaching flow useful without a YouTube API key.
 */
export const VIDEO_MAP: Partial<Record<MisconceptionId, VideoRecommendation>> = {
  TS_BRUTE_FORCE_ONLY: buildVideo('TS_BRUTE_FORCE_ONLY', {
    youtubeId: 'KLlXCFG5TnA',
    title: 'Two Sum — hash map walkthrough',
    channel: 'NeetCode',
    durationSec: 345,
    startSec: 78,
  }),
  TS_COMPLEMENT_CONFUSION: buildVideo('TS_COMPLEMENT_CONFUSION', {
    youtubeId: 'KLlXCFG5TnA',
    title: 'Two Sum — hash map walkthrough',
    channel: 'NeetCode',
    durationSec: 345,
    startSec: 78,
  }),
  TS_MAP_DIRECTION_FLIPPED: buildVideo('TS_MAP_DIRECTION_FLIPPED', {
    youtubeId: 'KLlXCFG5TnA',
    title: 'Two Sum — hash map walkthrough',
    channel: 'NeetCode',
    durationSec: 345,
    startSec: 78,
  }),
  TS_INSERT_BEFORE_CHECK: buildVideo('TS_INSERT_BEFORE_CHECK', {
    youtubeId: 'KLlXCFG5TnA',
    title: 'Two Sum — hash map walkthrough',
    channel: 'NeetCode',
    durationSec: 345,
    startSec: 78,
  }),
  TS_RETURNS_VALUES_NOT_INDICES: buildVideo('TS_RETURNS_VALUES_NOT_INDICES', {
    youtubeId: 'KLlXCFG5TnA',
    title: 'Two Sum — hash map walkthrough',
    channel: 'NeetCode',
    durationSec: 345,
    startSec: 78,
  }),
  TS_OFF_BY_ONE_INNER_LOOP: buildVideo('TS_OFF_BY_ONE_INNER_LOOP', {
    youtubeId: 'KLlXCFG5TnA',
    title: 'Two Sum — hash map walkthrough',
    channel: 'NeetCode',
    durationSec: 345,
    startSec: 78,
  }),
};

/** The only way anything should read this map. Returns null unless truly ready. */
export function videoFor(id: MisconceptionId): VideoRecommendation | null {
  const v = VIDEO_MAP[id];
  if (!v || !v.youtubeId || !v.title) return null;
  return v;
}
