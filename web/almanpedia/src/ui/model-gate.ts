/**
 * Whether to load the translation model without being asked for it.
 *
 * The model is not merely a 34 MB download; it is a large resident cost, because
 * the ORT WASM runtime instantiates alongside the int8 weights in one heap. On an
 * iPhone 14 Pro that exceeded the memory a third-party WebKit host is allowed,
 * and the browser terminated and reloaded the document about nine seconds after
 * the runtime arrived — repeatedly, so the page never finished loading at all.
 * Measured from server logs: three full document loads in twenty-eight seconds,
 * each re-fetching every asset.
 *
 * There is no way to ask a browser for its memory budget, so the signal is device
 * class. A device that reports touch and no fine pointer — a phone or a tablet —
 * is asked before the model loads. Anything with a fine pointer, including a
 * laptop with a touchscreen, behaves as before. A reported device memory of 4 GiB
 * or less also asks first.
 *
 * The consequence of a wrong guess is asymmetric, which is why the test is coarse:
 * a desktop visitor who is asked has to press a button, while a phone visitor who
 * is not asked gets a page that reloads forever.
 */
export interface DeviceHints {
  matchMedia?: (query: string) => { matches: boolean };
  /** `navigator.deviceMemory`, in GiB, where the browser reports it. */
  deviceMemory?: number;
}

export function browserHints(): DeviceHints {
  return {
    matchMedia: typeof window.matchMedia === "function" ? (query) => window.matchMedia(query) : undefined,
    deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
  };
}

export function autoloadsModel(hints: DeviceHints = browserHints()): boolean {
  if (typeof hints.deviceMemory === "number" && hints.deviceMemory <= 4) return false;
  if (!hints.matchMedia) return true;
  const touchOnly = hints.matchMedia("(any-pointer: coarse)").matches
    && !hints.matchMedia("(any-pointer: fine)").matches;
  return !touchOnly;
}

/**
 * Whether the model has already killed this browser once.
 *
 * The device test above is a guess about memory; this is a record of what
 * actually happened. Before the model loads, `markModelStarted` writes a marker.
 * A normal departure — navigating away, backgrounding the app, closing the tab —
 * fires `pagehide`, which clears it. A browser terminating the tab for memory
 * does not fire `pagehide`, so the marker is still there on the next load, and
 * that is the difference between someone who left and someone who was killed.
 *
 * On an iPhone 14 Pro the model loaded and then took the tab down about twenty
 * seconds into inference, even when asked for explicitly, so a device that can be
 * asked can still turn out to be a device that cannot run it. After that happens
 * once the page stops offering, and says why, with a way to insist.
 */
const ATTEMPT_KEY = "almanpedia:model-attempt:v1";

export interface AttemptStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function modelKilledThisBrowser(store: AttemptStore): boolean {
  return store.getItem(ATTEMPT_KEY) === "started";
}

export function markModelStarted(store: AttemptStore): void {
  store.setItem(ATTEMPT_KEY, "started");
}

export function markModelSettled(store: AttemptStore): void {
  store.setItem(ATTEMPT_KEY, "");
}
