import { diffWordsWithSpace } from "diff";
import { elementBlocksTranslation, type ComputedStyleGetter, type SafeTranslator } from "../engine/safe-translation";

const INLINE_TRANSLATABLE_TAGS = new Set([
  "A",
  "ABBR",
  "B",
  "BDI",
  "BDO",
  "CITE",
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

const NONEMPTY_LABEL_TAGS = new Set(["A", "LABEL"]);
const STRUCTURAL_SEPARATOR_TAGS = new Map([["BR", " "]]);
const CITATION_SELECTOR = 'sup.mw-ref, sup.reference, sup[id^="cite_ref"], [role="doc-noteref"]';
const WORD_END_RE = /[\p{L}\p{N}]$/u;
const WORD_START_RE = /^[\p{L}\p{N}]/u;

export interface BlockTextRun {
  node: Text;
  original: string;
  start: number;
  end: number;
  /** Inline ancestors from the block child inward. */
  ancestors: Element[];
  /** Live structural node represented as whitespace in model input. */
  structural?: Node;
  structuralParent?: Node;
}

export interface BlockAnchor {
  node: Node;
  offset: number;
}

interface BlockElementRange {
  element: Element;
  start: number;
  end: number;
}

export interface BlockTranslationPlan {
  element: Element;
  /** Plain rendered prose. Synthetic DOM tags never enter this string. */
  source: string;
  runs: BlockTextRun[];
  anchors: BlockAnchor[];
  elementRanges: BlockElementRange[];
}

export interface TextUpdate {
  node: Text;
  original: string;
  translated: string;
  /** False when translated children render this top-level text with change spans. */
  applyDirectly: boolean;
}

export interface BlockTranslationResult {
  translated: boolean;
  /** Why a changed model result could not be applied safely. */
  failure?: "stale" | "ambiguous";
  translatedText: string;
  translatedChildren: Node[];
  differenceChildren: Node[];
  textUpdates: TextUpdate[];
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

function elementIsOpaque(element: Element, getComputedStyle?: ComputedStyleGetter): boolean {
  return (
    element.matches(CITATION_SELECTOR) ||
    elementBlocksTranslation(element, getComputedStyle) ||
    containsProtectedDescendant(element, getComputedStyle) ||
    !INLINE_TRANSLATABLE_TAGS.has(element.tagName)
  );
}

export function createBlockTranslationPlan(
  element: Element,
  { getComputedStyle }: { getComputedStyle?: ComputedStyleGetter } = {},
): BlockTranslationPlan | null {
  const sourceParts: string[] = [];
  const runs: BlockTextRun[] = [];
  const anchors: BlockAnchor[] = [];
  const elementRanges: BlockElementRange[] = [];
  let offset = 0;

  function append(node: Node, ancestors: Element[]): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const original = node.nodeValue ?? "";
      if (!original) return;
      const start = offset;
      sourceParts.push(original);
      offset += original.length;
      runs.push({ node: node as Text, original, start, end: offset, ancestors });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      anchors.push({ node, offset });
      return;
    }
    const child = node as Element;
    const separator = STRUCTURAL_SEPARATOR_TAGS.get(child.tagName);
    if (separator !== undefined) {
      const start = offset;
      const synthetic = element.ownerDocument.createTextNode(separator);
      sourceParts.push(separator);
      offset += separator.length;
      runs.push({
        node: synthetic,
        original: separator,
        start,
        end: offset,
        ancestors,
        structural: child,
        structuralParent: child.parentNode ?? undefined,
      });
      anchors.push({ node: child, offset: start });
      return;
    }
    if (elementIsOpaque(child, getComputedStyle)) {
      anchors.push({ node: child, offset });
      return;
    }
    const start = offset;
    const nextAncestors = [...ancestors, child];
    for (const descendant of Array.from(child.childNodes)) append(descendant, nextAncestors);
    elementRanges.push({ element: child, start, end: offset });
  }

  for (const child of Array.from(element.childNodes)) append(child, []);
  const source = sourceParts.join("");
  if (!source.trim()) return null;
  return { element, source, runs, anchors, elementRanges };
}

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
    element.setAttribute("data-alman-generated-diff", "");
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
    span.setAttribute("data-alman-generated-change", "");
    span.textContent = change.value;
    nodes.push(span);
  }
  return nodes;
}

function sameAncestors(left: Element[], right: Element[]): boolean {
  return left.length === right.length && left.every((element, index) => element === right[index]);
}

function isAncestorPrefix(shorter: Element[], longer: Element[]): boolean {
  return shorter.length <= longer.length && shorter.every((element, index) => element === longer[index]);
}

function runsOverlapping(runs: BlockTextRun[], start: number, end: number): BlockTextRun[] {
  return runs.filter((run) => run.start < end && run.end > start);
}

function ownerForReplacement(plan: BlockTranslationPlan, start: number, end: number): BlockTextRun | null {
  if (plan.anchors.some((anchor) => anchor.offset > start && anchor.offset < end)) return null;
  const affected = runsOverlapping(plan.runs, start, end);
  const editable = affected.filter((run) => !run.structural);
  if (editable.length === 0) return null;
  if (editable.length === 1) return editable[0] ?? null;
  const ancestors = editable[0]?.ancestors ?? [];
  return editable.every((run) => sameAncestors(run.ancestors, ancestors)) ? (editable[0] ?? null) : null;
}

function ownerAtBoundary(plan: BlockTranslationPlan, offset: number): BlockTextRun | null {
  const containing = plan.runs.find((run) => run.start < offset && run.end > offset);
  if (containing) return containing.structural ? null : containing;

  const left = [...plan.runs].reverse().find((run) => !run.structural && run.end === offset);
  const right = plan.runs.find((run) => !run.structural && run.start === offset);
  if (left && right && plan.anchors.some((anchor) => anchor.offset === offset)) return null;
  if (!left) return right && right.ancestors.length === 0 ? right : null;
  if (!right) return left.ancestors.length === 0 ? left : null;
  if (sameAncestors(left.ancestors, right.ancestors)) return left;
  if (isAncestorPrefix(left.ancestors, right.ancestors)) return left;
  if (isAncestorPrefix(right.ancestors, left.ancestors)) return right;
  return null;
}

interface EditHunk {
  removed: Set<string>;
  added: Set<string>;
}

function normalizedWords(text: string): Set<string> {
  return new Set(Array.from(text.matchAll(/[\p{L}\p{N}]+/gu), (match) => match[0]!.toLocaleLowerCase("de")));
}

function setsOverlap(left: Set<string>, right: Set<string>): boolean {
  return [...left].some((word) => right.has(word));
}

/** Reject lexical moves that a monotonic diff would otherwise disguise as substitutions. */
function hasLexicalMoves(source: string, translated: string): boolean {
  const hunks: EditHunk[] = [];
  let current: EditHunk | null = null;
  for (const change of diffWordsWithSpace(source, translated)) {
    if (!change.added && !change.removed) {
      current = null;
      continue;
    }
    if (!current) {
      current = { removed: new Set(), added: new Set() };
      hunks.push(current);
    }
    const words = normalizedWords(change.value);
    for (const word of words) (change.removed ? current.removed : current.added).add(word);
  }
  for (let addedIndex = 0; addedIndex < hunks.length; addedIndex += 1) {
    for (let removedIndex = 0; removedIndex < hunks.length; removedIndex += 1) {
      if (addedIndex === removedIndex) continue;
      if (setsOverlap(hunks[addedIndex]!.added, hunks[removedIndex]!.removed)) return true;
    }
  }
  return false;
}

interface Projection {
  targets: Map<Text, string>;
  updates: TextUpdate[];
  changedElements: Element[];
}

function projectTranslation(plan: BlockTranslationPlan, translated: string, markChanges: boolean): Projection | null {
  const firstAncestors = plan.runs[0]?.ancestors ?? [];
  const crossesInlineScopes = plan.runs.some((run) => !sameAncestors(run.ancestors, firstAncestors));
  if (crossesInlineScopes && hasLexicalMoves(plan.source, translated)) return null;
  const output = new Map<BlockTextRun, string>(plan.runs.map((run) => [run, ""]));
  let sourceOffset = 0;
  let removedRange: { start: number; end: number } | null = null;

  function append(run: BlockTextRun, value: string): void {
    output.set(run, `${output.get(run) ?? ""}${value}`);
  }

  function copySourceRange(start: number, value: string): boolean {
    const end = start + value.length;
    if (plan.source.slice(start, end) !== value) return false;
    for (const run of runsOverlapping(plan.runs, start, end)) {
      const overlapStart = Math.max(start, run.start);
      const overlapEnd = Math.min(end, run.end);
      append(run, plan.source.slice(overlapStart, overlapEnd));
    }
    return true;
  }

  for (const change of diffWordsWithSpace(plan.source, translated)) {
    if (change.removed) {
      const start = sourceOffset;
      const end = start + change.value.length;
      if (plan.source.slice(start, end) !== change.value) return null;
      removedRange = removedRange ? { start: removedRange.start, end } : { start, end };
      sourceOffset = end;
      continue;
    }
    if (change.added) {
      const owner = removedRange
        ? ownerForReplacement(plan, removedRange.start, removedRange.end)
        : ownerAtBoundary(plan, sourceOffset);
      if (!owner) return null;
      append(owner, change.value);
      continue;
    }
    removedRange = null;
    if (!copySourceRange(sourceOffset, change.value)) return null;
    sourceOffset += change.value.length;
  }

  if (sourceOffset !== plan.source.length) return null;
  const projected = plan.runs.map((run) => output.get(run) ?? "").join("");
  if (projected !== translated) return null;

  const targets = new Map<Text, string>();
  const updates: TextUpdate[] = [];
  const changedElements = new Set<Element>();
  for (const run of plan.runs) {
    const target = output.get(run) ?? "";
    if (run.structural) {
      if (!/^\s*$/u.test(target)) return null;
      continue;
    }
    targets.set(run.node, target);
    if (target === run.original) continue;
    const directTextWithEffects = markChanges && run.node.parentNode === plan.element;
    updates.push({
      node: run.node,
      original: run.original,
      translated: target,
      applyDirectly: !directTextWithEffects,
    });
    const topInline = run.ancestors[0];
    if (markChanges && topInline) changedElements.add(topInline);
  }

  for (const range of plan.elementRanges) {
    if (!NONEMPTY_LABEL_TAGS.has(range.element.tagName)) continue;
    const sourceLabel = plan.source.slice(range.start, range.end);
    if (!sourceLabel.trim()) continue;
    const targetLabel = plan.runs
      .filter((run) => run.start >= range.start && run.end <= range.end)
      .map((run) => output.get(run) ?? "")
      .join("");
    if (!targetLabel.trim()) return null;
  }

  return { targets, updates, changedElements: [...changedElements] };
}

function translatedChildren(plan: BlockTranslationPlan, projection: Projection, markChanges: boolean): Node[] {
  const document = plan.element.ownerDocument;
  return Array.from(plan.element.childNodes).flatMap((child): Node[] => {
    if (child.nodeType !== Node.TEXT_NODE) return [child];
    const text = child as Text;
    const target = projection.targets.get(text);
    if (target === undefined || target === text.nodeValue) return [text];
    if (markChanges) return createTranslatedTextNodes(document, text.nodeValue ?? "", target);
    return [text];
  });
}

function differenceNode(node: Node, document: Document, targets: Map<Text, string>): Node[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node as Text;
    const target = targets.get(text);
    return target === undefined
      ? [text.cloneNode(true)]
      : createTextDifferenceNodes(document, text.nodeValue ?? "", target);
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return [node.cloneNode(true)];
  const clone = node.cloneNode(false) as Element;
  for (const child of Array.from(node.childNodes)) clone.append(...differenceNode(child, document, targets));
  return [clone];
}

function unchangedResult(
  plan: BlockTranslationPlan,
  failure?: BlockTranslationResult["failure"],
): BlockTranslationResult {
  return {
    translated: false,
    ...(failure ? { failure } : {}),
    translatedText: plan.source,
    translatedChildren: Array.from(plan.element.childNodes),
    differenceChildren: cloneChildren(plan.element),
    textUpdates: [],
    changedElements: [],
  };
}

function runStructureIsCurrent(plan: BlockTranslationPlan, run: BlockTextRun): boolean {
  if (run.structural) {
    return run.structural.isConnected && run.structural.parentNode === run.structuralParent;
  }
  if (!run.node.isConnected || run.node.nodeValue !== run.original) return false;
  const expectedParent = run.ancestors.at(-1) ?? plan.element;
  if (run.node.parentNode !== expectedParent) return false;
  if (run.ancestors.length > 0 && run.ancestors[0]?.parentNode !== plan.element) return false;
  return run.ancestors.slice(1).every((ancestor, index) => ancestor.parentNode === run.ancestors[index]);
}

function runOrderIsCurrent(plan: BlockTranslationPlan): boolean {
  const nodes = plan.runs.map((run) => run.structural ?? run.node);
  return nodes.slice(1).every((node, index) => {
    const previous = nodes[index]!;
    return Boolean(previous.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
}

export async function translateBlockPlan(
  plan: BlockTranslationPlan,
  engine: SafeTranslator,
  { markChanges = false }: { markChanges?: boolean } = {},
): Promise<BlockTranslationResult> {
  const translatedText = await engine.translateText(plan.source);
  if (translatedText === plan.source) return unchangedResult(plan);
  if (plan.runs.some((run) => !runStructureIsCurrent(plan, run)) || !runOrderIsCurrent(plan)) {
    return unchangedResult(plan, "stale");
  }
  const projection = projectTranslation(plan, translatedText, markChanges);
  if (!projection) return unchangedResult(plan, "ambiguous");
  const document = plan.element.ownerDocument;
  return {
    translated: true,
    translatedText,
    translatedChildren: translatedChildren(plan, projection, markChanges),
    differenceChildren: Array.from(plan.element.childNodes).flatMap((child) => differenceNode(child, document, projection.targets)),
    textUpdates: projection.updates,
    changedElements: projection.changedElements,
  };
}
