import { IDBFactory } from "fake-indexeddb";
import { afterEach, expect, test, vi } from "vitest";
import { createSegmentCache } from "../src/cache/segment-cache";

afterEach(() => vi.unstubAllGlobals());

test("segment cache isolates runtime policies and can delete rejected entries", async () => {
  vi.stubGlobal("indexedDB", new IDBFactory());
  const common = { modelRevision: "model-a", dbName: "segment-policy-test" };
  const first = createSegmentCache({ ...common, policyRevision: "policy-1" });
  const second = createSegmentCache({ ...common, policyRevision: "policy-2" });

  await first.put("Der Mann.", "Die Mann.");
  expect(await first.get("Der Mann.")).toBe("Die Mann.");
  expect(await second.get("Der Mann.")).toBeUndefined();

  await first.delete("Der Mann.");
  expect(await first.get("Der Mann.")).toBeUndefined();
});
