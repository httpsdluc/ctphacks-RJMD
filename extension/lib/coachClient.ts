/**
 * The only place the extension talks to /coach.
 *
 * Backend rule: /coach always returns HTTP 200 with a valid CoachResponse.
 * So there is no error branch here by design — only a timeout, which produces
 * a locally-held fallback so the panel still gets something coach-voiced.
 */

import { COACH_ENDPOINT } from '../../shared/contracts';
import type { CoachRequest, CoachResponse } from '../../shared/contracts';

const TIMEOUT_MS = 12_000;

/** Used only when the network itself fails. Track C owns the real ladder. */
function offlineFallback(): CoachResponse {
  return {
    misconceptionId: 'NONE',
    confidence: 0,
    message:
      "I lost my connection for a second there. Say that again and I'll pick up where we left off?",
    hintLevel: null,
    modality: 'question',
    offeredActions: ['retry'],
    blockedActions: [],
    analogy: null,
    visual: null,
    video: null,
    comprehensionQuestion: null,
    insight: null,
    profileDelta: {
      skillUpdates: {},
      incrementMisconception: null,
      recordDelivered: null,
      creditModality: null,
      appendCoachMessage: null,
      summary: '',
    },
    learningGoal: '',
    meta: { fallbackUsed: true, model: 'offline', latencyMs: 0, note: 'network' },
  };
}

export async function askCoach(req: CoachRequest): Promise<CoachResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(COACH_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    return (await res.json()) as CoachResponse;
  } catch {
    return offlineFallback();
  } finally {
    clearTimeout(timer);
  }
}
