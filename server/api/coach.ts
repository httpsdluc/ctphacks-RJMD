/**
 * C1 — POST /coach. Vercel serverless function.
 *
 * BACKEND RULE: always HTTP 200 with a schema-valid CoachResponse.
 * On model error, timeout, or validation failure, return the hardcoded fallback.
 * The extension has no error branch for this endpoint, by design.
 *
 * TODO(C1): deploy. TODO(C3): wire the diagnosis prompt. TODO(C4): validate.
 */

import { decideIntervention } from '../lib/escalation';
import { fallbackFor } from '../lib/fallbacks';
import type { CoachRequest, CoachResponse } from '../../shared/contracts';

export default async function handler(req: Request): Promise<Response> {
  const json = (body: CoachResponse) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
    });

  try {
    const payload = (await req.json()) as CoachRequest;
    // TODO(C3): diagnose(payload) -> MisconceptionId
    // TODO(C5): decideIntervention(profile, misconceptionId) -> level + modality
    // TODO(C4): validate the model output; on failure fall through to fallbackFor()
    return json(fallbackFor('NONE'));
  } catch {
    return json(fallbackFor('NONE'));
  }
}
