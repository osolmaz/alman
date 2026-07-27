import { diffArrays, diffWordsWithSpace } from "diff";
import {
  declaredTranslationLanguage,
  elementBlocksTranslation,
  sentenceSegments,
  type ComputedStyleGetter,
  type SafeTranslator,
  type TranslationLanguage,
} from "../engine/safe-translation";
import { isBlockElement } from "./blocks";

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

interface BlockChildSnapshot {
  parent: Element;
  children: Node[];
}

export interface BlockTranslationPlan {
  element: Element;
  /** Plain rendered prose. Synthetic DOM tags never enter this string. */
  source: string;
  runs: BlockTextRun[];
  anchors: BlockAnchor[];
  /** Source offsets where omitted foreign-language content separates model calls. */
  translationBoundaries: number[];
  elementRanges: BlockElementRange[];
  /** Child identity and order for every element whose text entered the source. */
  childSnapshots: BlockChildSnapshot[];
}

export interface TextUpdate {
  node: Text;
  original: string;
  translated: string;
  /** False when translated children render this top-level text with change spans. */
  applyDirectly: boolean;
}

export type ProjectionFailureDetail = "dom-stale" | "lexical-move" | "ambiguous-ownership";

export interface BlockTranslationResult {
  translated: boolean;
  /** Stable high-level lifecycle category. */
  failure?: "stale" | "ambiguous";
  /** Local diagnostic reason. Source text is never recorded. */
  failureDetail?: ProjectionFailureDetail;
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
    isBlockElement(element, getComputedStyle) ||
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
  const translationBoundaries: number[] = [];
  const elementRanges: BlockElementRange[] = [];
  const childSnapshots: BlockChildSnapshot[] = [{ parent: element, children: Array.from(element.childNodes) }];
  let offset = 0;

  function append(node: Node, ancestors: Element[], language: TranslationLanguage): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const original = node.nodeValue ?? "";
      if (!original) return;
      if (language === "foreign") {
        anchors.push({ node, offset });
        translationBoundaries.push(offset);
        return;
      }
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
    const childLanguage = declaredTranslationLanguage(child) ?? language;
    const separator = STRUCTURAL_SEPARATOR_TAGS.get(child.tagName);
    if (separator !== undefined) {
      if (childLanguage === "foreign") {
        anchors.push({ node: child, offset });
        translationBoundaries.push(offset);
        return;
      }
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
    const descendants = Array.from(child.childNodes);
    childSnapshots.push({ parent: child, children: descendants });
    for (const descendant of descendants) append(descendant, nextAncestors, childLanguage);
    elementRanges.push({ element: child, start, end: offset });
  }

  let rootLanguage: TranslationLanguage = "german";
  for (let current: Element | null = element; current; current = current.parentElement) {
    const declared = declaredTranslationLanguage(current);
    if (!declared) continue;
    rootLanguage = declared;
    break;
  }
  for (const child of Array.from(element.childNodes)) append(child, [], rootLanguage);
  const source = sourceParts.join("");
  if (!source.trim()) return null;
  return {
    element,
    source,
    runs,
    anchors,
    translationBoundaries: [...new Set(translationBoundaries)].sort((left, right) => left - right),
    elementRanges,
    childSnapshots,
  };
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
  start: number;
  end: number;
  removedScopes: Map<string, Element[][]>;
  added: Set<string>;
}

function normalizedWordMatches(text: string): RegExpStringIterator<RegExpExecArray> {
  return text.matchAll(/[\p{L}\p{N}]+/gu);
}

/** Reject lexical moves only when a word crosses live DOM ownership scopes. */
function segmentHasLexicalMoves(
  plan: BlockTranslationPlan,
  source: string,
  translated: string,
  segmentStart: number,
): boolean {
  const hunks: EditHunk[] = [];
  let current: EditHunk | null = null;
  let sourceOffset = segmentStart;
  for (const change of diffWordsWithSpace(source, translated)) {
    if (!change.added && !change.removed) {
      current = null;
      sourceOffset += change.value.length;
      continue;
    }
    if (!current) {
      current = {
        start: sourceOffset,
        end: sourceOffset,
        removedScopes: new Map(),
        added: new Set(),
      };
      hunks.push(current);
    }
    if (change.removed) {
      for (const match of normalizedWordMatches(change.value)) {
        const start = sourceOffset + (match.index ?? 0);
        const end = start + match[0].length;
        const word = match[0].toLocaleLowerCase("de");
        const scopes = current.removedScopes.get(word) ?? [];
        for (const run of runsOverlapping(plan.runs, start, end)) {
          if (!run.structural) scopes.push(run.ancestors);
        }
        current.removedScopes.set(word, scopes);
      }
      sourceOffset += change.value.length;
      current.end = sourceOffset;
      continue;
    }
    for (const match of normalizedWordMatches(change.value)) {
      current.added.add(match[0].toLocaleLowerCase("de"));
    }
  }

  for (const [addedIndex, addedHunk] of hunks.entries()) {
    const additionOwner = addedHunk.end > addedHunk.start
      ? ownerForReplacement(plan, addedHunk.start, addedHunk.end)
      : ownerAtBoundary(plan, addedHunk.start);
    for (const [removedIndex, removedHunk] of hunks.entries()) {
      if (addedIndex === removedIndex) continue;
      for (const word of addedHunk.added) {
        const removedScopes = removedHunk.removedScopes.get(word);
        if (!removedScopes) continue;
        if (!additionOwner || removedScopes.length === 0) return true;
        if (removedScopes.some((scope) => !sameAncestors(scope, additionOwner.ancestors))) return true;
      }
    }
  }
  return false;
}

function hasLexicalMoves(plan: BlockTranslationPlan, translated: string): boolean {
  const sourceSegments = sentenceSegments(plan.source);
  const translatedSegments = sentenceSegments(translated);
  if (sourceSegments.length === translatedSegments.length && sourceSegments.length > 1) {
    // SafeTranslator translates source sentences independently. Words cannot
    // move between those model calls, so identical inflections in different
    // sentences must not trigger the cross-scope move guard.
    let sourceOffset = 0;
    return sourceSegments.some((segment, index) => {
      const moved = segmentHasLexicalMoves(
        plan,
        segment,
        translatedSegments[index] ?? "",
        sourceOffset,
      );
      sourceOffset += segment.length;
      return moved;
    });
  }
  return segmentHasLexicalMoves(plan, plan.source, translated, 0);
}

interface Projection {
  targets: Map<Text, string>;
  updates: TextUpdate[];
  changedElements: Element[];
}

interface TextChange {
  value: string;
  added?: boolean;
  removed?: boolean;
}

function finishProjection(
  plan: BlockTranslationPlan,
  translated: string,
  markChanges: boolean,
  output: Map<BlockTextRun, string>,
): Projection | null {
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

function appendOutput(output: Map<BlockTextRun, string>, run: BlockTextRun, value: string): void {
  output.set(run, `${output.get(run) ?? ""}${value}`);
}

function copySourceRange(
  plan: BlockTranslationPlan,
  output: Map<BlockTextRun, string>,
  start: number,
  value: string,
): boolean {
  const end = start + value.length;
  if (plan.source.slice(start, end) !== value) return false;
  for (const run of runsOverlapping(plan.runs, start, end)) {
    const overlapStart = Math.max(start, run.start);
    const overlapEnd = Math.min(end, run.end);
    appendOutput(output, run, plan.source.slice(overlapStart, overlapEnd));
  }
  return true;
}

function projectWordChanges(plan: BlockTranslationPlan, translated: string, markChanges: boolean): Projection | null {
  const output = new Map<BlockTextRun, string>(plan.runs.map((run) => [run, ""]));
  let sourceOffset = 0;
  let removedRange: { start: number; end: number } | null = null;

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
      appendOutput(output, owner, change.value);
      continue;
    }
    if (removedRange && !ownerForReplacement(plan, removedRange.start, removedRange.end)) return null;
    removedRange = null;
    if (!copySourceRange(plan, output, sourceOffset, change.value)) return null;
    sourceOffset += change.value.length;
  }

  if (removedRange && !ownerForReplacement(plan, removedRange.start, removedRange.end)) return null;
  if (sourceOffset !== plan.source.length) return null;
  return finishProjection(plan, translated, markChanges, output);
}

function graphemes(text: string): string[] {
  if (typeof Intl?.Segmenter !== "function") return Array.from(text);
  return Array.from(new Intl.Segmenter("de", { granularity: "grapheme" }).segment(text), ({ segment }) => segment);
}

function graphemeChanges(source: string, translated: string): TextChange[] {
  return diffArrays(graphemes(source), graphemes(translated)).map((change) => ({
    value: change.value.join(""),
    ...(change.added ? { added: true } : {}),
    ...(change.removed ? { removed: true } : {}),
  }));
}

function sourceWordKey(source: string, start: number, end: number): string {
  const left = source.slice(0, start).match(/[\p{L}\p{N}\p{M}]+$/u)?.[0] ?? "";
  const right = source.slice(end).match(/^[\p{L}\p{N}\p{M}]+/u)?.[0] ?? "";
  return `${start - left.length}:${end + right.length}`;
}

function nextRemovalOwner(
  plan: BlockTranslationPlan,
  changes: TextChange[],
  index: number,
  sourceOffset: number,
): { owner: BlockTextRun; key: string } | null {
  let offset = sourceOffset;
  for (let nextIndex = index + 1; nextIndex < changes.length; nextIndex += 1) {
    const next = changes[nextIndex]!;
    if (next.removed) {
      const end = offset + next.value.length;
      const owner = ownerForReplacement(plan, offset, end);
      return owner ? { owner, key: sourceWordKey(plan.source, offset, end) } : null;
    }
    if (next.added) continue;
    if (/\S/u.test(next.value)) return null;
    offset += next.value.length;
  }
  return null;
}

/** Refine a rejected word projection without allowing one source word to change in multiple DOM scopes. */
function projectGraphemeChanges(plan: BlockTranslationPlan, translated: string, markChanges: boolean): Projection | null {
  const changes = graphemeChanges(plan.source, translated);
  const output = new Map<BlockTextRun, string>(plan.runs.map((run) => [run, ""]));
  const wordOwners = new Map<string, BlockTextRun>();
  const state: { affinity: { owner: BlockTextRun; key: string } | null } = { affinity: null };
  let sourceOffset = 0;
  let removedRange: { start: number; end: number } | null = null;

  function register(owner: BlockTextRun, key: string): boolean {
    const existing = wordOwners.get(key);
    if (existing && existing !== owner) return false;
    wordOwners.set(key, owner);
    state.affinity = { owner, key };
    return true;
  }

  function finishRemoval(): boolean {
    if (!removedRange) return true;
    const owner = ownerForReplacement(plan, removedRange.start, removedRange.end);
    if (!owner || !register(owner, sourceWordKey(plan.source, removedRange.start, removedRange.end))) return false;
    removedRange = null;
    return true;
  }

  for (let index = 0; index < changes.length; index += 1) {
    const change = changes[index]!;
    if (change.removed) {
      const start = sourceOffset;
      const end = start + change.value.length;
      if (plan.source.slice(start, end) !== change.value) return null;
      removedRange = removedRange ? { start: removedRange.start, end } : { start, end };
      sourceOffset = end;
      continue;
    }
    if (change.added) {
      if (removedRange) {
        const owner = ownerForReplacement(plan, removedRange.start, removedRange.end);
        const key = sourceWordKey(plan.source, removedRange.start, removedRange.end);
        if (!owner || !register(owner, key)) return null;
        appendOutput(output, owner, change.value);
        removedRange = null;
        continue;
      }

      let owner = ownerAtBoundary(plan, sourceOffset);
      let key = sourceWordKey(plan.source, sourceOffset, sourceOffset);
      if (!owner) {
        const right = nextRemovalOwner(plan, changes, index, sourceOffset);
        if (state.affinity && right && state.affinity.owner !== right.owner) return null;
        const resolved = state.affinity ?? right;
        if (!resolved) return null;
        owner = resolved.owner;
        key = resolved.key;
      }
      if (!register(owner, key)) return null;
      appendOutput(output, owner, change.value);
      continue;
    }

    if (!finishRemoval()) return null;
    if (!copySourceRange(plan, output, sourceOffset, change.value)) return null;
    sourceOffset += change.value.length;
    if (/\S/u.test(change.value)) state.affinity = null;
  }

  if (!finishRemoval() || sourceOffset !== plan.source.length) return null;
  return finishProjection(plan, translated, markChanges, output);
}

function projectTranslation(
  plan: BlockTranslationPlan,
  translated: string,
  markChanges: boolean,
): { projection: Projection | null; failureDetail?: ProjectionFailureDetail } {
  const firstAncestors = plan.runs[0]?.ancestors ?? [];
  const crossesInlineScopes = plan.runs.some((run) => !sameAncestors(run.ancestors, firstAncestors));
  if (crossesInlineScopes && hasLexicalMoves(plan, translated)) {
    return { projection: null, failureDetail: "lexical-move" };
  }
  const projection = projectWordChanges(plan, translated, markChanges)
    ?? projectGraphemeChanges(plan, translated, markChanges);
  return projection
    ? { projection }
    : { projection: null, failureDetail: "ambiguous-ownership" };
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
  failureDetail?: ProjectionFailureDetail,
): BlockTranslationResult {
  return {
    translated: false,
    ...(failure ? { failure } : {}),
    ...(failureDetail ? { failureDetail } : {}),
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

function childSnapshotsAreCurrent(plan: BlockTranslationPlan): boolean {
  return plan.childSnapshots.every(({ parent, children }) => {
    const current = Array.from(parent.childNodes);
    return current.length === children.length && current.every((node, index) => node === children[index]);
  });
}

interface TranslationRange {
  start: number;
  end: number;
}

function translationRanges(plan: BlockTranslationPlan): TranslationRange[] {
  const boundaries = [
    0,
    ...plan.translationBoundaries.filter((offset) => offset > 0 && offset < plan.source.length),
    plan.source.length,
  ];
  return boundaries.slice(0, -1).map((start, index) => ({ start, end: boundaries[index + 1]! }));
}

function sliceTranslationPlan(
  plan: BlockTranslationPlan,
  { start, end }: TranslationRange,
): BlockTranslationPlan | null {
  const overlapping = runsOverlapping(plan.runs, start, end);
  if (overlapping.some((run) => run.start < start || run.end > end)) return null;
  return {
    element: plan.element,
    source: plan.source.slice(start, end),
    runs: overlapping.map((run) => ({ ...run, start: run.start - start, end: run.end - start })),
    anchors: plan.anchors
      .filter((anchor) => anchor.offset > start && anchor.offset < end)
      .map((anchor) => ({ ...anchor, offset: anchor.offset - start })),
    translationBoundaries: [],
    elementRanges: plan.elementRanges
      .filter((range) => range.start >= start && range.end <= end)
      .map((range) => ({ ...range, start: range.start - start, end: range.end - start })),
    childSnapshots: plan.childSnapshots,
  };
}

async function translateAndProjectRanges(
  plan: BlockTranslationPlan,
  engine: SafeTranslator,
  markChanges: boolean,
): Promise<{
  translatedText: string;
  changed: boolean;
  projection: Projection | null;
  failureDetail?: ProjectionFailureDetail;
}> {
  const targets = new Map<Text, string>();
  const updates: TextUpdate[] = [];
  const changedElements = new Set<Element>();
  const translatedParts: string[] = [];
  let changed = false;

  for (const range of translationRanges(plan)) {
    const rangePlan = sliceTranslationPlan(plan, range);
    if (!rangePlan) {
      return { translatedText: plan.source, changed: false, projection: null, failureDetail: "ambiguous-ownership" };
    }
    const translated = rangePlan.source.trim()
      ? await engine.translateText(rangePlan.source)
      : rangePlan.source;
    translatedParts.push(translated);
    changed ||= translated !== rangePlan.source;
    const attempt = projectTranslation(rangePlan, translated, markChanges);
    if (!attempt.projection) {
      return {
        translatedText: translatedParts.join(""),
        changed,
        projection: null,
        ...(attempt.failureDetail ? { failureDetail: attempt.failureDetail } : {}),
      };
    }
    for (const [node, target] of attempt.projection.targets) targets.set(node, target);
    updates.push(...attempt.projection.updates);
    for (const element of attempt.projection.changedElements) changedElements.add(element);
  }

  return {
    translatedText: translatedParts.join(""),
    changed,
    projection: { targets, updates, changedElements: [...changedElements] },
  };
}

export async function translateBlockPlan(
  plan: BlockTranslationPlan,
  engine: SafeTranslator,
  { markChanges = false }: { markChanges?: boolean } = {},
): Promise<BlockTranslationResult> {
  const attempt = await translateAndProjectRanges(plan, engine, markChanges);
  if (!attempt.changed) return unchangedResult(plan);
  if (
    plan.runs.some((run) => !runStructureIsCurrent(plan, run)) ||
    !runOrderIsCurrent(plan) ||
    !childSnapshotsAreCurrent(plan)
  ) {
    return unchangedResult(plan, "stale", "dom-stale");
  }
  if (!attempt.projection) return unchangedResult(plan, "ambiguous", attempt.failureDetail);
  const document = plan.element.ownerDocument;
  return {
    translated: true,
    translatedText: attempt.translatedText,
    translatedChildren: translatedChildren(plan, attempt.projection, markChanges),
    differenceChildren: Array.from(plan.element.childNodes).flatMap((child) => differenceNode(child, document, attempt.projection!.targets)),
    textUpdates: attempt.projection.updates,
    changedElements: attempt.projection.changedElements,
  };
}
