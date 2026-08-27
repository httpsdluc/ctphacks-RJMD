import { SKILL_IDS, SKILL_LABELS } from '../../shared/contracts';
import { summariseProfile } from '../../shared/profile';
import type { LearnerProfile } from '../../shared/contracts';

/** TODO(B6): 4 skill chips, session count, preferred modality. */
export function ProfileCard({ profile }: { profile: LearnerProfile }) {
  return (
    <section className="sn-profile">
      <header>Session {profile.sessionCount}</header>
      <div className="sn-chips">
        {SKILL_IDS.map((s) => (
          <span key={s} className={`sn-chip sn-chip--${profile.skills[s]}`}>
            {SKILL_LABELS[s]}
          </span>
        ))}
      </div>
      <p>{summariseProfile(profile)}</p>
    </section>
  );
}
