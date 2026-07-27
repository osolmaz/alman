import type { DomTranslationBlockEvent } from "@alman/core";

interface RevealObserver {
  observe(element: Element): void;
  unobserve(element: Element): void;
  disconnect(): void;
}

export interface TranslationRevealOptions {
  root: Element;
  applyTranslation: (element: Element) => boolean;
  onReveal: (element: Element) => void;
  onPendingChange?: (pending: number) => void;
  isInViewport?: (element: Element) => boolean;
  createObserver?: (callback: IntersectionObserverCallback) => RevealObserver;
}

export interface TranslationRevealController {
  handleBlockState(event: DomTranslationBlockEvent): void;
  setPaused(paused: boolean): void;
  revealVisible(): void;
  pendingCount(): number;
  destroy(): void;
}

function defaultViewportCheck(root: Element): (element: Element) => boolean {
  const view = root.ownerDocument.defaultView;
  if (!view) return () => true;
  return (element) => {
    const rect = element.getBoundingClientRect();
    return rect.bottom >= 0 && rect.top <= view.innerHeight && rect.right >= 0 && rect.left <= view.innerWidth;
  };
}

function defaultObserver(root: Element, callback: IntersectionObserverCallback): RevealObserver | null {
  const Observer = root.ownerDocument.defaultView?.IntersectionObserver;
  if (!Observer) return null;
  return new Observer(callback, { rootMargin: "12% 0px" });
}

/**
 * Keeps completed translations visually pending until their live block reaches
 * the viewport. Translation records remain owned by the shared DOM controller.
 */
export function createTranslationRevealController({
  root,
  applyTranslation,
  onReveal,
  onPendingChange,
  isInViewport = defaultViewportCheck(root),
  createObserver,
}: TranslationRevealOptions): TranslationRevealController {
  const ready = new Set<Element>();
  const visible = new Set<Element>();
  let paused = false;

  const notifyPending = () => {
    try {
      onPendingChange?.(ready.size);
    } catch {
      // Presentation callbacks cannot interrupt reveal state.
    }
  };

  const reveal = (element: Element): void => {
    if (paused || !ready.has(element) || (!visible.has(element) && !isInViewport(element))) return;
    let applied = false;
    try {
      applied = applyTranslation(element);
    } catch {
      return;
    }
    if (!applied) return;
    ready.delete(element);
    observer?.unobserve(element);
    element.setAttribute("data-alman-state", "translated");
    try {
      onReveal(element);
    } catch {
      // The translation is already applied and must remain usable.
    }
    notifyPending();
  };

  const intersectionCallback: IntersectionObserverCallback = (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        visible.add(entry.target);
        reveal(entry.target);
      } else {
        visible.delete(entry.target);
      }
    }
  };
  const observer = createObserver
    ? createObserver(intersectionCallback)
    : defaultObserver(root, intersectionCallback);

  return {
    handleBlockState({ element, state }) {
      if (state === "queued") {
        element.setAttribute("data-alman-state", "queued");
        observer?.observe(element);
        return;
      }
      if (state === "translated") {
        ready.add(element);
        element.setAttribute("data-alman-state", "ready");
        notifyPending();
        if (!observer || visible.has(element) || isInViewport(element)) reveal(element);
        return;
      }
      element.setAttribute("data-alman-state", state);
      if (state === "unchanged" || state === "failed") {
        ready.delete(element);
        visible.delete(element);
        observer?.unobserve(element);
        notifyPending();
      }
    },
    setPaused(value) {
      paused = value;
      root.toggleAttribute("data-alman-reveal-paused", paused);
      if (!paused) {
        for (const element of [...ready]) reveal(element);
      }
    },
    revealVisible() {
      for (const element of [...ready]) reveal(element);
    },
    pendingCount() {
      return ready.size;
    },
    destroy() {
      observer?.disconnect();
      root.removeAttribute("data-alman-reveal-paused");
      ready.clear();
      visible.clear();
      notifyPending();
    },
  };
}
