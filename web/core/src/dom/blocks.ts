import { elementBlocksTranslation, type ComputedStyleGetter } from "../engine/safe-translation";

/**
 * Fallback block classification for environments whose computed styles are
 * unavailable or empty (test DOMs, detached fragments).
 */
const BLOCK_FALLBACK_TAGS = new Set([
  "ADDRESS", "ARTICLE", "ASIDE", "BLOCKQUOTE", "CAPTION", "DD", "DETAILS", "DIV",
  "DL", "DT", "FIELDSET", "FIGCAPTION", "FIGURE", "FOOTER", "FORM", "H1", "H2",
  "H3", "H4", "H5", "H6", "HEADER", "HGROUP", "HR", "LI", "MAIN", "NAV", "OL",
  "P", "SECTION", "SUMMARY", "TABLE", "TD", "TH", "TR", "UL",
]);

const BLOCK_DISPLAY_VALUES = new Set([
  "block", "flex", "flow-root", "grid", "list-item", "table", "table-caption",
  "table-cell", "table-row",
]);

export interface TextBlock {
  element: Element;
  nodes: Text[];
}

function resolveStyleGetter(root: Element, override?: ComputedStyleGetter): ComputedStyleGetter | undefined {
  if (override) return override;
  const view = root.ownerDocument?.defaultView;
  return view?.getComputedStyle
    ? (element) => view.getComputedStyle(element as Element)
    : undefined;
}

export function isBlockElement(element: Element, getStyle?: ComputedStyleGetter): boolean {
  const display = getStyle?.(element)?.display;
  if (display) return BLOCK_DISPLAY_VALUES.has(display);
  return BLOCK_FALLBACK_TAGS.has(element.tagName);
}

/**
 * Collects translatable text nodes under `root`, excluding subtrees the frozen
 * engine blocks, grouped by their nearest block-level ancestor. Blocks are the
 * scheduling unit for visible-first translation.
 */
export function collectTextBlocks(
  root: Element,
  { getComputedStyle }: { getComputedStyle?: ComputedStyleGetter } = {},
): TextBlock[] {
  const doc = root.ownerDocument;
  if (!doc) return [];
  const getStyle = resolveStyleGetter(root, getComputedStyle);

  const blockedCache = new WeakMap<Element, boolean>();
  function isBlocked(element: Element): boolean {
    const cached = blockedCache.get(element);
    if (cached !== undefined) return cached;
    const own = elementBlocksTranslation(element, getStyle);
    const parent = element === root ? null : element.parentElement;
    const blocked = own || (parent ? isBlocked(parent) : false);
    blockedCache.set(element, blocked);
    return blocked;
  }

  function blockAncestor(element: Element): Element {
    let current: Element = element;
    while (current !== root) {
      if (isBlockElement(current, getStyle)) return current;
      current = current.parentElement ?? root;
    }
    return root;
  }

  const groups = new Map<Element, Text[]>();
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node as Text;
    if (!text.nodeValue || !text.nodeValue.trim()) continue;
    const parent = text.parentElement;
    if (!parent || isBlocked(parent)) continue;
    const block = blockAncestor(parent);
    const nodes = groups.get(block);
    if (nodes) nodes.push(text);
    else groups.set(block, [text]);
  }
  return [...groups.entries()].map(([element, nodes]) => ({ element, nodes }));
}
