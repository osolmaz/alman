import { expect, test, vi } from "vitest";
import type { SegmentCache } from "../src/cache/segment-cache";
import { fixedDetector } from "../src/engine/detectors";
import { createSafeTranslator } from "../src/engine/safe-translation";
import { createValidatedSegmentService, splitRejectedSegment } from "../src/engine/segment-service";
import {
  outputTokenBudget,
  validateTranslationOutput,
} from "../src/engine/validation";
import type { TranslationClient } from "../src/model/client";

function memoryCache(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const deleted: string[] = [];
  const cache: SegmentCache = {
    async get(source) { return values.get(source); },
    async put(source, target) { values.set(source, target); },
    async delete(source) {
      deleted.push(source);
      values.delete(source);
    },
  };
  return { cache, values, deleted };
}

function fakeClient(translate: TranslationClient["translate"]): TranslationClient {
  return {
    async init() { return { coldStartMs: 0 }; },
    async countTokens(text) { return Math.max(1, text.split(/\s+/u).length); },
    translate,
    async dispose() {},
  };
}

test("output budgets are source-relative and bounded", () => {
  expect(outputTokenBudget(1)).toBe(66);
  expect(outputTokenBudget(100)).toBe(264);
  expect(outputTokenBudget(1_000)).toBe(1_024);
});

test("output validation rejects malformed, implausible, and repetitive results", () => {
  expect(validateTranslationOutput("Hallo", "").ok).toBe(false);
  expect(validateTranslationOutput("Hallo", "\ud800")).toEqual({ ok: false, reason: "malformed-unicode" });
  expect(validateTranslationOutput("Ein normaler Satz.", "Wort ".repeat(100))).toEqual({
    ok: false,
    reason: "excessive-length",
  });
  const variedSource = Array.from({ length: 80 }, (_, index) => `Wort${index}`).join(" ");
  const repeated = `${"Alpha Beta Gamma Delta ".repeat(20)}Schluss.`;
  expect(validateTranslationOutput(variedSource, repeated)).toEqual({ ok: false, reason: "repetition" });
  expect(validateTranslationOutput(repeated, repeated)).toEqual({ ok: true });
  expect(validateTranslationOutput("Der Mann kommt.", "Die Mann kommt.")).toEqual({ ok: true });
});

test("retry splitting preserves delimiters and bounds the number of pieces", () => {
  const source = "A / B / C / D / E / F";
  const parts = splitRejectedSegment(source, 4)!;
  expect(parts).toHaveLength(4);
  expect(parts.map((part) => `${part.source}${part.separator}`).join("")).toBe(source);
});

test("validated service caps generation, caches exact inputs, and reuses valid entries", async () => {
  const { cache, values } = memoryCache();
  const translate = vi.fn<TranslationClient["translate"]>(async ([text], options) => [`Alman: ${text}:${options?.maxNewTokens}`]);
  const service = createValidatedSegmentService({ client: fakeClient(translate), cache });

  expect(await service.translate(["Hallo Welt"])).toEqual(["Alman: Hallo Welt:68"]);
  expect(await service.translate(["Hallo Welt"])).toEqual(["Alman: Hallo Welt:68"]);
  expect(translate).toHaveBeenCalledTimes(1);
  expect(values.get("Hallo Welt")).toBe("Alman: Hallo Welt:68");
  expect(service.diagnostics().counts["cache-hit"]).toBe(1);
});

test("repetition output is never cached and retries at slash boundaries", async () => {
  const source = [
    "Gina, Schauspielerin",
    "Daliah, Sängerin",
    "Raquel, Schauspielerin",
    "Hildegard, Chansonsängerin",
  ].join(" / ");
  const loop = "Hughah Lavi Schauspieler Wiederholung ".repeat(40);
  const { cache, values } = memoryCache();
  const translate = vi.fn<TranslationClient["translate"]>(async ([text]) => [
    text === source
      ? loop
      : text!.replaceAll("Schauspielerin", "Schauspieler")
        .replaceAll("Sängerin", "Sänger")
        .replaceAll("Chansonsängerin", "Chansonsänger"),
  ]);
  const service = createValidatedSegmentService({ client: fakeClient(translate), cache, maxRetryCalls: 4 });

  const [target] = await service.translate([source]);
  expect(target).toBe(
    "Gina, Schauspieler / Daliah, Sänger / Raquel, Schauspieler / Hildegard, Chansonsänger",
  );
  expect(translate).toHaveBeenCalledTimes(5);
  expect(values.has(source)).toBe(false);
  expect([...values.keys()]).toHaveLength(4);
  expect(service.diagnostics().counts["retry-translated"]).toBe(1);

  await service.translate([source]);
  expect(translate).toHaveBeenCalledTimes(5);
});

test("a safe-translation timeout cannot write the result that resolves later", async () => {
  let resolve!: (value: string[]) => void;
  const pending = new Promise<string[]>((done) => { resolve = done; });
  const { cache, values } = memoryCache();
  const service = createValidatedSegmentService({ client: fakeClient(async () => pending), cache });
  const safe = createSafeTranslator({
    translator: service,
    detector: fixedDetector({ language: "de", confidence: 1 }),
    tokenCounter: (text) => service.countTokens(text),
    timeoutMs: 5,
  });
  const source = "Der Mann kommt.";

  expect(await safe.translateSegment(source)).toBe(source);
  resolve(["Die Mann kommt."]);
  await new Promise((done) => setTimeout(done, 0));
  expect(values.size).toBe(0);
  expect(service.diagnostics().counts.aborted).toBe(1);
});

test("a request aborted while inference is pending cannot write a late cache result", async () => {
  let resolve!: (value: string[]) => void;
  const pending = new Promise<string[]>((done) => { resolve = done; });
  const { cache, values } = memoryCache();
  const service = createValidatedSegmentService({
    client: fakeClient(async () => pending),
    cache,
  });
  const controller = new AbortController();
  const translation = service.translate(["Der Mann kommt."], { signal: controller.signal });
  await Promise.resolve();
  controller.abort(new DOMException("translation timed out", "AbortError"));
  resolve(["Die Mann kommt."]);

  await expect(translation).rejects.toMatchObject({ name: "AbortError" });
  expect(values.size).toBe(0);
  expect(service.diagnostics().counts.aborted).toBe(1);
});

test("transient runtime failures are not memoized as unsafe output", async () => {
  const translate = vi.fn<TranslationClient["translate"]>()
    .mockRejectedValueOnce(new Error("temporary failure"))
    .mockResolvedValueOnce(["Die Mann kommt."]);
  const service = createValidatedSegmentService({ client: fakeClient(translate) });

  expect(await service.translate(["Der Mann kommt."])).toEqual(["Der Mann kommt."]);
  expect(await service.translate(["Der Mann kommt."])).toEqual(["Die Mann kommt."]);
  expect(translate).toHaveBeenCalledTimes(2);
});

test("invalid cached output is deleted before fresh inference", async () => {
  const source = "Der Mann kommt.";
  const { cache, values, deleted } = memoryCache({ [source]: "Wort ".repeat(100) });
  const translate = vi.fn<TranslationClient["translate"]>(async () => ["Die Mann kommt."]);
  const service = createValidatedSegmentService({ client: fakeClient(translate), cache });

  expect(await service.translate([source])).toEqual(["Die Mann kommt."]);
  expect(deleted).toEqual([source]);
  expect(values.get(source)).toBe("Die Mann kommt.");
});
