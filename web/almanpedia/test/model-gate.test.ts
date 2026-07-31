// @vitest-environment happy-dom
import { expect, test } from "vitest";
import { markModelSettled, markModelStarted, modelKilledThisBrowser } from "../src/ui/model-gate";

function store(): { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void } {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
  };
}

const DAY = 24 * 60 * 60 * 1000;

test("a fresh browser has nothing against it", () => {
  expect(modelKilledThisBrowser(store())).toBe(false);
});

test("a marker that survived the load means the browser was killed, not that it left", () => {
  const seen = store();
  markModelStarted(seen, 1_000);

  // pagehide, a finished translation, or a clean failure all clear it; a browser
  // terminating the tab for memory clears nothing.
  expect(modelKilledThisBrowser(seen, 1_000 + 30_000)).toBe(true);
  markModelSettled(seen);
  expect(modelKilledThisBrowser(seen, 1_000 + 30_000)).toBe(false);
});

test("the record expires, so no browser is written off forever", () => {
  const seen = store();
  markModelStarted(seen, 1_000);

  expect(modelKilledThisBrowser(seen, 1_000 + 6 * DAY)).toBe(true);
  expect(modelKilledThisBrowser(seen, 1_000 + 8 * DAY)).toBe(false);
});
