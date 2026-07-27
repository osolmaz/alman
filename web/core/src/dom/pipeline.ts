import type { SafeTranslator } from "../engine/safe-translation";
import {
  createBlockTranslationPlan,
  createTextDifferenceNodes,
  translateBlockPlan,
  type TextUpdate,
} from "./block-plan";
import { collectTextBlocks, type TextBlock } from "./blocks";

export interface DomTranslationStats {
  totalBlocks: number;
  translatedBlocks: number;
  pendingBlocks: number;
  /** Pending blocks in or near the viewport. */
  pendingVisibleBlocks: number;
  translatedNodes: number;
}

export type DomTranslationBlockState = "queued" | "translating" | "translated" | "unchanged" | "failed";

export interface DomTranslationBlockEvent {
  element: Element;
  state: DomTranslationBlockState;
}

export interface DomTranslatorOptions {
  root: Element;
  engine: SafeTranslator;
  onStats?: (stats: DomTranslationStats) => void;
  /** Presentation-neutral lifecycle notification for each scheduled block. */
  onBlockState?: (event: DomTranslationBlockEvent) => void;
  /** Mark inserted words and changed inline elements for an opt-in UI effect. */
  markChanges?: boolean;
  /** Store completed translations until `applyTranslation` is called. */
  deferApplication?: boolean;
  /** Observe DOM additions and translate them as they appear. */
  observeMutations?: boolean;
  /**
   * Soft cap on off-screen text nodes translated during idle time. Blocks past
   * the budget still translate when scrolled toward (visible tier).
   */
  idleBudgetSegments?: number;
}

export interface DomTranslatorController {
  start(): void;
  stop(): void;
  /** Swap every translated node back to its original German text. */
  restoreOriginals(): void;
  /** Re-apply translations that have already been applied once. */
  reapplyTranslations(): void;
  /** Apply one completed block without re-running inference. */
  applyTranslation(element: Element): boolean;
  /** Prioritize every pending block, including content outside the viewport. */
  translateAll(): void;
  /** Build a detached semantic comparison without mutating the live page. */
  createDifferenceClone(): Element;
  stats(): DomTranslationStats;
  /** Resolves when the work queue is fully drained (primarily for tests). */
  whenIdle(): Promise<void>;
}

interface BlockRecord {
  originalChildren: Node[];
  translatedChildren: Node[];
  differenceChildren: Node[];
  translatedTextNodes: Text[];
  changedElements: Element[];
  textUpdates: TextUpdate[];
}

interface TextRecord {
  original: string;
  translated: string;
}

interface WorkItem {
  block: TextBlock;
  visible: boolean;
  done: boolean;
}

export function createDomTranslator({
  root,
  engine,
  onStats,
  onBlockState,
  markChanges = false,
  deferApplication = false,
  observeMutations = true,
  idleBudgetSegments = 800,
}: DomTranslatorOptions): DomTranslatorController {
  const records = new Map<Element, BlockRecord>();
  const textRecords = new Map<Text, TextRecord>();
  const appliedBlocks = new Set<Element>();
  const queued = new Set<Element>();
  const items: WorkItem[] = [];
  let translatedBlocks = 0;
  let idleBudgetLeft = idleBudgetSegments;
  let running = false;
  let showingOriginals = false;
  let draining = false;
  let idleWaiters: Array<() => void> = [];
  let intersection: IntersectionObserver | null = null;
  let mutations: MutationObserver | null = null;
  const ignoredMutationTargets = new WeakSet<Element>();

  const view = root.ownerDocument?.defaultView;
  // The timeout forces progress in idle-starved pages (background tabs,
  // headless) where requestIdleCallback may otherwise never fire.
  const scheduleIdle: (callback: () => void) => void =
    view && "requestIdleCallback" in view
      ? (callback) => (view as Window).requestIdleCallback(() => callback(), { timeout: 1_000 })
      : (callback) => setTimeout(callback, 0);

  function emitStats(): void {
    onStats?.(stats());
  }

  function emitBlockState(element: Element, state: DomTranslationBlockState): void {
    try {
      onBlockState?.({ element, state });
    } catch {
      // Presentation callbacks cannot interrupt translation.
    }
  }

  function stats(): DomTranslationStats {
    const translatedTextNodes = new Set<Text>(textRecords.keys());
    for (const record of records.values()) {
      for (const node of record.translatedTextNodes) translatedTextNodes.add(node);
    }
    return {
      totalBlocks: items.length,
      translatedBlocks,
      pendingBlocks: items.filter((item) => !item.done).length,
      pendingVisibleBlocks: items.filter((item) => !item.done && item.visible).length,
      translatedNodes: translatedTextNodes.size,
    };
  }

  function enqueueBlocks(blocks: TextBlock[]): void {
    for (const block of blocks) {
      if (queued.has(block.element)) continue;
      queued.add(block.element);
      const item: WorkItem = { block, visible: intersection === null, done: false };
      items.push(item);
      emitBlockState(block.element, "queued");
      intersection?.observe(block.element);
    }
    drain();
  }

  function pathFromRoot(node: Node): number[] | null {
    const path: number[] = [];
    let current: Node | null = node;
    while (current && current !== root) {
      const parent: Node | null = current.parentNode;
      if (!parent) return null;
      const index = Array.prototype.indexOf.call(parent.childNodes, current) as number;
      if (index < 0) return null;
      path.unshift(index);
      current = parent;
    }
    return current === root ? path : null;
  }

  function nodeAtPath(start: Node, path: number[]): Node | null {
    let current: Node | null = start;
    for (const index of path) current = current?.childNodes[index] ?? null;
    return current;
  }

  function replaceBlockChildren(element: Element, children: Node[]): void {
    ignoredMutationTargets.add(element);
    element.replaceChildren(...children);
    setTimeout(() => ignoredMutationTargets.delete(element), 0);
  }

  function replaceRecordedBlockChildren(element: Element, record: BlockRecord, children: Node[]): void {
    const currentChildren = Array.from(element.childNodes);
    const current = new Set<Node>(currentChildren);
    const originalSet = new Set(record.originalChildren);
    const translatedSet = new Set(record.translatedChildren);
    const otherChildren = children === record.originalChildren ? record.translatedChildren : record.originalChildren;
    const targetChildren = children.filter((child, index) => {
      const sharedLiveNode = originalSet.has(child) && translatedSet.has(child);
      if (sharedLiveNode) return current.has(child);
      const counterpart = otherChildren[index];
      return current.has(child) || counterpart === undefined || current.has(counterpart);
    });
    const known = new Set([...record.originalChildren, ...record.translatedChildren]);
    const merged = [...targetChildren];
    for (const [index, child] of currentChildren.entries()) {
      if (known.has(child)) continue;
      merged.splice(Math.min(index, merged.length), 0, child);
    }
    replaceBlockChildren(element, merged);
  }

  function recordTextUpdates(updates: TextUpdate[], apply: boolean): void {
    for (const update of updates) {
      if (!update.applyDirectly || update.translated === update.original) continue;
      textRecords.set(update.node, update);
      if (apply && update.node.isConnected && update.node.nodeValue === update.original) {
        update.node.nodeValue = update.translated;
      }
    }
  }

  function markChangedElements(elements: Element[], changed: boolean): void {
    for (const element of elements) {
      if (changed) element.setAttribute("data-alman-change", "");
      else element.removeAttribute("data-alman-change");
    }
  }

  function applyStoredTranslation(element: Element): boolean {
    const record = records.get(element);
    if (!record) return false;
    appliedBlocks.add(element);
    if (showingOriginals || !element.isConnected) return true;
    replaceRecordedBlockChildren(element, record, record.translatedChildren);
    markChangedElements(record.changedElements, true);
    recordTextUpdates(record.textUpdates, true);
    return true;
  }

  async function translateItem(item: WorkItem): Promise<"translated" | "unchanged" | "failed"> {
    item.done = true;
    if (!item.block.element.isConnected) return "unchanged";
    if (records.has(item.block.element)) return "unchanged";
    const plan = createBlockTranslationPlan(item.block.element, {
      getComputedStyle: (element) => item.block.element.ownerDocument.defaultView?.getComputedStyle(element as Element),
    });
    if (!plan) return "unchanged";
    const originalChildren = Array.from(item.block.element.childNodes);
    const result = await translateBlockPlan(plan, engine, { markChanges });
    if (!running || !item.block.element.isConnected) return "unchanged";
    if (!result.translated) {
      intersection?.unobserve(item.block.element);
      return result.failure ? "failed" : "unchanged";
    }
    recordTextUpdates(result.textUpdates, false);
    const record: BlockRecord = {
      originalChildren,
      translatedChildren: result.translatedChildren,
      differenceChildren: result.differenceChildren,
      translatedTextNodes: item.block.nodes,
      changedElements: result.changedElements,
      textUpdates: result.textUpdates,
    };
    records.set(item.block.element, record);
    if (!deferApplication) applyStoredTranslation(item.block.element);
    translatedBlocks += 1;
    intersection?.unobserve(item.block.element);
    return "translated";
  }

  function nextItem(): WorkItem | undefined {
    const visible = items.find((item) => !item.done && item.visible);
    if (visible) return visible;
    if (idleBudgetLeft <= 0) return undefined;
    return items.find((item) => !item.done);
  }

  function drain(): void {
    if (draining || !running) return;
    draining = true;
    const step = () => {
      if (!running) {
        draining = false;
        settleIdle();
        return;
      }
      const item = nextItem();
      if (!item) {
        draining = false;
        settleIdle();
        return;
      }
      const charge = !item.visible;
      const run = () => {
        emitBlockState(item.block.element, "translating");
        return translateItem(item)
          .then((state) => emitBlockState(item.block.element, state))
          .catch(() => emitBlockState(item.block.element, "failed"))
          .then(() => {
            if (charge) idleBudgetLeft -= item.block.nodes.length;
            emitStats();
            step();
          });
      };
      if (charge) scheduleIdle(run);
      else run();
    };
    step();
  }

  function settleIdle(): void {
    const waiters = idleWaiters.splice(0);
    for (const waiter of waiters) waiter();
  }

  function observe(): void {
    if (typeof IntersectionObserver !== "undefined") {
      intersection = new IntersectionObserver(
        (entries) => {
          let changed = false;
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const item = items.find((candidate) => candidate.block.element === entry.target);
            if (item && !item.visible) {
              item.visible = true;
              changed = true;
            }
          }
          if (changed) drain();
        },
        { rootMargin: "200% 0px" },
      );
    }
    if (observeMutations && typeof MutationObserver !== "undefined") {
      mutations = new MutationObserver((entries) => {
        const added: Element[] = [];
        for (const entry of entries) {
          if (entry.target instanceof Element && ignoredMutationTargets.has(entry.target)) continue;
          for (const node of entry.addedNodes) {
            if (node.nodeType === 1) added.push(node as Element);
          }
        }
        if (added.length === 0) return;
        for (const element of added) {
          if (!element.isConnected) continue;
          enqueueBlocks(collectTextBlocks(element));
        }
      });
      mutations.observe(root, { childList: true, subtree: true });
    }
  }

  return {
    start() {
      if (running) return;
      running = true;
      observe();
      enqueueBlocks(collectTextBlocks(root));
      emitStats();
    },
    stop() {
      running = false;
      intersection?.disconnect();
      mutations?.disconnect();
      intersection = null;
      mutations = null;
      settleIdle();
    },
    restoreOriginals() {
      showingOriginals = true;
      for (const element of appliedBlocks) {
        const record = records.get(element);
        if (record) {
          markChangedElements(record.changedElements, false);
          if (element.isConnected) replaceRecordedBlockChildren(element, record, record.originalChildren);
          for (const update of record.textUpdates) {
            if (update.applyDirectly && update.node.isConnected && update.node.nodeValue === update.translated) {
              update.node.nodeValue = update.original;
            }
          }
        }
      }
    },
    reapplyTranslations() {
      showingOriginals = false;
      for (const element of appliedBlocks) applyStoredTranslation(element);
      drain();
    },
    applyTranslation(element) {
      return applyStoredTranslation(element);
    },
    translateAll() {
      for (const item of items) {
        if (!item.done) item.visible = true;
      }
      drain();
      emitStats();
    },
    createDifferenceClone() {
      const clone = root.cloneNode(true) as Element;
      for (const [element, record] of records) {
        const path = pathFromRoot(element);
        if (!path) continue;
        const clonedElement = nodeAtPath(clone, path);
        if (clonedElement?.nodeType !== Node.ELEMENT_NODE) continue;
        (clonedElement as Element).replaceChildren(...record.differenceChildren.map((child) => child.cloneNode(true)));
      }
      const recordedElements = Array.from(records.keys());
      for (const [node, record] of textRecords) {
        if (recordedElements.some((element) => element.contains(node))) continue;
        const path = pathFromRoot(node);
        if (!path) continue;
        const clonedNode = nodeAtPath(clone, path);
        const parent = clonedNode?.parentNode;
        if (!clonedNode || !parent) continue;
        for (const child of createTextDifferenceNodes(root.ownerDocument, record.original, record.translated)) {
          parent.insertBefore(child, clonedNode);
        }
        parent.removeChild(clonedNode);
      }
      return clone;
    },
    stats,
    whenIdle() {
      if (!draining) return Promise.resolve();
      return new Promise((resolve) => idleWaiters.push(resolve));
    },
  };
}
