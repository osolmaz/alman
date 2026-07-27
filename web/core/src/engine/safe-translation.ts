/**
 * Safe routing and DOM integration for the German-to-Alman browser model.
 *
 * TypeScript port of the frozen alman-research module
 * `autoresearch/alman_translation/browser/safe_translation.mjs`. Its behavior
 * is pinned by the ported web-input safety suite (release gate); semantic
 * changes require re-running the browser robustness gates.
 */
import type { Detection, LanguageDetector } from "./detectors";

const DEFAULT_EXCLUDED_TAGS = new Set(["CODE", "PRE", "SCRIPT", "STYLE", "TEXTAREA"]);

export interface SegmentTranslator {
  translate(
    texts: string[],
    opts?: { signal?: AbortSignal; deadlineAt?: number; maxNewTokens?: number },
  ): Promise<string[]> | string[];
  diagnostics?(): { counts: Readonly<Record<string, number | undefined>> };
  dispose?(): Promise<void> | void;
}

export interface SafeTranslatorOptions {
  translator: SegmentTranslator;
  detector: LanguageDetector;
  tokenCounter: (text: string) => number | Promise<number>;
  sourceMaxTokens?: number;
  minimumGermanConfidence?: number;
  timeoutMs?: number;
  locale?: string;
}

export interface SafeTranslator {
  translateSegment(segment: string): Promise<string>;
  translateText(text: string): Promise<string>;
  diagnostics?(): { counts: Readonly<Record<string, number | undefined>> };
  dispose(): Promise<void>;
}

function splitBoundaryWhitespace(text: string): { prefix: string; core: string; suffix: string } {
  const match = text.match(/^(\s*)([\s\S]*?)(\s*)$/u);
  return {
    prefix: match?.[1] ?? "",
    core: match?.[2] ?? text,
    suffix: match?.[3] ?? "",
  };
}

export function sentenceSegments(text: string, locale = "de"): string[] {
  if (typeof Intl?.Segmenter !== "function") return [text];
  const segmenter = new Intl.Segmenter(locale, { granularity: "sentence" });
  const raw = [...segmenter.segment(text)].map(({ segment }) => segment);
  const merged: string[] = [];
  let pending = "";
  for (let index = 0; index < raw.length; index += 1) {
    pending += raw[index];
    if (/\s$/u.test(raw[index] ?? "") || index === raw.length - 1) {
      merged.push(pending);
      pending = "";
    }
  }
  return merged;
}

function detectionIsGerman(detection: Detection | null | undefined, minimumConfidence: number): boolean {
  if (!detection || typeof detection !== "object") return false;
  const language = detection.language ?? detection.lang;
  const confidence = Number(detection.confidence ?? detection.accuracy ?? 0);
  return language === "de" && Number.isFinite(confidence) && confidence >= minimumConfidence;
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number, controller: AbortController): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error("translation timeout"));
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export function createSafeTranslator({
  translator,
  detector,
  tokenCounter,
  sourceMaxTokens = 512,
  minimumGermanConfidence = 0.75,
  timeoutMs = 3_000,
  locale = "de",
}: SafeTranslatorOptions): SafeTranslator {
  if (typeof translator?.translate !== "function") {
    throw new TypeError("translator.translate is required");
  }
  if (typeof detector !== "function") throw new TypeError("detector is required");
  if (typeof tokenCounter !== "function") throw new TypeError("tokenCounter is required");
  if (!Number.isInteger(sourceMaxTokens) || sourceMaxTokens < 1) {
    throw new RangeError("sourceMaxTokens must be a positive integer");
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new RangeError("timeoutMs must be positive");
  }

  async function translateSegment(segment: string): Promise<string> {
    const { prefix, core, suffix } = splitBoundaryWhitespace(segment);
    if (!core) return segment;

    let detection: Detection;
    try {
      detection = await detector(core);
    } catch {
      return segment;
    }
    if (!detectionIsGerman(detection, minimumGermanConfidence)) return segment;

    const normalized = core.normalize("NFC");
    let tokens: number;
    try {
      tokens = await tokenCounter(normalized);
    } catch {
      return segment;
    }
    if (!Number.isInteger(tokens) || tokens < 1 || tokens > sourceMaxTokens) {
      return segment;
    }

    const controller = new AbortController();
    try {
      const outputs = await withTimeout(
        Promise.resolve(translator.translate([normalized], {
          signal: controller.signal,
          deadlineAt: Date.now() + timeoutMs,
        })),
        timeoutMs,
        controller,
      );
      if (!Array.isArray(outputs) || outputs.length !== 1 || typeof outputs[0] !== "string") {
        return segment;
      }
      return `${prefix}${outputs[0]}${suffix}`;
    } catch {
      return segment;
    }
  }

  async function translateText(text: string): Promise<string> {
    if (typeof text !== "string") throw new TypeError("text must be a string");
    const output: string[] = [];
    for (const segment of sentenceSegments(text, locale)) {
      output.push(await translateSegment(segment));
    }
    return output.join("");
  }

  return {
    translateSegment,
    translateText,
    ...(translator.diagnostics ? { diagnostics: () => translator.diagnostics!() } : {}),
    async dispose() {
      if (typeof translator.dispose === "function") await translator.dispose();
    },
  };
}

/**
 * Structural node/element types so the frozen test doubles and real DOM nodes
 * both satisfy the traversal API, matching the original module's duck typing.
 */
export interface StyleLike {
  display?: string;
  visibility?: string;
  contentVisibility?: string;
}

export interface NodeLike {
  nodeType?: number;
  nodeValue?: string | null;
  childNodes?: ArrayLike<NodeLike>;
}

export interface ElementLike extends NodeLike {
  tagName?: string;
  hidden?: boolean;
  isContentEditable?: boolean;
  getAttribute?(name: string): string | null;
}

export type ComputedStyleGetter = (element: ElementLike) => StyleLike | undefined;

interface RootLike extends NodeLike {
  ownerDocument?: { defaultView?: { getComputedStyle?: (element: Element) => CSSStyleDeclaration } | null } | null;
}

function attributeValue(element: ElementLike | null | undefined, name: string): string | null {
  return typeof element?.getAttribute === "function" ? element.getAttribute(name) : null;
}

export type TranslationLanguage = "german" | "foreign";

export function declaredTranslationLanguage(element: ElementLike): TranslationLanguage | undefined {
  const language = attributeValue(element, "lang")?.trim().toLowerCase();
  if (!language) return undefined;
  return language === "de" || language.startsWith("de-") ? "german" : "foreign";
}

export function elementBlocksTranslation(element: ElementLike, getComputedStyle?: ComputedStyleGetter): boolean {
  const tagName = String(element?.tagName ?? "").toUpperCase();
  if (DEFAULT_EXCLUDED_TAGS.has(tagName)) return true;
  if (attributeValue(element, "translate")?.trim().toLowerCase() === "no") return true;
  if (element?.hidden || attributeValue(element, "aria-hidden") === "true") return true;
  const contentEditable = attributeValue(element, "contenteditable");
  if (element?.isContentEditable || (contentEditable !== null && contentEditable !== "false")) {
    return true;
  }
  if (typeof getComputedStyle === "function") {
    const style = getComputedStyle(element);
    if (
      style?.display === "none" ||
      style?.visibility === "hidden" ||
      style?.contentVisibility === "hidden"
    ) {
      return true;
    }
  }
  return false;
}

export async function translateVisibleTextNodes(
  root: RootLike,
  safeTranslator: SafeTranslator,
  {
    getComputedStyle = root?.ownerDocument?.defaultView?.getComputedStyle?.bind(
      root.ownerDocument.defaultView,
    ) as ComputedStyleGetter | undefined,
  }: { getComputedStyle?: ComputedStyleGetter } = {},
): Promise<number> {
  if (!root || typeof safeTranslator?.translateText !== "function") {
    throw new TypeError("root and safeTranslator are required");
  }

  let translatedNodes = 0;
  async function visit(
    node: NodeLike | null | undefined,
    blocked: boolean,
    language: TranslationLanguage,
  ): Promise<void> {
    const isElement = node?.nodeType === 1;
    const element = isElement ? node as ElementLike : undefined;
    const nextBlocked = blocked || Boolean(element && elementBlocksTranslation(element, getComputedStyle));
    const nextLanguage = (element && declaredTranslationLanguage(element)) ?? language;
    if (node?.nodeType === 3) {
      if (!nextBlocked && nextLanguage === "german" && node.nodeValue) {
        const translated = await safeTranslator.translateText(node.nodeValue);
        if (translated !== node.nodeValue) {
          node.nodeValue = translated;
          translatedNodes += 1;
        }
      }
      return;
    }
    for (const child of Array.from(node?.childNodes ?? [])) {
      await visit(child, nextBlocked, nextLanguage);
    }
  }

  await visit(root, false, "german");
  return translatedNodes;
}
