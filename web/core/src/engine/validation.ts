export const TRANSLATION_RUNTIME_POLICY_REVISION = "1";

export type OutputValidationReason =
  | "empty-output"
  | "malformed-unicode"
  | "excessive-length"
  | "implausibly-short"
  | "repetition";

export type OutputValidationResult =
  | { ok: true }
  | { ok: false; reason: OutputValidationReason };

/**
 * GoePT is a near length-preserving translator. This generous cap does not bind
 * qualified outputs, but it bounds a decoder loop far below the package's
 * historical 1,024-token emergency limit.
 */
export function outputTokenBudget(sourceTokens: number): number {
  if (!Number.isInteger(sourceTokens) || sourceTokens < 1) {
    throw new RangeError("sourceTokens must be a positive integer");
  }
  return Math.min(1_024, Math.max(48, Math.ceil(sourceTokens * 2) + 64));
}

function hasLoneSurrogate(text: string): boolean {
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = text.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }
  return false;
}

function words(text: string): string[] {
  return Array.from(text.toLocaleLowerCase("de").matchAll(/[\p{L}\p{N}]+/gu), (match) => match[0]!);
}

function repeatedNgramScore(text: string): number {
  const tokens = words(text);
  if (tokens.length < 32) return 0;

  let score = 0;
  for (const size of [5, 4, 3]) {
    const counts = new Map<string, number>();
    let maximum = 0;
    for (let index = 0; index + size <= tokens.length; index += 1) {
      const ngram = tokens.slice(index, index + size).join("\u0000");
      const count = (counts.get(ngram) ?? 0) + 1;
      counts.set(ngram, count);
      maximum = Math.max(maximum, count);
    }
    if (maximum >= 4) score = Math.max(score, (maximum * size) / tokens.length);
  }
  return score;
}

export function validateTranslationOutput(source: string, output: string): OutputValidationResult {
  if (!output.trim()) return { ok: false, reason: "empty-output" };
  if (hasLoneSurrogate(output)) return { ok: false, reason: "malformed-unicode" };

  const maximumLength = Math.ceil(source.length * 1.5) + 96;
  if (output.length > maximumLength) return { ok: false, reason: "excessive-length" };
  if (source.length >= 80 && output.trim().length < source.trim().length * 0.25) {
    return { ok: false, reason: "implausibly-short" };
  }
  const outputRepetition = repeatedNgramScore(output);
  const sourceRepetition = repeatedNgramScore(source);
  if (outputRepetition >= 0.2 && outputRepetition >= sourceRepetition + 0.1) {
    return { ok: false, reason: "repetition" };
  }
  return { ok: true };
}
