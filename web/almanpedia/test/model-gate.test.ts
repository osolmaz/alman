// @vitest-environment happy-dom
import { expect, test } from "vitest";
import {
  markModelSettled,
  markModelStarted,
  modelKilledThisBrowser,
  type AttemptStore,
  type ModelStores,
} from "../src/ui/model-gate";

function store(): AttemptStore {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
  };
}

/** A tab of a browser: its own session storage, the browser's shared one. */
const tab = (durable: AttemptStore): ModelStores => ({ session: store(), durable });

const DAY = 24 * 60 * 60 * 1000;

test("a fresh browser has nothing against it", () => {
  expect(modelKilledThisBrowser(tab(store()))).toBe(false);
});

test("an attempt this tab never finished is a kill", () => {
  const one = tab(store());
  markModelStarted(one, 1_000);

  expect(modelKilledThisBrowser(one, 31_000)).toBe(true);
});

test("leaving, finishing, or failing cleanly all clear the attempt", () => {
  const one = tab(store());
  markModelStarted(one, 1_000);
  markModelSettled(one);

  expect(modelKilledThisBrowser(one, 31_000)).toBe(false);
});

test("another tab translating is not this tab's death", () => {
  // The regression this fixes: the attempt used to be shared, so opening a second
  // tab while the first was still translating refused to work on a desktop.
  const durable = store();
  const first = tab(durable);
  markModelStarted(first, 1_000);

  expect(modelKilledThisBrowser(tab(durable), 31_000)).toBe(false);
});

test("a tab that came back from a kill teaches the whole browser", () => {
  const durable = store();
  const killed = tab(durable);
  markModelStarted(killed, 1_000);

  expect(modelKilledThisBrowser(killed, 31_000)).toBe(true);
  // Only now, on evidence, does a later tab inherit the verdict.
  expect(modelKilledThisBrowser(tab(durable), 40_000)).toBe(true);
});

test("the record expires, so no browser is written off forever", () => {
  const durable = store();
  const killed = tab(durable);
  markModelStarted(killed, 1_000);
  modelKilledThisBrowser(killed, 31_000);

  expect(modelKilledThisBrowser(tab(durable), 1_000 + 6 * DAY)).toBe(true);
  expect(modelKilledThisBrowser(tab(durable), 1_000 + 8 * DAY)).toBe(false);
});
