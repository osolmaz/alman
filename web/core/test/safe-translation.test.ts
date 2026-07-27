/**
 * Frozen routing, Unicode, DOM, timeout, and injection safety suite.
 *
 * Mechanical vitest port of the frozen alman-research harness
 * `autoresearch/alman_translation/browser/web_input_harness.test.mjs`
 * (sha256 fbc36733119ff4d1b0f9487a2f7c2bc0ec76d8168f530261e88a1e16e8731ee1).
 * Assertions and thresholds are release gates and must not change.
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { expect, test } from "vitest";
import {
  createSafeTranslator,
  elementBlocksTranslation,
  sentenceSegments,
  translateVisibleTextNodes,
  type SafeTranslatorOptions,
} from "../src/engine/safe-translation";

const FROZEN_CASES_SHA256 = "a9d488836eedf045f4d30b8a976ebcf40c2d157e72cfc5bdd9d6b8c8881536fd";

interface CaseRow {
  id: string;
  text: string;
  route: "passthrough" | "translate";
  detected?: string;
  tokens?: number;
  protected?: string[];
}

const casesBytes = readFileSync(new URL("./fixtures/web_input_cases.jsonl", import.meta.url));
const rows: CaseRow[] = casesBytes.toString("utf8").trim().split("\n").map((line) => JSON.parse(line));

test("fixture file is byte-identical to the frozen suite", () => {
  expect(createHash("sha256").update(casesBytes).digest("hex")).toBe(FROZEN_CASES_SHA256);
});

type Overrides = Partial<Pick<SafeTranslatorOptions, "translator" | "detector" | "tokenCounter" | "timeoutMs">>;

function fixtureSafeTranslator(overrides: Overrides = {}) {
  const byText = new Map(rows.map((row) => [row.text, row]));
  const byNormalizedText = new Map(rows.map((row) => [row.text.normalize("NFC"), row]));
  const calls: string[] = [];
  const translator = overrides.translator ?? {
    async translate([text]: string[]) {
      calls.push(text as string);
      return [`⟦${text}⟧`];
    },
    async dispose() {},
  };
  const safeTranslator = createSafeTranslator({
    translator,
    detector:
      overrides.detector ??
      (async (text: string) => ({
        language: byText.get(text)?.detected ?? "und",
        confidence: byText.get(text)?.detected === "de" ? 0.99 : 0.1,
      })),
    tokenCounter:
      overrides.tokenCounter ??
      (async (text: string) => byNormalizedText.get(text)?.tokens ?? Math.max(1, text.length)),
    sourceMaxTokens: 512,
    minimumGermanConfidence: 0.75,
    timeoutMs: overrides.timeoutMs ?? 100,
  });
  return { safeTranslator, calls };
}

function utf8(text: string): Buffer {
  return Buffer.from(text, "utf8");
}

test("frozen passthrough cases remain byte-identical", async () => {
  const { safeTranslator } = fixtureSafeTranslator();
  for (const row of rows.filter(({ route }) => route === "passthrough")) {
    const output = await safeTranslator.translateText(row.text);
    expect(utf8(output), row.id).toEqual(utf8(row.text));
  }
});

test("only accepted German segments reach the model and use NFC", async () => {
  const { safeTranslator, calls } = fixtureSafeTranslator();
  const translated = rows.filter(({ route }) => route === "translate");
  for (const row of translated) {
    const output = await safeTranslator.translateText(row.text);
    expect(output, row.id).not.toBe(row.text);
  }
  expect(calls.length).toBe(translated.length);
  expect(calls.every((text) => text === text.normalize("NFC"))).toBe(true);
});

test("registered URL and numeric spans survive accepted translation", async () => {
  const { safeTranslator } = fixtureSafeTranslator();
  for (const row of rows.filter(({ protected: spans }) => spans)) {
    const output = await safeTranslator.translateText(row.text);
    for (const span of row.protected ?? []) {
      expect(output.includes(span), `${row.id}: ${span}`).toBe(true);
    }
  }
});

test("over-limit German input never reaches the model", async () => {
  const row = rows.find(({ id }) => id === "over-limit-german") as CaseRow;
  const { safeTranslator, calls } = fixtureSafeTranslator();
  expect(await safeTranslator.translateText(row.text)).toBe(row.text);
  expect(calls.length).toBe(0);
});

test("model calls are sequential to bound active inference memory", async () => {
  const german = rows.filter(({ route }) => route === "translate").slice(0, 2) as CaseRow[];
  let active = 0;
  let maximumActive = 0;
  const { safeTranslator } = fixtureSafeTranslator({
    translator: {
      async translate([source]: string[]) {
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        return [source as string];
      },
    },
  });
  await safeTranslator.translateText(`${german[0]?.text} ${german[1]?.text}`);
  expect(maximumActive).toBe(1);
});

test("sentence routing preserves boundaries and surrounding whitespace", async () => {
  const german = (rows.find(({ id }) => id === "german-basic") as CaseRow).text;
  const english = (rows.find(({ id }) => id === "english") as CaseRow).text;
  const { safeTranslator } = fixtureSafeTranslator();
  const input = `  ${german}\n\t${english}  `;
  const output = await safeTranslator.translateText(input);
  expect(output.startsWith("  ⟦")).toBe(true);
  expect(output.endsWith(`${english}  `)).toBe(true);
  expect(sentenceSegments(input).join("")).toBe(input);
});

test("detector and tokenizer failures fall back to exact passthrough", async () => {
  const source = (rows.find(({ id }) => id === "german-basic") as CaseRow).text;
  const failureModes: Overrides[] = [
    {
      detector: async () => {
        throw new Error("detector failed");
      },
    },
    {
      detector: async () => ({ language: "de", confidence: 0.99 }),
      tokenCounter: async () => {
        throw new Error("tokenizer failed");
      },
    },
  ];
  for (const overrides of failureModes) {
    const { safeTranslator } = fixtureSafeTranslator(overrides);
    expect(utf8(await safeTranslator.translateText(source))).toEqual(utf8(source));
  }
});

test("low confidence and malformed model output fall back to passthrough", async () => {
  const source = (rows.find(({ id }) => id === "german-basic") as CaseRow).text;
  const lowConfidence = fixtureSafeTranslator({
    detector: async () => ({ language: "de", confidence: 0.74 }),
  }).safeTranslator;
  expect(await lowConfidence.translateText(source)).toBe(source);

  const malformed = fixtureSafeTranslator({
    translator: {
      async translate() {
        return [];
      },
    },
    detector: async () => ({ language: "de", confidence: 0.99 }),
  }).safeTranslator;
  expect(await malformed.translateText(source)).toBe(source);
});

test("translation timeout is bounded and returns the original text", async () => {
  const source = (rows.find(({ id }) => id === "german-basic") as CaseRow).text;
  const { safeTranslator } = fixtureSafeTranslator({
    translator: {
      async translate() {
        return new Promise<string[]>(() => {});
      },
    },
    detector: async () => ({ language: "de", confidence: 0.99 }),
    timeoutMs: 20,
  });
  const started = performance.now();
  expect(await safeTranslator.translateText(source)).toBe(source);
  expect(performance.now() - started < 500).toBe(true);
});

test("translation calls carry the absolute timeout deadline", async () => {
  const source = (rows.find(({ id }) => id === "german-basic") as CaseRow).text;
  let deadlineAt: number | undefined;
  const timeoutMs = 200;
  const { safeTranslator } = fixtureSafeTranslator({
    translator: {
      async translate([text], options) {
        deadlineAt = options?.deadlineAt;
        return [text as string];
      },
    },
    detector: async () => ({ language: "de", confidence: 0.99 }),
    timeoutMs,
  });
  const started = Date.now();
  await safeTranslator.translateSegment(source);

  expect(deadlineAt).toBeGreaterThanOrEqual(started + timeoutMs);
  expect(deadlineAt).toBeLessThanOrEqual(Date.now() + timeoutMs);
});

interface FakeNodeInit {
  nodeType: number;
  tagName?: string;
  nodeValue?: string | null;
  attrs?: Record<string, string>;
  style?: Record<string, string>;
  hidden?: boolean;
}

class FakeNode {
  nodeType: number;
  tagName?: string;
  nodeValue: string | null;
  attrs: Record<string, string>;
  style: Record<string, string>;
  hidden: boolean;
  childNodes: FakeNode[];
  isContentEditable: boolean;

  constructor({ nodeType, tagName, nodeValue = null, attrs = {}, style = {}, hidden = false }: FakeNodeInit) {
    this.nodeType = nodeType;
    this.tagName = tagName;
    this.nodeValue = nodeValue;
    this.attrs = { ...attrs };
    this.style = style;
    this.hidden = hidden;
    this.childNodes = [];
    this.isContentEditable = false;
  }

  append(...children: FakeNode[]): FakeNode {
    this.childNodes.push(...children);
    return this;
  }

  getAttribute(name: string): string | null {
    return Object.hasOwn(this.attrs, name) ? (this.attrs[name] as string) : null;
  }
}

const element = (tagName: string, options: Omit<FakeNodeInit, "nodeType" | "tagName"> = {}) =>
  new FakeNode({ nodeType: 1, tagName, ...options });
const text = (nodeValue: string) => new FakeNode({ nodeType: 3, nodeValue });

test("DOM traversal changes visible text nodes and skips protected subtrees", async () => {
  const german = (rows.find(({ id }) => id === "german-basic") as CaseRow).text;
  const visible = text(german);
  const code = text(german);
  const pre = text(german);
  const script = text(german);
  const style = text(german);
  const textarea = text(german);
  const editable = text(german);
  const hidden = text(german);
  const ariaHidden = text(german);
  const displayNone = text(german);
  const attribute = german;
  const root = element("MAIN", { attrs: { title: attribute } }).append(
    visible,
    element("CODE").append(code),
    element("PRE").append(pre),
    element("SCRIPT").append(script),
    element("STYLE").append(style),
    element("TEXTAREA").append(textarea),
    element("DIV", { attrs: { contenteditable: "" } }).append(editable),
    element("DIV", { hidden: true }).append(hidden),
    element("DIV", { attrs: { "aria-hidden": "true" } }).append(ariaHidden),
    element("DIV", { style: { display: "none" } }).append(displayNone),
  );
  const { safeTranslator } = fixtureSafeTranslator();
  const count = await translateVisibleTextNodes(root, safeTranslator, {
    getComputedStyle: (node) => (node as unknown as FakeNode).style,
  });
  expect(count).toBe(1);
  expect(visible.nodeValue).not.toBe(german);
  for (const node of [code, pre, script, style, textarea, editable, hidden, ariaHidden, displayNone]) {
    expect(node.nodeValue).toBe(german);
  }
  expect(root.attrs["title"]).toBe(attribute);
});

test("model markup is assigned as inert text without creating DOM children", async () => {
  const german = (rows.find(({ id }) => id === "german-basic") as CaseRow).text;
  const payload = '<img src=x onerror="globalThis.pwned=true"><script>pwned()</script>';
  const target = text(german);
  const root = element("DIV").append(target);
  const { safeTranslator } = fixtureSafeTranslator({
    translator: {
      async translate() {
        return [payload];
      },
    },
  });
  await translateVisibleTextNodes(root, safeTranslator);
  expect(target.nodeValue).toBe(payload);
  expect(target.childNodes.length).toBe(0);
  expect(root.childNodes.length).toBe(1);
});

test("visibility and editability guards cover configured browser states", () => {
  expect(elementBlocksTranslation(element("CODE"))).toBe(true);
  expect(elementBlocksTranslation(element("DIV", { attrs: { contenteditable: "plaintext-only" } }))).toBe(true);
  expect(elementBlocksTranslation(element("DIV", { attrs: { contenteditable: "false" } }))).toBe(false);
  expect(
    elementBlocksTranslation(element("DIV", { style: { visibility: "hidden" } }), (node) => (node as unknown as FakeNode).style),
  ).toBe(true);
  expect(
    elementBlocksTranslation(element("DIV", { style: { contentVisibility: "hidden" } }), (node) => (node as unknown as FakeNode).style),
  ).toBe(true);
});
