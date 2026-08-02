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
 * No API reports a memory budget, so the only signal is what happened: an attempt
 * is recorded before the model loads and cleared when a translation finishes, when
 * one fails cleanly, and on `pagehide`. A browser terminating a tab for memory
 * fires none of those, so an attempt still present on the next load is a kill.
 *
 * The attempt lives in **session** storage, which is per tab and survives the
 * reload a kill causes. It used to live in local storage, which is shared, so a
 * second tab opened while the first was still translating read that tab's attempt
 * as its own death and refused to work — on a desktop, where the model runs fine.
 * A record that outlives the tab has to be earned: the durable one below is only
 * written once a tab has actually come back from a kill.
 */
const ATTEMPT_KEY = "almanpedia:model-attempt:v2";
const KILLED_KEY = "almanpedia:model-killed:v1";

/** Long enough that a killed browser stops thrashing, short enough to retry. */
const FORGET_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

export interface AttemptStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface ModelStores {
  /** Per tab, survives a reload: where an attempt in flight is recorded. */
  session: AttemptStore;
  /** Per browser: where a kill is remembered once one has been observed. */
  durable: AttemptStore;
}

export function markModelStarted(stores: ModelStores, now: number = Date.now()): void {
  stores.session.setItem(ATTEMPT_KEY, String(now));
}

export function markModelSettled(stores: ModelStores): void {
  stores.session.setItem(ATTEMPT_KEY, "");
}

function within(value: string | null, now: number): boolean {
  const at = Number(value);
  return Number.isFinite(at) && at > 0 && now - at < FORGET_AFTER_MS;
}

/**
 * Read once per document, before anything can clear it. An attempt this tab never
 * finished means this tab was killed, which is also the only thing that writes the
 * durable record.
 */
export function modelKilledThisBrowser(stores: ModelStores, now: number = Date.now()): boolean {
  const killedThisTab = within(stores.session.getItem(ATTEMPT_KEY), now);
  if (killedThisTab) stores.durable.setItem(KILLED_KEY, String(now));
  return killedThisTab || within(stores.durable.getItem(KILLED_KEY), now);
}
