/**
 * A7 — chrome.storage.local wrapper for the learner profile.
 * Round-trips with a version field and a missing-profile default.
 * Never throws; a corrupt profile is a fresh profile.
 */

import { createProfile, isValidProfile } from '../../shared/profile';
import type { LearnerProfile } from '../../shared/contracts';

const KEY = 'sidenote.profile.v1';

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
