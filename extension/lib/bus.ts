/**
 * A4 — the typed message bus. Nothing in this repo calls
 * chrome.runtime.sendMessage directly; it goes through here so the `Msg`
 * union is the only vocabulary that exists between contexts.
 */

import type { Msg, MsgOf, MsgType } from '../../shared/contracts';

/** Fire-and-forget to the service worker (or to any listening context). */
export function send(msg: Msg): void {
  chrome.runtime.sendMessage(msg).catch(() => {
    /* No receiver yet — e.g. panel closed. Never a failure case. */
  });
}

/** Request/response to the service worker. */
export async function request<T>(msg: Msg): Promise<T | null> {
  try {
    return (await chrome.runtime.sendMessage(msg)) as T;
  } catch {
    return null;
  }
}

/** Service worker -> a specific tab's content script. */
export function sendToTab(tabId: number, msg: Msg): void {
  chrome.tabs.sendMessage(tabId, msg).catch(() => {});
}

type Handler<T extends MsgType> = (
  msg: MsgOf<T>,
  sender: chrome.runtime.MessageSender,
) => void | Promise<unknown>;

type HandlerMap = { [T in MsgType]?: Handler<T> };

/**
 * Register handlers for the message types this context cares about.
 * Returns an unsubscribe function.
 *
 * A handler that returns a promise gets its resolved value delivered back to
 * the caller of `request()`.
 */
export function onMessage(handlers: HandlerMap): () => void {
  const listener = (
    raw: unknown,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ): boolean => {
    const msg = raw as Msg;
    if (!msg || typeof msg.type !== 'string') return false;

    const handler = handlers[msg.type] as Handler<MsgType> | undefined;
    if (!handler) return false;

    const result = handler(msg as never, sender);
    if (result instanceof Promise) {
      result.then(sendResponse).catch(() => sendResponse(null));
      return true; // keep the channel open
    }
    return false;
  };

  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}
