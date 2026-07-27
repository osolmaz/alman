import type { SegmentCache } from "../cache/segment-cache";
import type { TranslationClient } from "../model/client";
import type { SegmentTranslator } from "./safe-translation";
import {
  outputTokenBudget,
  validateTranslationOutput,
  type OutputValidationReason,
} from "./validation";

export type SegmentOutcomeReason =
  | "cache-hit"
  | "translated"
  | "retry-translated"
  | "source-fallback"
  | "runtime-error"
  | "aborted"
  | "invalid-shape"
  | OutputValidationReason;

export interface SegmentServiceDiagnostics {
  counts: Partial<Record<SegmentOutcomeReason, number>>;
}

export interface ValidatedSegmentService extends SegmentTranslator {
  countTokens(text: string): Promise<number>;
  diagnostics(): SegmentServiceDiagnostics;
}

export interface ValidatedSegmentServiceOptions {
  client: TranslationClient;
  cache?: SegmentCache;
  maxRetryCalls?: number;
}

interface RetryPart {
  source: string;
  separator: string;
}

interface ModelResult {
  ok: boolean;
  target?: string;
  reason?: SegmentOutcomeReason;
}

interface Boundary {
  start: number;
  end: number;
}

function boundaries(text: string, pattern: RegExp): Boundary[] {
  return Array.from(text.matchAll(pattern), (match) => ({
    start: match.index,
    end: match.index + match[0].length,
  })).filter(({ start, end }) => start > 0 && end < text.length);
}

function chooseBoundaries(candidates: Boundary[], partCount: number): Boundary[] {
  const selected: Boundary[] = [];
  let previousIndex = -1;
  for (let part = 1; part < partCount; part += 1) {
    const targetIndex = Math.round((part * (candidates.length + 1)) / partCount) - 1;
    const index = Math.max(previousIndex + 1, Math.min(candidates.length - 1, targetIndex));
    const candidate = candidates[index];
    if (!candidate) break;
    selected.push(candidate);
    previousIndex = index;
  }
  return selected;
}

/** Split only after rejected output, preserving every delimiter byte outside model calls. */
export function splitRejectedSegment(source: string, maxParts = 4): RetryPart[] | null {
  if (!Number.isInteger(maxParts) || maxParts < 2) return null;
  const families = [
    /\s+\/\s+/gu,
    /[;:]\s+/gu,
    /,\s+/gu,
    /\s+/gu,
  ];
  let candidates: Boundary[] = [];
  for (const pattern of families) {
    candidates = boundaries(source, pattern);
    if (candidates.length > 0) break;
  }
  if (candidates.length === 0) return null;

  const selected = chooseBoundaries(candidates, Math.min(maxParts, candidates.length + 1));
  if (selected.length === 0) return null;
  const parts: RetryPart[] = [];
  let offset = 0;
  for (const boundary of selected) {
    const text = source.slice(offset, boundary.start);
    if (!text) return null;
    parts.push({ source: text, separator: source.slice(boundary.start, boundary.end) });
    offset = boundary.end;
  }
  const tail = source.slice(offset);
  if (!tail) return null;
  parts.push({ source: tail, separator: "" });
  return parts;
}

function abortError(signal: AbortSignal): Error {
  if (signal.reason instanceof Error) return signal.reason;
  return new DOMException("translation aborted", "AbortError");
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw abortError(signal);
}

export function createValidatedSegmentService({
  client,
  cache,
  maxRetryCalls = 32,
}: ValidatedSegmentServiceOptions): ValidatedSegmentService {
  if (!client || typeof client.translate !== "function" || typeof client.countTokens !== "function") {
    throw new TypeError("translation client is required");
  }
  if (!Number.isInteger(maxRetryCalls) || maxRetryCalls < 2) {
    throw new RangeError("maxRetryCalls must be at least 2");
  }

  const counts: Partial<Record<SegmentOutcomeReason, number>> = {};
  const tokenCounts = new Map<string, number>();
  const retryPlans = new Map<string, RetryPart[] | null>();

  function record(reason: SegmentOutcomeReason): void {
    counts[reason] = (counts[reason] ?? 0) + 1;
  }

  async function countTokens(text: string): Promise<number> {
    const normalized = text.normalize("NFC");
    const known = tokenCounts.get(normalized);
    if (known !== undefined) return known;
    const count = await client.countTokens(normalized);
    if (Number.isInteger(count) && count > 0) tokenCounts.set(normalized, count);
    return count;
  }

  async function removeCached(source: string): Promise<void> {
    try {
      await cache?.delete(source);
    } catch {
      // Cache failures never fail translation.
    }
  }

  async function putCached(source: string, target: string, signal?: AbortSignal): Promise<void> {
    if (!cache) return;
    throwIfAborted(signal);
    try {
      await cache.put(source, target);
      if (signal?.aborted) {
        await removeCached(source);
        throw abortError(signal);
      }
    } catch (error) {
      if (signal?.aborted) throw abortError(signal);
      // Cache failures never fail translation.
      void error;
    }
  }

  async function translateExact(source: string, signal?: AbortSignal): Promise<ModelResult> {
    throwIfAborted(signal);
    if (cache) {
      try {
        const cached = await cache.get(source);
        throwIfAborted(signal);
        if (cached !== undefined) {
          const validation = validateTranslationOutput(source, cached);
          if (validation.ok) {
            record("cache-hit");
            return { ok: true, target: cached };
          }
          record(validation.reason);
          await removeCached(source);
        }
      } catch (error) {
        if (signal?.aborted) throw abortError(signal);
        void error;
      }
    }

    try {
      const sourceTokens = await countTokens(source);
      if (!Number.isInteger(sourceTokens) || sourceTokens < 1) {
        record("runtime-error");
        return { ok: false, reason: "runtime-error" };
      }
      throwIfAborted(signal);
      const output = await client.translate([source], {
        signal,
        maxNewTokens: outputTokenBudget(sourceTokens),
      });
      throwIfAborted(signal);
      if (!Array.isArray(output) || output.length !== 1 || typeof output[0] !== "string") {
        record("invalid-shape");
        return { ok: false, reason: "invalid-shape" };
      }
      const validation = validateTranslationOutput(source, output[0]);
      if (!validation.ok) {
        record(validation.reason);
        return { ok: false, reason: validation.reason };
      }
      await putCached(source, output[0], signal);
      record("translated");
      return { ok: true, target: output[0] };
    } catch (error) {
      if (signal?.aborted) {
        record("aborted");
        throw abortError(signal);
      }
      record("runtime-error");
      return { ok: false, reason: "runtime-error" };
    }
  }

  async function translateWithRetry(source: string, signal?: AbortSignal): Promise<string> {
    throwIfAborted(signal);
    if (!retryPlans.has(source)) {
      const primary = await translateExact(source, signal);
      if (primary.ok) return primary.target!;
      if (primary.reason === "runtime-error" || primary.reason === "invalid-shape") {
        record("source-fallback");
        return source;
      }
      retryPlans.set(source, splitRejectedSegment(source, maxRetryCalls));
    }

    const plan = retryPlans.get(source);
    if (!plan) {
      record("source-fallback");
      return source;
    }

    let changed = false;
    const output: string[] = [];
    for (const part of plan) {
      throwIfAborted(signal);
      const translated = await translateExact(part.source, signal);
      const target = translated.ok ? translated.target! : part.source;
      changed ||= target !== part.source;
      output.push(target, part.separator);
    }
    if (changed) record("retry-translated");
    else record("source-fallback");
    return output.join("");
  }

  return {
    countTokens,
    async translate(texts, options = {}) {
      const output: string[] = [];
      for (const text of texts) output.push(await translateWithRetry(text, options.signal));
      return output;
    },
    diagnostics: () => ({ counts: { ...counts } }),
    dispose: () => client.dispose(),
  };
}
