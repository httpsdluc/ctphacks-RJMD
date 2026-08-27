/**
 * The service worker is the only stateful thing in the extension.
 * It holds: the current problem per tab, and the learner profile.
 * The panel is a pure view of what it broadcasts.
 */

import { onMessage, send } from '../lib/bus';
import { askCoach } from '../lib/coachClient';
import {
  countSessionOnce,
  readProfile,
  recallProblem,
  rememberProblem,
  writeProfile,
} from '../lib/storage';
import { applyProfileDelta } from '../../shared/profile';
import { fromPaste } from '../adapters/leetcode';
import type {
  CoachResponse,
  HelpAction,
  LearnerAttempt,
  ProblemContext,
} from '../../shared/contracts';

/** Keyed by tabId. Service workers sleep, so treat this as a cache, not truth. */
const problems = new Map<number, ProblemContext>();
let lastProblem: ProblemContext | null = null;
let lastResponse: CoachResponse | null = null;

function remember(tabId: number | undefined, problem: ProblemContext): void {
  if (typeof tabId === 'number') problems.set(tabId, problem);
  lastProblem = problem;
  void rememberProblem(problem);
}

async function activeTabId(): Promise<number | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

async function currentProblem(): Promise<ProblemContext | null> {
  const id = await activeTabId();
  if (typeof id === 'number' && problems.has(id)) return problems.get(id)!;
  if (lastProblem) return lastProblem;
  // The worker was restarted since detection. Session storage still has it.
  return recallProblem();
}

async function runCoach(
  attempt: LearnerAttempt,
  requestedAction: HelpAction | null,
): Promise<void> {
  const problem = await currentProblem();
  if (!problem) {
    // Never fail silently: a dead button with no explanation is the worst
    // possible outcome. Tell the panel so it can offer the paste box.
    send({
      type: 'PROBLEM_UNAVAILABLE',
      payload: { code: 'TIMEOUT', message: 'Lost track of which problem you are on.' },
    });
    return;
  }

  send({ type: 'COACH_PENDING' });

  const profile = await countSessionOnce(await readProfile());
  const response = await askCoach({ problem, attempt, profile, requestedAction });
  lastResponse = response;

  const nextProfile = applyProfileDelta(profile, response.profileDelta, Date.now());
  await writeProfile(nextProfile);

  send({ type: 'COACH_RESPONSE', payload: response });
  send({ type: 'PROFILE_UPDATED', payload: nextProfile });
}

onMessage({
  OPEN_PANEL: (_msg, sender) => {
    const tabId = sender.tab?.id;
    if (typeof tabId === 'number') {
      // Synchronous: still inside the content script's user-gesture window.
      void chrome.sidePanel.open({ tabId });
    }
  },

  PROBLEM_DETECTED: (msg, sender) => {
    remember(sender.tab?.id, msg.payload);
  },

  PROBLEM_UNAVAILABLE: (msg) => {
    // A5: the panel will show the paste box. Nothing else to do.
    console.debug('[sidenote] adapter fell back to paste:', msg.payload.code);
  },

  PROBLEM_REQUEST: async () => {
    const problem = await currentProblem();
    const profile = await readProfile();
    return { problem, profile, lastResponse };
  },

  PASTE_CONTEXT: async (msg) => {
    const problem = fromPaste(msg.payload);
    remember(await activeTabId(), problem);
    return problem;
  },

  SUBMIT_ATTEMPT: (msg) => runCoach(msg.payload, null),

  REQUEST_ACTION: async (msg) => {
    await runCoach(
      { kind: 'explanation', text: '', at: Date.now() },
      msg.payload.action,
    );
  },
});

/** Toolbar-icon fallback so the panel is always reachable, bubble or not. */
chrome.action.onClicked.addListener((tab) => {
  if (typeof tab.id === 'number') void chrome.sidePanel.open({ tabId: tab.id });
});
