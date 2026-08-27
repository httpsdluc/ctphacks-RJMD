import type { VideoRecommendation } from '../../shared/contracts';

/** TODO(B4): thumbnail, duration, "why this video", opens at startSec. */
export function VideoCard({ video }: { video: VideoRecommendation }) {
  return (
    <a className="sn-video" href={video.url} target="_blank" rel="noreferrer">
      <img src={video.thumbnailUrl} alt="" />
      <div>
        <strong>{video.title}</strong>
        <span>{video.channel}</span>
        <p className="sn-why">{video.why}</p>
      </div>
    </a>
  );
}
