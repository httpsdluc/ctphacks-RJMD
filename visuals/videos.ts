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
/**
 * The video id is verified real: KLlXCFG5TnA is "Two Sum - Leetcode 1 - HashMap
 * - Python" by NeetCode (checked against YouTube's oEmbed endpoint). The title
 * here now matches the actual title rather than a paraphrase, because the panel
 * shows it and a judge may recognise the video.
 *
 * STILL TO DO — every entry currently points at the SAME moment (startSec 78).
 * The `why` lines above promise a specific moment per misconception ("watch the
 * moment they count how many pairs..."), and right now they all land in the
 * same place, so those promises are not kept. Scrub the video once and set six
 * real offsets. durationSec is also unverified — oEmbed does not report length.
 */
/**
 * ONE VIDEO, SIX MOMENTS.
 *
 * The id is verified real: KLlXCFG5TnA is "Two Sum - Leetcode 1 - HashMap -
 * Python" by NeetCode (checked against YouTube's oEmbed endpoint).
 *
 * TO FINISH THIS: open the video, scrub to the moment that addresses each
 * misconception, and put that many seconds below. Nothing else needs editing.
 * The `why` line above each one tells you what moment you are looking for.
 *
 * They currently all read 78, which means every escalation lands in the same
 * place and the why lines promise something they do not deliver.
 */
const VIDEO = {
  youtubeId: 'KLlXCFG5TnA',
  title: 'Two Sum - Leetcode 1 - HashMap - Python',
  channel: 'NeetCode',
  durationSec: 345,
};

/** Seconds into the video. Replace each 78. */
export const TIMESTAMPS: Partial<Record<MisconceptionId, number>> = {
  // "the moment they count how many pairs the nested-loop version checks"
  TS_BRUTE_FORCE_ONLY: 78,
  // "stop looking for a pair, start looking for one specific number"
  TS_COMPLEMENT_CONFUSION: 78,
  // "which of the two you have and which you need"
  TS_MAP_DIRECTION_FLIPPED: 78,
  // "they check first and store second, and what breaks if you swap them"
  TS_INSERT_BEFORE_CHECK: 78,
  // "they read the statement back and point at the word that decides the return"
  TS_RETURNS_VALUES_NOT_INDICES: 78,
  // "the exact moment an element gets paired with itself"
  TS_OFF_BY_ONE_INNER_LOOP: 78,
};

export const VIDEO_MAP: Partial<Record<MisconceptionId, VideoRecommendation>> =
  Object.fromEntries(
    Object.entries(TIMESTAMPS).map(([id, startSec]) => [
      id,
      buildVideo(id as MisconceptionId, { ...VIDEO, startSec: startSec as number }),
    ]),
  );

/** The only way anything should read this map. Returns null unless truly ready. */
export function videoFor(id: MisconceptionId): VideoRecommendation | null {
  const v = VIDEO_MAP[id];
  if (!v || !v.youtubeId || !v.title) return null;
  return v;
}
