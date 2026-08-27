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
  AdapterError,
  CoachResponse,
  Result,
  HelpAction,
  LearnerAttempt,
  ProblemContext,
} from '../../shared/contracts';

/** Keyed by tabId. Service workers sleep, so treat this as a cache, not truth. */
const problems = new Map<number, ProblemContext>();
let lastProblem: ProblemContext | null = null;
let lastResponse: CoachResponse | null = null;
let lastError: AdapterError | null = null;

async function remember(tabId: number | undefined, problem: ProblemContext): Promise<void> {
  if (typeof tabId === 'number') problems.set(tabId, problem);
  lastProblem = problem;
  await rememberProblem(problem);
}

async function activeTabId(): Promise<number | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

/**
 * Ask the page directly. The content script answers PROBLEM_REQUEST with a live
 * Result, so this works even if its original announcement never arrived.
 */
async function askTab(tabId: number): Promise<ProblemContext | null> {
  try {
    const result = (await chrome.tabs.sendMessage(tabId, { type: 'PROBLEM_REQUEST' })) as
      | Result<ProblemContext>
      | undefined;
    if (result?.ok) {
      await remember(tabId, result.value);
      return result.value;
    }
    if (result && !result.ok) lastError = result.error;
    return null;
  } catch {
    // Nothing answered. Reloading the extension orphans the content scripts in
    // already-open tabs: their DOM survives (the bubble is still visible) but
    // their runtime connection is severed, so this looks identical to "the page
    // is unreadable". Re-inject and ask once more.
    return reinjectAndAsk(tabId);
  }
}

async function reinjectAndAsk(tabId: number): Promise<ProblemContext | null> {
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content-script.js'] });
    const result = (await chrome.tabs.sendMessage(tabId, { type: 'PROBLEM_REQUEST' })) as
      | Result<ProblemContext>
      | undefined;
    if (result?.ok) {
      await remember(tabId, result.value);
      return result.value;
    }
    if (result && !result.ok) lastError = result.error;
    return null;
  } catch (err) {
    lastError = {
      code: 'SELECTOR_FAILED',
      message: err instanceof Error ? err.message : 'Could not reach the page.',
      strategy: 'reinject',
    };
    return null;
  }
}

/**
 * Detection used to be push-only: the content script announced the problem once
 * at page load and the worker held it in memory. Any worker restart after that
 * — and MV3 workers are killed aggressively — left the panel with nothing and
 * no way to recover, which looked exactly like a broken selector.
 *
 * So: check the caches, then ASK the page. Pull beats push for something we can
 * re-derive on demand.
 */
async function currentProblem(): Promise<ProblemContext | null> {
  const id = await activeTabId();
  if (typeof id === 'number' && problems.has(id)) return problems.get(id)!;
  if (lastProblem) return lastProblem;

  const stored = await recallProblem();
  if (stored) return stored;

  if (typeof id === 'number') return askTab(id);
  return null;
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

  // Returning the promise keeps the message channel — and the worker — alive
  // until the session-storage write actually lands. Firing it and returning
  // synchronously let Chrome sleep the worker mid-write, losing the problem.
  PROBLEM_DETECTED: async (msg, sender) => {
    await remember(sender.tab?.id, msg.payload);
  },

  PROBLEM_UNAVAILABLE: (msg) => {
    // A5: the panel will show the paste box. Nothing else to do.
    console.debug('[sidenote] adapter fell back to paste:', msg.payload.code);
  },

  PROBLEM_REQUEST: async () => {
    const problem = await currentProblem();
    const profile = await readProfile();
    return { problem, profile, lastResponse, lastError };
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
