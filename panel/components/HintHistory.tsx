import { summariseSession } from '../../shared/summary';
import type { CoachResponse, LearnerProfile } from '../../shared/contracts';

/**
 * B3 — "what we've covered".
 *
 * This used to list the coach's messages back at the learner, which is a
 * transcript of something they had just read. It now reports what the session
 * actually revealed: what is landing, what keeps costing them attempts, and
 * how the coach has tried so far.
 *
 * All of it is derived in shared/summary.ts from the profile — no extra model
 * call, so it is instant and cannot invent praise.
 */
export function HintHistory({
  history,
  profile,
}: {
  history: CoachResponse[];
  profile: LearnerProfile;
}) {
  const s = summariseSession(history, profile);

  return (
    <section className="sn-summary" aria-label="Session summary">
      <p className="sn-summary-headline">{s.headline}</p>

      {s.strengths.length > 0 && (
        <div className="sn-summary-block">
          <span className="sn-eyebrow">What's working</span>
          <ul>
            {s.strengths.map((line) => (
              <li key={line} className="sn-good">
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

      {s.struggles.length > 0 && (
        <div className="sn-summary-block">
          <span className="sn-eyebrow">What keeps costing you attempts</span>
          <ul>
            {s.struggles.map((line) => (
              <li key={line} className="sn-bad">
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

      {s.path.length > 0 && (
        <div className="sn-summary-block">
          <span className="sn-eyebrow">How I've tried to help</span>
          <ol className="sn-path">
            {s.path.map((step, i) => (
              <li key={`${step}-${i}`}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
