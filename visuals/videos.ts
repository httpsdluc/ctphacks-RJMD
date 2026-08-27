/** Curated fallback videos keep the coaching flow useful without a YouTube API key. */
import type { MisconceptionId, VideoRecommendation } from '../shared/contracts';

export const VIDEO_WHY: Record<MisconceptionId, string> = {
  TS_BRUTE_FORCE_ONLY: 'Watch the moment a second scan becomes one lookup.',
  TS_COMPLEMENT_CONFUSION: 'This pauses on the target-minus-current-number idea.',
  TS_MAP_DIRECTION_FLIPPED: 'Notice what becomes the key and what becomes the stored value.',
  TS_INSERT_BEFORE_CHECK: 'The walkthrough makes the check-before-store order visible.',
  TS_RETURNS_VALUES_NOT_INDICES: 'This connects the lookup result back to the required indices.',
  TS_OFF_BY_ONE_INNER_LOOP: 'Use the trace to inspect which positions are actually compared.',
  NONE: '',
};

const twoSumVideo = (misconceptionId: MisconceptionId): VideoRecommendation => ({
  misconceptionId,
  title: 'Two Sum — hash map walkthrough',
  channel: 'NeetCode',
  youtubeId: 'KLlXCFG5TnA',
  durationSec: 345,
  startSec: 78,
  thumbnailUrl: 'https://i.ytimg.com/vi/KLlXCFG5TnA/hqdefault.jpg',
  url: 'https://www.youtube.com/watch?v=KLlXCFG5TnA&t=78s',
  why: VIDEO_WHY[misconceptionId],
});

export const VIDEO_MAP: Partial<Record<MisconceptionId, VideoRecommendation>> = {
  TS_BRUTE_FORCE_ONLY: twoSumVideo('TS_BRUTE_FORCE_ONLY'),
  TS_COMPLEMENT_CONFUSION: twoSumVideo('TS_COMPLEMENT_CONFUSION'),
  TS_MAP_DIRECTION_FLIPPED: twoSumVideo('TS_MAP_DIRECTION_FLIPPED'),
  TS_INSERT_BEFORE_CHECK: twoSumVideo('TS_INSERT_BEFORE_CHECK'),
  TS_RETURNS_VALUES_NOT_INDICES: twoSumVideo('TS_RETURNS_VALUES_NOT_INDICES'),
  TS_OFF_BY_ONE_INNER_LOOP: twoSumVideo('TS_OFF_BY_ONE_INNER_LOOP'),
};

export function videoFor(id: MisconceptionId): VideoRecommendation | null {
  return VIDEO_MAP[id] ?? null;
}

export function buildVideo(
  id: MisconceptionId,
  parts: { youtubeId: string; title: string; channel: string; durationSec: number; startSec: number },
): VideoRecommendation {
  return {
    misconceptionId: id,
    ...parts,
    thumbnailUrl: `https://i.ytimg.com/vi/${parts.youtubeId}/hqdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${parts.youtubeId}&t=${parts.startSec}s`,
    why: VIDEO_WHY[id],
  };
}
