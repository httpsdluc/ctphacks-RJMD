/**
 * C1 — POST /coach.
 *
 * BACKEND RULE: always HTTP 200 with a schema-valid CoachResponse. On model
 * error, timeout, or validation failure we return a hand-written fallback.
 * The extension has no error branch for this endpoint, by design.
 *
 * Order of operations matters:
 *   1. Gemini diagnoses (wording only — the taxonomy is ours).
 *   2. OUR code increments the count and picks the level + modality.
 *   3. Gemini writes the message under those constraints.
 *   4. OUR code validates it and silently falls back if it misbehaved.
 * The model never decides how hard to push. That is the product.
 */

import { CONFIDENCE_FLOOR } from '../../shared/contracts.ts';
import { applyProfileDelta, countFor, summariseProfile } from '../../shared/profile.ts';
import { creditFor, decideIntervention } from '../lib/escalation.ts';
import { fallbackFor, LEARNING_GOALS } from '../lib/fallbacks.ts';
import { generateJson } from '../lib/gemini.ts';
import {
  buildCoachInput,
  buildDiagnosisInput,
  COACH_SCHEMA,
  DIAGNOSIS_SCHEMA,
} from '../lib/prompt.ts';
import { SKILL_FOR } from '../lib/skills.ts';
import { rejectionFor } from '../lib/validate.ts';
import { buildTwoSumVisual } from '../lib/visualSpec.ts';
import { VIDEO_MAP } from '../../visuals/videos.ts';
import type {
  CoachRequest,
  CoachResponse,
  MisconceptionId,
  ProfileDelta,
  SkillId,
  SkillState,
} from '../../shared/contracts.ts';

/**
 * Node runtime, not edge. The edge sandbox hung on boot with this bundle —
 * OPTIONS timed out too, and OPTIONS returns 204 before touching Gemini. The
 * same artifact runs correctly under Node locally, so production now matches
 * the environment we can actually verify.
 */
export const config = { runtime: 'nodejs', maxDuration: 30 };

const CORS = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
};

const json = (body: CoachResponse) => new Response(JSON.stringify(body), { status: 200, headers: CORS });

interface Diagnosis {
  misconceptionId: MisconceptionId;
  confidence: number;
  evidence: string;
}

interface Written {
  message: string;
  analogy: string;
  comprehensionQuestion: string;
  expectedIdea: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  let payload: CoachRequest;
  try {
    payload = (await req.json()) as CoachRequest;
  } catch {
    return json(fallbackFor('NONE', { note: 'unparseable request' }));
  }

  const { problem, attempt, profile } = payload;
  if (!problem || !attempt || !profile) {
    return json(fallbackFor('NONE', { note: 'incomplete request' }));
  }

  /* 1. Diagnose. ------------------------------------------------------ */
  const diag = await generateJson<Diagnosis>(
    buildDiagnosisInput(problem, attempt),
    DIAGNOSIS_SCHEMA,
  );

  const misconceptionId: MisconceptionId =
    diag.value && diag.value.confidence >= CONFIDENCE_FLOOR ? diag.value.misconceptionId : 'NONE';

  /* 2. Our code decides how hard to push. ------------------------------ */
  // The count the machine reasons about is the one AFTER this attempt.
  const projected = {
    ...profile,
    misconceptionCounts: {
      ...profile.misconceptionCounts,
      ...(misconceptionId !== 'NONE'
        ? { [misconceptionId]: countFor(profile, misconceptionId) + 1 }
        : {}),
    },
  };
  const intervention = decideIntervention(projected, misconceptionId);

  // C8: they corrected if they were stuck on something and no longer are.
  const wasStuck = profile.lastIntervention !== null;
  const corrected = wasStuck && misconceptionId === 'NONE';

  /* 3. Gemini writes the words, under our constraints. ------------------ */
  const written = await generateJson<Written>(
    buildCoachInput(problem, attempt, misconceptionId, intervention),
    COACH_SCHEMA,
  );

  /* 4. Validate, then assemble. ---------------------------------------- */
  const candidate = written.value
    ? assemble(payload, misconceptionId, intervention, written.value, corrected, {
        model: written.model,
        latencyMs: diag.latencyMs + written.latencyMs,
      })
    : null;

  const rejection = candidate ? rejectionFor(candidate) : { reason: written.error ?? 'no output' };
  if (!candidate || rejection) {
    const fb = fallbackFor(misconceptionId, {
      hintLevel: intervention.hintLevel,
      modality: 'question',
      offeredActions: intervention.offeredActions,
      note: rejection?.reason,
    });
    fb.blockedActions = intervention.blockedActions;
    fb.profileDelta.summary = summariseProfile(
      applyProfileDelta(profile, fb.profileDelta, Date.now()),
    );
    return json(fb);
  }

  return json(candidate);
}

function assemble(
  payload: CoachRequest,
  misconceptionId: MisconceptionId,
  intervention: ReturnType<typeof decideIntervention>,
  written: Written,
  corrected: boolean,
  meta: { model: string; latencyMs: number },
): CoachResponse {
  const { problem, profile } = payload;

  const skill = SKILL_FOR[misconceptionId];
  const skillUpdates: Partial<Record<SkillId, SkillState>> = {};
  if (skill) skillUpdates[skill] = 'struggling';
  if (corrected && profile.lastIntervention) {
    const healed = SKILL_FOR[profile.lastIntervention.misconceptionId];
    if (healed) skillUpdates[healed] = 'improving';
  }

  const delta: ProfileDelta = {
    skillUpdates,
    incrementMisconception: misconceptionId === 'NONE' ? null : misconceptionId,
    recordDelivered:
      misconceptionId === 'NONE'
        ? null
        : { misconceptionId, modality: intervention.modality },
    creditModality: creditFor(profile, corrected),
    appendCoachMessage: written.message,
    summary: '',
  };
  delta.summary = summariseProfile(applyProfileDelta(profile, delta, Date.now()));

  const values = problem.sampleInput ?? { nums: [2, 7, 11, 15], target: 9 };
  const video = VIDEO_MAP[misconceptionId] ?? null;

  return {
    misconceptionId,
    confidence: intervention.exhausted ? CONFIDENCE_FLOOR : 0.9,
    message: written.message,
    hintLevel: intervention.hintLevel,
    modality: intervention.modality,
    offeredActions: intervention.offeredActions,
    blockedActions: intervention.blockedActions,
    analogy: intervention.modality === 'analogy' ? written.analogy || null : null,
    visual: intervention.modality === 'visual' ? buildTwoSumVisual(values) : null,
    video: intervention.modality === 'video' ? video : null,
    comprehensionQuestion:
      intervention.askComprehension && written.comprehensionQuestion
        ? {
            id: `${misconceptionId}-${intervention.hintLevel ?? 'x'}`,
            prompt: written.comprehensionQuestion,
            expectedIdea: written.expectedIdea,
          }
        : null,
    profileDelta: delta,
    learningGoal: LEARNING_GOALS[misconceptionId],
    meta: { fallbackUsed: false, model: meta.model, latencyMs: meta.latencyMs },
  };
}
