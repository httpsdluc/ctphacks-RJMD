/**
 * D5 — the curated video map.
 *
 * STATUS: the `why` lines are written. The video IDs and timestamps are NOT
 * filled in, and cannot be written from a desk — someone has to watch the
 * clips and scrub to the right moment. `why` is the part that makes this
 * feature work ("here is what this clip shows you that I couldn't"), so it is
 * done; the rest is 20 minutes of watching.
 *
 * TO FILL ONE IN:
 *   1. Find the moment in the video that addresses THIS misconception —
 *      not the whole problem, the specific misunderstanding.
 *   2. Right-click the video at that moment -> "Copy video URL at current time".
 *      The URL gives you both the id (v=...) and the offset (t=...).
 *   3. Fill in youtubeId, startSec, title, channel, durationSec.
 *
 * A candidate to start from, found but NOT verified — check the title and
 * length yourself before trusting it: youtube.com/watch?v=SJHfUUl6oU4
 *
 * An entry with an empty youtubeId is treated as absent. The coach degrades to
 * a fresh question rather than handing the learner a dead player, so a
 * half-filled map is safe to ship.
 */

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

/**
 * Fill these in as you verify them. Empty youtubeId means "not ready" and the
 * coach will route around it.
 */
export const VIDEO_MAP: Partial<Record<MisconceptionId, VideoRecommendation>> = {};

/** The only way anything should read this map. Returns null unless truly ready. */
export function videoFor(id: MisconceptionId): VideoRecommendation | null {
  const v = VIDEO_MAP[id];
  if (!v || !v.youtubeId || !v.title) return null;
  return v;
}

export function buildVideo(
  id: MisconceptionId,
  parts: { youtubeId: string; title: string; channel: string; durationSec: number; startSec: number },
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
    why: VIDEO_WHY[id],
  };
}
