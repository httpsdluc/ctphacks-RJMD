/** Curated fallback videos keep the coaching flow useful without a YouTube API key. */
import type { MisconceptionId, VideoRecommendation } from '../shared/contracts';

const twoSumVideo = (misconceptionId: MisconceptionId, why: string): VideoRecommendation => ({
	misconceptionId,
	title: 'Two Sum — hash map walkthrough',
	channel: 'NeetCode',
	youtubeId: 'KLlXCFG5TnA',
	durationSec: 345,
	startSec: 78,
	thumbnailUrl: 'https://i.ytimg.com/vi/KLlXCFG5TnA/hqdefault.jpg',
	url: 'https://www.youtube.com/watch?v=KLlXCFG5TnA&t=78s',
	why,
});

export const VIDEO_MAP: Partial<Record<MisconceptionId, VideoRecommendation>> = {
	TS_BRUTE_FORCE_ONLY: twoSumVideo('TS_BRUTE_FORCE_ONLY', 'Watch the moment a second scan becomes one lookup.'),
	TS_COMPLEMENT_CONFUSION: twoSumVideo('TS_COMPLEMENT_CONFUSION', 'This pauses on the target-minus-current-number idea.'),
	TS_MAP_DIRECTION_FLIPPED: twoSumVideo('TS_MAP_DIRECTION_FLIPPED', 'Notice what becomes the key and what becomes the stored value.'),
	TS_INSERT_BEFORE_CHECK: twoSumVideo('TS_INSERT_BEFORE_CHECK', 'The walkthrough makes the check-before-store order visible.'),
	TS_RETURNS_VALUES_NOT_INDICES: twoSumVideo('TS_RETURNS_VALUES_NOT_INDICES', 'This connects the lookup result back to the required indices.'),
	TS_OFF_BY_ONE_INNER_LOOP: twoSumVideo('TS_OFF_BY_ONE_INNER_LOOP', 'Use the trace to inspect which positions are actually compared.'),
};
