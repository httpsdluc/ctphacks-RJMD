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
import { guardDiagnosis } from '../lib/guard.ts';
import {
  buildCoachInput,
  buildDiagnosisInput,
  COACH_SCHEMA,
  DIAGNOSIS_SCHEMA,
} from '../lib/prompt.ts';
import { SKILL_FOR } from '../lib/skills.ts';
import { rejectionFor } from '../lib/validate.ts';
import { buildTwoSumVisual } from '../lib/visualSpec.ts';
import { videoFor } from '../../visuals/videos.ts';
import { ANALOGIES } from '../../visuals/analogies.ts';
import type {
  CoachRequest,
  CoachResponse,
  MisconceptionId,
  ProfileDelta,
  SkillId,
  SkillState,
} from '../../shared/contracts.ts';

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

export async function coach(req: Request): Promise<Response> {
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

  const proposed: MisconceptionId =
    diag.value && diag.value.confidence >= CONFIDENCE_FLOOR ? diag.value.misconceptionId : 'NONE';

  // NONE tells the learner to go write it. We do not let the model say that
  // about an approach with no memory in it. See lib/guard.ts.
  const guarded = guardDiagnosis(proposed, attempt.text, problem.code);
  const misconceptionId = guarded.misconceptionId;

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
  let intervention = decideIntervention(projected, misconceptionId);

  // The video rung is only real if Track D has actually curated one. Promising
  // a video and rendering an empty player is worse than admitting we are out of
  // angles, so route around it rather than escalating into nothing.
  if (intervention.modality === 'video' && !videoFor(misconceptionId)) {
    intervention = {
      ...intervention,
      modality: 'question',
      exhausted: true,
      reason: `${intervention.reason} -> no curated video, falling back to a fresh question`,
    };
  }

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
      // NONE is praise, not a hint. Forcing level 1 onto it produces an "L1"
      // that does not end in a question, which our own contract forbids.
      hintLevel: misconceptionId === 'NONE' ? null : intervention.hintLevel,
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

  return {
    misconceptionId,
    confidence: intervention.exhausted ? CONFIDENCE_FLOOR : 0.9,
    message: written.message,
    hintLevel: intervention.hintLevel,
    modality: intervention.modality,
    offeredActions: intervention.offeredActions,
    blockedActions: intervention.blockedActions,
    // If the model's analogy comes back empty, use D6's hand-written one rather
    // than delivering an "analogy" turn with no analogy in it.
    analogy:
      intervention.modality === 'analogy'
        ? written.analogy || ANALOGIES[misconceptionId] || null
        : null,
    visual: intervention.modality === 'visual' ? buildTwoSumVisual(values) : null,
    video: intervention.modality === 'video' ? videoFor(misconceptionId) : null,
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

/* ------------------------------------------------------------------ *
 * Vercel entry — signature-agnostic.
 *
 * Vercel invokes a Node function as handler(req, res) with Node's own
 * IncomingMessage/ServerResponse, but invokes edge (and newer Node web
 * handlers) as handler(request) returning a Response. Returning a Response
 * from the (req, res) form does nothing: nobody ever calls res.end(), so the
 * request hangs until it times out — for every method, including OPTIONS.
 *
 * Detecting which form we are in costs one typeof check and removes an entire
 * class of deploy failure, so we do that rather than guess.
 * ------------------------------------------------------------------ */

interface NodeResponseLike {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
}

interface NodeRequestLike {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  setEncoding?(enc: string): void;
  on?(event: string, cb: (chunk?: unknown) => void): void;
}

function isNodeResponse(value: unknown): value is NodeResponseLike {
  return typeof (value as NodeResponseLike | undefined)?.setHeader === 'function';
}

async function readBody(req: NodeRequestLike): Promise<string> {
  // Vercel usually parses JSON bodies for us.
  if (typeof req.body === 'string') return req.body;
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body);
  if (typeof req.on !== 'function') return '';
  return new Promise<string>((resolve) => {
    let raw = '';
    req.setEncoding?.('utf8');
    req.on!('data', (chunk) => {
      raw += String(chunk);
    });
    req.on!('end', () => resolve(raw));
  });
}

export default async function handler(
  a: Request | NodeRequestLike,
  b?: unknown,
): Promise<Response | void> {
  if (!isNodeResponse(b)) return coach(a as Request);

  const req = a as NodeRequestLike;
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === 'string') headers.set(k, v);
    else if (Array.isArray(v)) headers.set(k, v.join(', '));
  }

  const method = req.method ?? 'GET';
  const body = method === 'GET' || method === 'HEAD' ? undefined : await readBody(req);
  const response = await coach(
    new Request(`https://vercel.local${req.url ?? '/api/coach'}`, { method, headers, body }),
  );

  b.statusCode = response.status;
  response.headers.forEach((value, key) => b.setHeader(key, value));
  b.end(await response.text());
}
