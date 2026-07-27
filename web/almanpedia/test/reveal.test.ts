// @vitest-environment happy-dom
import { beforeEach, expect, test, vi } from "vitest";
import { createTranslationRevealController } from "../src/ui/reveal";

interface FakeObserver {
  callback: IntersectionObserverCallback;
  observed: Set<Element>;
  unobserved: Set<Element>;
}

function observerFactory(holder: { current?: FakeObserver }) {
  return (callback: IntersectionObserverCallback) => {
    const fake: FakeObserver = { callback, observed: new Set(), unobserved: new Set() };
    holder.current = fake;
    return {
      observe: (element: Element) => fake.observed.add(element),
      unobserve: (element: Element) => fake.unobserved.add(element),
      disconnect: () => fake.observed.clear(),
    };
  };
}

function intersect(fake: FakeObserver, element: Element, isIntersecting: boolean): void {
  fake.callback([{ target: element, isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);
}

beforeEach(() => {
  document.body.innerHTML = `<article><p id="a">A</p><p id="b">B</p></article>`;
});

test("completed blocks stay pending until they enter the viewport", () => {
  const holder: { current?: FakeObserver } = {};
  const applied: Element[] = [];
  const revealed: Element[] = [];
  const pending: number[] = [];
  const root = document.querySelector("article")!;
  const paragraph = document.getElementById("a")!;
  const controller = createTranslationRevealController({
    root,
    applyTranslation: (element) => { applied.push(element); return true; },
    onReveal: (element) => revealed.push(element),
    onPendingChange: (count) => pending.push(count),
    isInViewport: () => false,
    createObserver: observerFactory(holder),
  });

  controller.handleBlockState({ element: paragraph, state: "queued" });
  controller.handleBlockState({ element: paragraph, state: "translated" });
  expect(paragraph.dataset.almanState).toBe("ready");
  expect(controller.pendingCount()).toBe(1);
  expect(applied).toEqual([]);

  intersect(holder.current!, paragraph, true);
  expect(paragraph.dataset.almanState).toBe("translated");
  expect(applied).toEqual([paragraph]);
  expect(revealed).toEqual([paragraph]);
  expect(controller.pendingCount()).toBe(0);
  expect(holder.current?.unobserved.has(paragraph)).toBe(true);
  expect(pending).toEqual([1, 0]);

  intersect(holder.current!, paragraph, true);
  expect(applied).toEqual([paragraph]);
  controller.destroy();
});

test("pause holds visible translations until the Alman view resumes", () => {
  const holder: { current?: FakeObserver } = {};
  const apply = vi.fn(() => true);
  const root = document.querySelector("article")!;
  const paragraph = document.getElementById("b")!;
  const controller = createTranslationRevealController({
    root,
    applyTranslation: apply,
    onReveal: () => {},
    isInViewport: () => false,
    createObserver: observerFactory(holder),
  });

  controller.handleBlockState({ element: paragraph, state: "queued" });
  intersect(holder.current!, paragraph, true);
  controller.setPaused(true);
  controller.handleBlockState({ element: paragraph, state: "translated" });
  expect(root.hasAttribute("data-alman-reveal-paused")).toBe(true);
  expect(paragraph.dataset.almanState).toBe("ready");
  expect(apply).not.toHaveBeenCalled();

  controller.setPaused(false);
  expect(root.hasAttribute("data-alman-reveal-paused")).toBe(false);
  expect(apply).toHaveBeenCalledOnce();
  expect(paragraph.dataset.almanState).toBe("translated");
  controller.destroy();
});

test("unchanged and failed blocks stop waiting for a reveal", () => {
  const holder: { current?: FakeObserver } = {};
  const root = document.querySelector("article")!;
  const paragraph = document.getElementById("a")!;
  const controller = createTranslationRevealController({
    root,
    applyTranslation: () => true,
    onReveal: () => {},
    isInViewport: () => false,
    createObserver: observerFactory(holder),
  });

  controller.handleBlockState({ element: paragraph, state: "queued" });
  controller.handleBlockState({ element: paragraph, state: "unchanged" });
  expect(paragraph.dataset.almanState).toBe("unchanged");
  expect(controller.pendingCount()).toBe(0);
  expect(holder.current?.unobserved.has(paragraph)).toBe(true);
  controller.destroy();
});
