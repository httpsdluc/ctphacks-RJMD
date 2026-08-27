import { summariseSession } from '../../shared/summary';
import type { CoachResponse, LearnerProfile } from '../../shared/contracts';

/**
 * A compact read of the diagnosis, on the coach screen itself.
 *
 * The full version lives one tab away, but a tab nobody opens is a feature
 * nobody sees — and "we diagnose why you are stuck" is the claim the whole
 * product rests on. This puts the headline and the single worst pattern in
 * front of the learner while they are actually stuck, and offers the rest.
 *
 * Renders nothing until there is something honest to say.
 */
export function DiagnosticStrip({
  history,
  profile,
  onOpen,
}: {
  history: CoachResponse[];
  profile: LearnerProfile;
  onOpen: () => void;
}) {
  if (history.length === 0) return null;

  const s = summariseSession(history, profile);
  const topStrength = s.strengths[0];
  if (!s.focus && !topStrength) return null;

  return (
    <section className="sn-diagnostic" aria-label="Where you stand">
      <span className="sn-eyebrow">Where you stand</span>
      <p className="sn-diagnostic-headline">{s.headline}</p>

      <ul className="sn-diagnostic-points">
        {topStrength && (
          <li className="sn-good">
            <b>Working</b>
            {topStrength}
          </li>
        )}
        {s.focus && (
          <li className="sn-bad">
            <b>Costing you{s.focus.attempts > 1 ? ` · ${s.focus.attempts} attempts` : ''}</b>
            {s.focus.label}
          </li>
        )}
        {s.focus && (
          <li className="sn-next">
            <b>Do this next</b>
            {s.focus.nextStep}
          </li>
        )}
      </ul>

      <button type="button" className="sn-link" onClick={onOpen}>
        See the full diagnosis →
      </button>
    </section>
  );
}
