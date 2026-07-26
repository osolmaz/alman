import type { SafeTranslator } from "../engine/safe-translation";
import { collectTextBlocks, type TextBlock } from "./blocks";

export interface DomTranslationStats {
  totalBlocks: number;
  translatedBlocks: number;
  pendingBlocks: number;
  /** Pending blocks in or near the viewport — the user-perceived backlog. */
  pendingVisibleBlocks: number;
  translatedNodes: number;
}

export interface DomTranslatorOptions {
  root: Element;
  engine: SafeTranslator;
  onStats?: (stats: DomTranslationStats) => void;
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
  /** Re-apply stored translations without re-running inference. */
  reapplyTranslations(): void;
  stats(): DomTranslationStats;
  /** Resolves when the work queue is fully drained (primarily for tests). */
  whenIdle(): Promise<void>;
}

interface NodeRecord {
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
  observeMutations = true,
  idleBudgetSegments = 800,
}: DomTranslatorOptions): DomTranslatorController {
  const records = new Map<Text, NodeRecord>();
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

  function stats(): DomTranslationStats {
    return {
      totalBlocks: items.length,
      translatedBlocks,
      pendingBlocks: items.filter((item) => !item.done).length,
      pendingVisibleBlocks: items.filter((item) => !item.done && item.visible).length,
      translatedNodes: records.size,
    };
  }

  function enqueueBlocks(blocks: TextBlock[]): void {
    for (const block of blocks) {
      if (queued.has(block.element)) continue;
      queued.add(block.element);
      const item: WorkItem = { block, visible: intersection === null, done: false };
      items.push(item);
      intersection?.observe(block.element);
    }
    drain();
  }

  async function translateItem(item: WorkItem): Promise<void> {
    item.done = true;
    let touched = false;
    for (const node of item.block.nodes) {
      if (!running) return;
      if (!node.isConnected) continue;
      const original = records.get(node)?.original ?? node.nodeValue;
      if (!original) continue;
      const translated = await engine.translateText(original);
      if (translated === original) continue;
      records.set(node, { original, translated });
      if (!showingOriginals) node.nodeValue = translated;
      touched = true;
    }
    if (touched) translatedBlocks += 1;
    intersection?.unobserve(item.block.element);
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
      const run = () =>
        translateItem(item)
          .catch(() => {})
          .then(() => {
            if (charge) idleBudgetLeft -= item.block.nodes.length;
            emitStats();
            step();
          });
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
      for (const [node, record] of records) {
        if (node.isConnected) node.nodeValue = record.original;
      }
    },
    reapplyTranslations() {
      showingOriginals = false;
      for (const [node, record] of records) {
        if (node.isConnected) node.nodeValue = record.translated;
      }
      drain();
    },
    stats,
    whenIdle() {
      if (!draining) return Promise.resolve();
      return new Promise((resolve) => idleWaiters.push(resolve));
    },
  };
}
