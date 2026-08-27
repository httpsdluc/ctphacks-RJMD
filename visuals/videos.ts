/** TODO(D5): 6 entries, one per misconception, each with startSec and a specific `why`. */
import type { MisconceptionId, VideoRecommendation } from '../shared/contracts';

export const VIDEO_MAP: Partial<Record<MisconceptionId, VideoRecommendation>> = {};
