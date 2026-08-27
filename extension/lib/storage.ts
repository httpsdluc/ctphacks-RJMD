/**
 * A7 — chrome.storage.local wrapper for the learner profile.
 * Round-trips with a version field and a missing-profile default.
 * Never throws; a corrupt profile is a fresh profile.
 */

import { createProfile, isValidProfile } from '../../shared/profile';
import type { LearnerProfile, ProblemContext } from '../../shared/contracts';

const KEY = 'thinkpad.profile.v1';
const PROBLEM_KEY = 'thinkpad.problem.v1';

export async function readProfile(): Promise<LearnerProfile> {
  try {
    const bag = await chrome.storage.local.get(KEY);
    const stored = bag[KEY];
    if (isValidProfile(stored)) return stored;
  } catch {
    /* fall through */
  }
  return createProfile(Date.now());
}

export async function writeProfile(profile: LearnerProfile): Promise<void> {
  try {
    await chrome.storage.local.set({ [KEY]: profile });
  } catch {
    /* Storage failure must never break the demo. */
  }
}

export async function resetProfile(): Promise<LearnerProfile> {
  const fresh = createProfile(Date.now());
  await writeProfile(fresh);
  return fresh;
}

/**
 * Service workers are killed aggressively — roughly 30 seconds idle. Anything
 * the worker held in a module-level Map is gone by the time the learner reads
 * the coach's question and presses a button, and every handler then silently
 * does nothing. Session storage survives the restart and dies with the browser
 * session, which is exactly the lifetime a detected problem should have.
 */
export async function rememberProblem(problem: ProblemContext): Promise<void> {
  try {
    await chrome.storage.session.set({ [PROBLEM_KEY]: problem });
  } catch {
    /* non-fatal */
  }
}

export async function recallProblem(): Promise<ProblemContext | null> {
  try {
    const bag = await chrome.storage.session.get(PROBLEM_KEY);
    return (bag[PROBLEM_KEY] as ProblemContext | undefined) ?? null;
  } catch {
    return null;
  }
}

/**
 * B6 shows a session count. Nothing incremented it, so it read "Session 0"
 * forever — which quietly undercuts the whole "it remembers you" claim the
 * profile card is making.
 *
 * A session is one browser session: the flag lives in session storage, so it
 * counts once no matter how many times the worker restarts or the panel is
 * reopened, and counts again tomorrow.
 */
const SESSION_FLAG = 'thinkpad.sessionCounted.v1';

export async function countSessionOnce(profile: LearnerProfile): Promise<LearnerProfile> {
  try {
    const bag = await chrome.storage.session.get(SESSION_FLAG);
    if (bag[SESSION_FLAG]) return profile;
    await chrome.storage.session.set({ [SESSION_FLAG]: true });
    const bumped = { ...profile, sessionCount: profile.sessionCount + 1 };
    await writeProfile(bumped);
    return bumped;
  } catch {
    return profile;
  }
}
