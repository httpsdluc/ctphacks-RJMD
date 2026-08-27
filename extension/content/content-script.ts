/**
 * A2 — detect the problem, inject the bubble.
 * A3 — bubble click asks the service worker to open the side panel.
 *
 * Deliberately small. Everything hard lives in adapters/leetcode.ts so this
 * file never needs a second author.
 */

import { send, onMessage } from '../lib/bus';
import { detectProblem, slugFromUrl } from '../adapters/leetcode';

const BUBBLE_ID = 'thinkpad-bubble';

function mountBubble(): void {
  if (document.getElementById(BUBBLE_ID)) return;

  const bubble = document.createElement('button');
  bubble.id = BUBBLE_ID;
  bubble.type = 'button';
  bubble.setAttribute('aria-label', 'Open ThinkPad coach');
  bubble.textContent = '?';

  bubble.addEventListener('click', () => {
    // Must stay synchronous inside the click handler: Chrome only allows
    // sidePanel.open() inside the user-gesture window.
    send({ type: 'OPEN_PANEL' });
  });

  document.body.appendChild(bubble);
}

function unmountBubble(): void {
  document.getElementById(BUBBLE_ID)?.remove();
}

/**
 * A8 — LeetCode renders the description pane well after document_idle, and how
 * long it takes depends on the network and whether the tab was restored from a
 * cold start. Fixed retry delays are a guess about someone else's render loop,
 * and guessing short means the learner gets asked to paste a problem the page
 * was about to hand us.
 *
 * So: watch for the element and act when it exists.
 */
const DESCRIPTION = '[data-track-load="description_content"]';
const WAIT_TIMEOUT_MS = 12_000;

/** Ready when the markup hook appears OR the statement text is simply on screen. */
function descriptionReady(): boolean {
  if (document.querySelector(DESCRIPTION)) return true;
  return (document.body?.innerText ?? '').includes('Example 1');
}

function waitForDescription(): Promise<boolean> {
  if (descriptionReady()) return Promise.resolve(true);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (found: boolean) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(timer);
      resolve(found);
    };

    const observer = new MutationObserver(() => {
      if (descriptionReady()) finish(true);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    const timer = setTimeout(() => finish(false), WAIT_TIMEOUT_MS);
  });
}

async function publish(): Promise<void> {
  if (!slugFromUrl(location.href)) {
    unmountBubble();
    return;
  }
  mountBubble();

  await waitForDescription();

  const result = detectProblem();
  if (result.ok) {
    console.debug('[sidenote] detected', result.value.title, '|', result.value.language);
    send({ type: 'PROBLEM_DETECTED', payload: result.value });
    return;
  }

  // Say why, loudly enough to debug from the page console.
  console.warn(
    `[sidenote] falling back to paste: ${result.error.code}` +
      (result.error.strategy ? ` (${result.error.strategy})` : '') +
      ` — ${result.error.message}`,
  );
  send({ type: 'PROBLEM_UNAVAILABLE', payload: result.error });
}

/** LeetCode is a SPA — the URL changes without a reload. */
function watchNavigation(): void {
  let last = location.href;
  new MutationObserver(() => {
    if (location.href !== last) {
      last = location.href;
      setTimeout(() => void publish(), 600); // let the new pane render
    }
  }).observe(document.body, { childList: true, subtree: true });
}

/** The service worker re-asks when the panel opens after the fact. */
onMessage({
  PROBLEM_REQUEST: () => Promise.resolve(detectProblem()),
});

void publish();
watchNavigation();
