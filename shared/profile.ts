/**
 * shared/profile.ts
 *
 * Pure profile logic. Shared because Track A persists it and Track C reasons
 * about it, and neither should own the other's copy of the rules.
 * No imports besides contracts. No side effects. Trivially unit-testable.
 */

import {
  DO_NOT_REPEAT_WINDOW,
  MODALITIES,
  PREFERRED_MODALITY_THRESHOLD,
  SKILL_IDS,
} from './contracts.ts';
import type {
  LearnerProfile,
  MisconceptionId,
  Modality,
  ProfileDelta,
  SkillId,
  SkillState,
} from './contracts.ts';

export function createProfile(now: number): LearnerProfile {
  return {
    version: 1,
    sessionCount: 0,
    skills: Object.fromEntries(SKILL_IDS.map((s) => [s, 'unknown'])) as Record<
      SkillId,
      SkillState
    >,
    misconceptionCounts: {},
    deliveredInterventions: {},
    priorCoachMessages: [],
    modalityWins: Object.fromEntries(MODALITIES.map((m) => [m, 0])) as Record<
      Modality,
      number
    >,
    preferredModality: null,
    lastIntervention: null,
    updatedAt: now,
  };
}

/** A7: anything unreadable or from an older version becomes a fresh profile. */
export function isValidProfile(value: unknown): value is LearnerProfile {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Partial<LearnerProfile>;
  return (
    p.version === 1 &&
    typeof p.sessionCount === 'number' &&
    typeof p.skills === 'object' &&
    p.skills !== null &&
    Array.isArray(p.priorCoachMessages)
  );
}

export function countFor(profile: LearnerProfile, id: MisconceptionId): number {
  return profile.misconceptionCounts[id] ?? 0;
}

export function deliveredFor(
  profile: LearnerProfile,
  id: MisconceptionId,
): Modality[] {
  return profile.deliveredInterventions[id] ?? [];
}

export function hasDelivered(
  profile: LearnerProfile,
  id: MisconceptionId,
  modality: Modality,
): boolean {
  return deliveredFor(profile, id).includes(modality);
}

/** Recomputed after every credit, never stored independently. */
export function derivePreferredModality(
  wins: Record<Modality, number>,
): Modality | null {
  let best: Modality | null = null;
  let bestCount = 0;
  for (const m of MODALITIES) {
    if (wins[m] > bestCount) {
      best = m;
      bestCount = wins[m];
    }
  }
  return bestCount >= PREFERRED_MODALITY_THRESHOLD ? best : null;
}

/**
 * The one place a profile ever changes. Pure: returns a new object.
 * Track A calls this and writes the result; Track C calls it in tests.
 */
export function applyProfileDelta(
  profile: LearnerProfile,
  delta: ProfileDelta,
  now: number,
): LearnerProfile {
  const next: LearnerProfile = {
    ...profile,
    skills: { ...profile.skills },
    misconceptionCounts: { ...profile.misconceptionCounts },
    deliveredInterventions: { ...profile.deliveredInterventions },
    priorCoachMessages: [...profile.priorCoachMessages],
    modalityWins: { ...profile.modalityWins },
    updatedAt: now,
  };

  for (const [skill, state] of Object.entries(delta.skillUpdates)) {
    next.skills[skill as SkillId] = state as SkillState;
  }

  if (delta.incrementMisconception && delta.incrementMisconception !== 'NONE') {
    const id = delta.incrementMisconception;
    next.misconceptionCounts[id] = (next.misconceptionCounts[id] ?? 0) + 1;
  }

  if (delta.recordDelivered) {
    const { misconceptionId, modality } = delta.recordDelivered;
    const seen = next.deliveredInterventions[misconceptionId] ?? [];
    if (!seen.includes(modality)) {
      next.deliveredInterventions[misconceptionId] = [...seen, modality];
    }
    next.lastIntervention = { misconceptionId, modality, at: now };
  }

  if (delta.creditModality) {
    next.modalityWins[delta.creditModality] += 1;
    next.preferredModality = derivePreferredModality(next.modalityWins);
  }

  if (delta.appendCoachMessage) {
    next.priorCoachMessages = [
      ...next.priorCoachMessages,
      delta.appendCoachMessage,
    ].slice(-DO_NOT_REPEAT_WINDOW);
  }

  return next;
}

/** B6 renders this. Kept here so the panel never invents its own wording. */
export function summariseProfile(profile: LearnerProfile): string {
  const improving = SKILL_IDS.filter((s) => profile.skills[s] === 'improving');
  const parts: string[] = [];
  if (improving.length > 0) {
    parts.push(`${improving.join(', ').replace(/_/g, ' ')} → improving`);
  }
  if (profile.preferredModality) {
    const phrasing: Record<Modality, string> = {
      question: 'Questions get you unstuck fastest',
      analogy: 'Real-life examples work best for you',
      visual: 'Visual explanations work best for you',
      video: 'Video walkthroughs work best for you',
    };
    parts.push(phrasing[profile.preferredModality]);
  }
  return parts.join('. ') || 'Still getting to know how you think.';
}
