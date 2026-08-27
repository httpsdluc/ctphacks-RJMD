/**
 * A2 — detect the problem, inject the bubble.
 * A3 — bubble click asks the service worker to open the side panel.
 *
 * Deliberately small. Everything hard lives in adapters/leetcode.ts so this
 * file never needs a second author.
 */

import { send, onMessage } from '../lib/bus';
import { detectProblem, slugFromUrl } from '../adapters/leetcode';

const BUBBLE_ID = 'sidenote-bubble';

function mountBubble(): void {
  if (document.getElementById(BUBBLE_ID)) return;

  const bubble = document.createElement('button');
  bubble.id = BUBBLE_ID;
  bubble.type = 'button';
  bubble.setAttribute('aria-label', 'Open Sidenote coach');
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

function publish(): void {
  if (!slugFromUrl(location.href)) {
    unmountBubble();
    return;
  }
  mountBubble();

  const result = detectProblem();
  if (result.ok) {
    send({ type: 'PROBLEM_DETECTED', payload: result.value });
  } else {
    send({ type: 'PROBLEM_UNAVAILABLE', payload: result.error });
  }
}

/** LeetCode is a SPA — the URL changes without a reload. */
function watchNavigation(): void {
  let last = location.href;
  new MutationObserver(() => {
    if (location.href !== last) {
      last = location.href;
      setTimeout(publish, 600); // let the new pane render
    }
  }).observe(document.body, { childList: true, subtree: true });
}

/** The service worker re-asks when the panel opens after the fact. */
onMessage({
  PROBLEM_REQUEST: () => Promise.resolve(detectProblem()),
});

publish();
watchNavigation();
