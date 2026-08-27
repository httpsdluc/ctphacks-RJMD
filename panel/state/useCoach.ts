/**
 * B's only contact with Track A. USE_FIXTURES renders the panel entirely from
 * fixtures/ with no service worker and no backend — useful for UI work, but the
 * buttons do nothing in that mode, by design.
 * Until then the whole panel builds with the backend and the adapter deleted.
 */

import { useCallback, useEffect, useState } from 'react';
import { onMessage, request, send } from '../../extension/lib/bus';
import { createProfile } from '../../shared/profile';
import coachFixture from '../../fixtures/coachResponse.json';
import problemFixture from '../../fixtures/problemContext.json';
import profileFixture from '../../fixtures/profile.json';
import type {
  AdapterError,
  CoachResponse,
  HelpAction,
  LearnerAttempt,
  LearnerProfile,
  ProblemContext,
} from '../../shared/contracts';

export const USE_FIXTURES = false;

export type PanelStatus = 'loading' | 'ready' | 'thinking' | 'needs_paste';

export interface CoachState {
  status: PanelStatus;
  /** Why detection gave up. Shown on the paste screen so a failure is legible
   *  without opening a devtools console. */
  detectionError: AdapterError | null;
  problem: ProblemContext | null;
  profile: LearnerProfile;
  /** Newest last. B3 scrolls back through this. */
  history: CoachResponse[];
  latest: CoachResponse | null;
}

export function useCoach() {
  const [state, setState] = useState<CoachState>({
    status: 'loading',
    detectionError: null,
    problem: null,
    profile: createProfile(Date.now()),
    history: [],
    latest: null,
  });

  useEffect(() => {
    if (USE_FIXTURES) {
      setState({
        status: 'ready',
        problem: problemFixture as ProblemContext,
        profile: profileFixture as LearnerProfile,
        history: [coachFixture as CoachResponse],
        latest: coachFixture as CoachResponse,
        detectionError: null,
      });
      return;
    }

    let alive = true;
    void request<{
      problem: ProblemContext | null;
      profile: LearnerProfile;
      lastResponse: CoachResponse | null;
      lastError: AdapterError | null;
    }>({ type: 'PROBLEM_REQUEST' }).then((res) => {
      if (!alive) return;
      setState((s) => ({
        ...s,
        status: res?.problem ? 'ready' : 'needs_paste',
        problem: res?.problem ?? null,
        profile: res?.profile ?? s.profile,
        latest: res?.lastResponse ?? null,
        history: res?.lastResponse ? [res.lastResponse] : [],
        detectionError:
          res?.lastError ??
          (res === null
            ? { code: 'TIMEOUT', message: 'The background worker did not answer.' }
            : res.problem
              ? null
              : { code: 'NOT_A_PROBLEM_PAGE', message: 'No problem was detected on this tab.' }),
      }));
    });

    const off = onMessage({
      COACH_PENDING: () => setState((s) => ({ ...s, status: 'thinking' })),
      COACH_RESPONSE: (msg) =>
        setState((s) => ({
          ...s,
          status: 'ready',
          latest: msg.payload,
          history: [...s.history, msg.payload],
        })),
      PROFILE_UPDATED: (msg) => setState((s) => ({ ...s, profile: msg.payload })),
      PROBLEM_DETECTED: (msg) =>
        setState((s) => ({ ...s, status: 'ready', problem: msg.payload })),
      PROBLEM_UNAVAILABLE: (msg) =>
        setState((s) =>
          s.problem ? s : { ...s, status: 'needs_paste', detectionError: msg.payload },
        ),
    });

    return () => {
      alive = false;
      off();
    };
  }, []);

  const submitExplanation = useCallback((text: string) => {
    const attempt: LearnerAttempt = { kind: 'explanation', text, at: Date.now() };
    if (USE_FIXTURES) return;
    send({ type: 'SUBMIT_ATTEMPT', payload: attempt });
  }, []);

  const requestAction = useCallback((action: HelpAction) => {
    if (USE_FIXTURES) return;
    send({ type: 'REQUEST_ACTION', payload: { action } });
  }, []);

  const submitPaste = useCallback(
    async (payload: { statement: string; code: string; language: string }) => {
      if (USE_FIXTURES) return;
      const problem = await request<ProblemContext>({ type: 'PASTE_CONTEXT', payload });
      if (problem) setState((s) => ({ ...s, status: 'ready', problem }));
    },
    [],
  );

  return { ...state, submitExplanation, requestAction, submitPaste };
}
