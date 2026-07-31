/**
 * Whether the model has already killed this browser.
 *
 * Translating needs more memory than a phone gives a tab. Measured on this build
 * with a headless Chromium in a cgroup: 722 MB peak across the browser's
 * processes, and 313 MB steady in the renderer alone — the process an iOS content
 * process corresponds to. A WKWebView inside a third-party app gets well under
 * that before jetsam, so on an iPhone 14 Pro the browser terminated and reloaded
 * the document around twenty seconds in, and did it again on the reload.
 *
 * There is nothing to ask the browser about this: no API reports a memory budget,
 * and a device that looks capable can still be killed. So the only signal used
 * here is what actually happened. `markModelStarted` writes the attempt time
 * before the model loads. A normal departure — navigating away, backgrounding the
 * app, closing the tab — fires `pagehide` and clears it, as does finishing a
 * translation or failing at one cleanly. A browser terminating a tab for memory
 * fires nothing, so a marker still present on the next load means this browser
 * was killed rather than that someone left.
 *
 * After that the page reads in Standard German and says so in one line. No device
 * guessing, no button, nothing to press: the cost of being wrong is one reload,
 * once, and the record expires so no browser is written off forever.
 */
const ATTEMPT_KEY = "almanpedia:model-attempt:v1";

/** Long enough that a killed browser stops thrashing, short enough to retry. */
const FORGET_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

export interface AttemptStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function markModelStarted(store: AttemptStore, now: number = Date.now()): void {
  store.setItem(ATTEMPT_KEY, String(now));
}

export function markModelSettled(store: AttemptStore): void {
  store.setItem(ATTEMPT_KEY, "");
}

export function modelKilledThisBrowser(store: AttemptStore, now: number = Date.now()): boolean {
  const startedAt = Number(store.getItem(ATTEMPT_KEY));
  return Number.isFinite(startedAt) && startedAt > 0 && now - startedAt < FORGET_AFTER_MS;
}
