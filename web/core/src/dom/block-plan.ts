import { diffWordsWithSpace } from "diff";
import { elementBlocksTranslation, type ComputedStyleGetter, type SafeTranslator } from "../engine/safe-translation";

const INLINE_PLACEHOLDER_TAGS = new Set([
  "A",
  "ABBR",
  "B",
  "BDI",
  "BDO",
  "CITE",
  "CODE",
  "DATA",
  "DEL",
  "DFN",
  "EM",
  "I",
  "INS",
  "KBD",
  "LABEL",
  "MARK",
  "NOBR",
  "Q",
  "RP",
  "RT",
  "RUBY",
  "S",
  "SAMP",
  "SMALL",
  "SPAN",
  "STRIKE",
  "STRONG",
  "SUB",
  "SUP",
  "TIME",
  "U",
  "VAR",
]);

const STRUCTURAL_INLINE_TAGS = new Set(["BR", "WBR"]);
const PLACEHOLDER_RE = /<x(\d+)>([\s\S]*?)<\/x\1>/gu;

export interface BlockPlaceholder {
  id: number;
  node: Node;
  element?: Element;
  text: string;
  opaque: boolean;
}

export interface BlockTranslationPlan {
  element: Element;
  source: string;
  placeholders: BlockPlaceholder[];
}

export interface PlaceholderTextUpdate {
  node: Text;
  original: string;
  translated: string;
}

export interface BlockTranslationResult {
  translated: boolean;
  translatedText: string;
  translatedChildren: Node[];
  differenceChildren: Node[];
  placeholderTextUpdates: PlaceholderTextUpdate[];
  /** Existing inline elements whose text changed and can receive a UI effect. */
  changedElements: Element[];
}

function cloneChildren(element: Element): Node[] {
  return Array.from(element.childNodes, (child) => child.cloneNode(true));
}

function containsProtectedDescendant(element: Element, getComputedStyle?: ComputedStyleGetter): boolean {
  for (const child of Array.from(element.children)) {
    if (elementBlocksTranslation(child, getComputedStyle) || containsProtectedDescendant(child, getComputedStyle)) {
      return true;
    }
  }
  return false;
}

function placeholderIsOpaque(element: Element, getComputedStyle?: ComputedStyleGetter): boolean {
  return (
    STRUCTURAL_INLINE_TAGS.has(element.tagName) ||
    elementBlocksTranslation(element, getComputedStyle) ||
    containsProtectedDescendant(element, getComputedStyle) ||
    !INLINE_PLACEHOLDER_TAGS.has(element.tagName)
  );
}

function shouldPlaceholder(element: Element, getComputedStyle?: ComputedStyleGetter): boolean {
  if (placeholderIsOpaque(element, getComputedStyle)) return true;
  return INLINE_PLACEHOLDER_TAGS.has(element.tagName);
}

function escapePlaceholderText(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function placeholderOpen(id: number): string {
  return `<x${id}>`;
}

function placeholderClose(id: number): string {
  return `</x${id}>`;
}

function placeholderToken(id: number, text: string): string {
  return `${placeholderOpen(id)}${escapePlaceholderText(text)}${placeholderClose(id)}`;
}

function makeElementPlaceholder(element: Element, placeholders: BlockPlaceholder[], getComputedStyle?: ComputedStyleGetter): string {
  const id = placeholders.length;
  const opaque = placeholderIsOpaque(element, getComputedStyle);
  const text = opaque ? "" : (element.textContent ?? "");
  placeholders.push({ id, node: element, element, text, opaque });
  return placeholderToken(id, text);
}

function makeOpaqueNodePlaceholder(node: Node, placeholders: BlockPlaceholder[]): string {
  const id = placeholders.length;
  placeholders.push({ id, node, text: "", opaque: true });
  return placeholderToken(id, "");
}

function appendNodeSource(node: Node, placeholders: BlockPlaceholder[], getComputedStyle?: ComputedStyleGetter): string {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue ?? "";
  if (node.nodeType !== Node.ELEMENT_NODE) return makeOpaqueNodePlaceholder(node, placeholders);
  const element = node as Element;
  if (shouldPlaceholder(element, getComputedStyle)) return makeElementPlaceholder(element, placeholders, getComputedStyle);
  let source = "";
  for (const child of Array.from(element.childNodes)) source += appendNodeSource(child, placeholders, getComputedStyle);
  return source;
}

export function createBlockTranslationPlan(
  element: Element,
  { getComputedStyle }: { getComputedStyle?: ComputedStyleGetter } = {},
): BlockTranslationPlan | null {
  const placeholders: BlockPlaceholder[] = [];
  let source = "";
  for (const child of Array.from(element.childNodes)) source += appendNodeSource(child, placeholders, getComputedStyle);
  if (!source.trim()) return null;
  return { element, source, placeholders };
}

function decodePlaceholderText(document: Document, text: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

function descendantTextNodes(element: Element): Text[] {
  const nodes: Text[] = [];
  const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) nodes.push(node as Text);
  return nodes;
}

function distributeTranslatedPrefix(originals: string[], translated: string): string[] {
  if (originals.length <= 1) return [translated];
  const output = Array<string>(originals.length).fill("");
  const totalOriginalLength = originals.reduce((sum, part) => sum + part.length, 0);
  const whitespaceEnds = Array.from(translated.matchAll(/\s+/gu), (match) => (match.index ?? 0) + match[0].length);
  let sourceLength = 0;
  let translatedOffset = 0;
  for (let index = 0; index < originals.length - 1; index += 1) {
    sourceLength += originals[index]?.length ?? 0;
    const ideal = totalOriginalLength === 0 ? translatedOffset : (translated.length * sourceLength) / totalOriginalLength;
    const boundary = whitespaceEnds
      .filter((candidate) => candidate > translatedOffset)
      .sort((a, b) => Math.abs(a - ideal) - Math.abs(b - ideal))[0] ?? translatedOffset;
    output[index] = translated.slice(translatedOffset, boundary);
    translatedOffset = boundary;
  }
  output[originals.length - 1] = translated.slice(translatedOffset);
  return output;
}

function splitTranslatedTextAcrossNodes(originals: string[], translated: string): string[] {
  if (originals.length <= 1) return [translated];
  const output = Array<string>(originals.length).fill("");
  let remaining = translated;
  let suffixStart = originals.length;
  for (let index = originals.length - 1; index > 0; index -= 1) {
    const original = originals[index] ?? "";
    if (!original || !remaining.endsWith(original)) break;
    output[index] = original;
    remaining = remaining.slice(0, -original.length);
    suffixStart = index;
  }
  const prefix = distributeTranslatedPrefix(originals.slice(0, suffixStart), remaining);
  prefix.forEach((part, index) => {
    output[index] = part;
  });
  return output;
}

function placeholderTextUpdates(document: Document, placeholder: BlockPlaceholder, translatedText: string): PlaceholderTextUpdate[] {
  if (placeholder.opaque) return [];
  const decoded = decodePlaceholderText(document, translatedText);
  if (!placeholder.element) return [];
  const nodes = descendantTextNodes(placeholder.element);
  if (nodes.length === 0) return [];
  const originals = nodes.map((node) => node.nodeValue ?? "");
  const translatedParts = splitTranslatedTextAcrossNodes(originals, decoded);
  return nodes.map((node, index) => ({ node, original: originals[index] ?? "", translated: translatedParts[index] ?? "" }));
}

function materializePlaceholder(placeholder: BlockPlaceholder): Node {
  return placeholder.node;
}

const WORD_END_RE = /[\p{L}\p{N}]$/u;
const WORD_START_RE = /^[\p{L}\p{N}]/u;

function differenceSeparator(document: Document, removed: string, added: string): Node[] {
  return WORD_END_RE.test(removed) && WORD_START_RE.test(added)
    ? [document.createTextNode(" ")]
    : [];
}

export function createTextDifferenceNodes(document: Document, original: string, translated: string): Node[] {
  if (original === translated) return original ? [document.createTextNode(original)] : [];
  const nodes: Node[] = [];
  let removed = "";
  for (const change of diffWordsWithSpace(original, translated)) {
    if (change.added && removed) nodes.push(...differenceSeparator(document, removed, change.value));
    if (!change.added && !change.removed) {
      nodes.push(document.createTextNode(change.value));
      removed = "";
      continue;
    }
    const element = document.createElement(change.added ? "ins" : "del");
    element.textContent = change.value;
    nodes.push(element);
    removed = change.removed ? change.value : "";
  }
  return nodes;
}

/** Render translated text while marking only inserted word runs for optional UI effects. */
export function createTranslatedTextNodes(document: Document, original: string, translated: string): Node[] {
  if (original === translated) return translated ? [document.createTextNode(translated)] : [];
  const nodes: Node[] = [];
  for (const change of diffWordsWithSpace(original, translated)) {
    if (change.removed) continue;
    if (!change.added) {
      nodes.push(document.createTextNode(change.value));
      continue;
    }
    const span = document.createElement("span");
    span.setAttribute("data-alman-change", "");
    span.textContent = change.value;
    nodes.push(span);
  }
  return nodes;
}

function translatedPlaceholderClone(document: Document, placeholder: BlockPlaceholder, translatedText: string): Node {
  const clone = placeholder.node.cloneNode(true);
  if (placeholder.opaque || !placeholder.element || clone.nodeType !== Node.ELEMENT_NODE) return clone;
  const element = clone as Element;
  const nodes = descendantTextNodes(element);
  const originals = nodes.map((node) => node.nodeValue ?? "");
  const translatedParts = splitTranslatedTextAcrossNodes(originals, decodePlaceholderText(document, translatedText));
  nodes.forEach((node, index) => {
    node.nodeValue = translatedParts[index] ?? "";
  });
  return clone;
}

function differencePlaceholderNodes(document: Document, placeholder: BlockPlaceholder, translatedText: string): Node[] {
  const decoded = decodePlaceholderText(document, translatedText);
  if (placeholder.opaque || placeholder.text === decoded) return [placeholder.node.cloneNode(true)];
  const removed = document.createElement("del");
  removed.append(placeholder.node.cloneNode(true));
  const added = document.createElement("ins");
  added.append(translatedPlaceholderClone(document, placeholder, translatedText));
  return [removed, ...differenceSeparator(document, placeholder.text, decoded), added];
}

function parseTranslatedPlan(plan: BlockTranslationPlan, translatedText: string, markChanges: boolean): {
  children: Node[];
  differenceChildren: Node[];
  placeholderTextUpdates: PlaceholderTextUpdate[];
  changedElements: Element[];
} | null {
  const document = plan.element.ownerDocument;
  const parts: Array<{ before: string; placeholder: BlockPlaceholder; translatedText: string }> = [];
  let cursor = 0;
  let expectedId = 0;
  PLACEHOLDER_RE.lastIndex = 0;

  for (const match of translatedText.matchAll(PLACEHOLDER_RE)) {
    const id = Number(match[1]);
    const index = match.index ?? 0;
    if (id !== expectedId || index < cursor) return null;
    const placeholder = plan.placeholders[id];
    if (!placeholder) return null;
    parts.push({ before: translatedText.slice(cursor, index), placeholder, translatedText: match[2] ?? "" });
    cursor = index + match[0].length;
    expectedId += 1;
  }

  if (expectedId !== plan.placeholders.length) return null;

  const children: Node[] = [];
  const differenceChildren: Node[] = [];
  const updates: PlaceholderTextUpdate[] = [];
  const changedElements: Element[] = [];
  let sourceCursor = 0;
  for (const part of parts) {
    const sourceOpen = placeholderOpen(part.placeholder.id);
    const sourceIndex = plan.source.indexOf(sourceOpen, sourceCursor);
    if (sourceIndex < sourceCursor) return null;
    const originalBefore = plan.source.slice(sourceCursor, sourceIndex);
    differenceChildren.push(...createTextDifferenceNodes(document, originalBefore, part.before));
    children.push(...(markChanges
      ? createTranslatedTextNodes(document, originalBefore, part.before)
      : part.before ? [document.createTextNode(part.before)] : []));
    children.push(materializePlaceholder(part.placeholder));
    differenceChildren.push(...differencePlaceholderNodes(document, part.placeholder, part.translatedText));
    const decodedPlaceholder = decodePlaceholderText(document, part.translatedText);
    if (markChanges && !part.placeholder.opaque && part.placeholder.element && decodedPlaceholder !== part.placeholder.text) {
      changedElements.push(part.placeholder.element);
    }
    updates.push(...placeholderTextUpdates(document, part.placeholder, part.translatedText));
    sourceCursor = sourceIndex + placeholderToken(part.placeholder.id, part.placeholder.text).length;
  }
  const after = translatedText.slice(cursor);
  const originalAfter = plan.source.slice(sourceCursor);
  children.push(...(markChanges
    ? createTranslatedTextNodes(document, originalAfter, after)
    : after ? [document.createTextNode(after)] : []));
  differenceChildren.push(...createTextDifferenceNodes(document, originalAfter, after));
  return { children, differenceChildren, placeholderTextUpdates: updates, changedElements };
}

export async function translateBlockPlan(
  plan: BlockTranslationPlan,
  engine: SafeTranslator,
  { markChanges = false }: { markChanges?: boolean } = {},
): Promise<BlockTranslationResult> {
  const translatedText = await engine.translateText(plan.source);
  if (translatedText === plan.source) {
    const children = cloneChildren(plan.element);
    return {
      translated: false,
      translatedText,
      translatedChildren: children,
      differenceChildren: cloneChildren(plan.element),
      placeholderTextUpdates: [],
      changedElements: [],
    };
  }
  const parsed = parseTranslatedPlan(plan, translatedText, markChanges);
  if (!parsed) {
    return {
      translated: false,
      translatedText: plan.source,
      translatedChildren: cloneChildren(plan.element),
      differenceChildren: cloneChildren(plan.element),
      placeholderTextUpdates: [],
      changedElements: [],
    };
  }
  return {
    translated: true,
    translatedText,
    translatedChildren: parsed.children,
    differenceChildren: parsed.differenceChildren,
    placeholderTextUpdates: parsed.placeholderTextUpdates,
    changedElements: parsed.changedElements,
  };
}
