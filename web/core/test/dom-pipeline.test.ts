// @vitest-environment happy-dom
import { expect, test, vi } from "vitest";
import { createDomTranslator } from "../src/dom/pipeline";
import { collectTextBlocks } from "../src/dom/blocks";
import type { SafeTranslator } from "../src/engine/safe-translation";

const GERMAN_A = "Während des Treffens bleibt die Tür geöffnet.";
const GERMAN_B = "Die Katze schläft auf dem Sofa.";
const ENGLISH = "This paragraph must remain exactly as written.";

function markerEngine(): SafeTranslator {
  const known = new Set([GERMAN_A, GERMAN_B]);
  return {
    async translateSegment(segment) {
      return known.has(segment) ? `⟦${segment}⟧` : segment;
    },
    async translateText(text) {
      return known.has(text) ? `⟦${text}⟧` : text;
    },
    async dispose() {},
  };
}

function setupPage(): void {
  document.body.innerHTML = `
    <main>
      <p id="a">${GERMAN_A}</p>
      <pre id="code">${GERMAN_A}</pre>
      <p id="en">${ENGLISH}</p>
    </main>
  `;
}

test("collectTextBlocks groups by block ancestor and skips blocked subtrees", () => {
  setupPage();
  const blocks = collectTextBlocks(document.body);
  const elements = blocks.map((block) => block.element.id ?? block.element.tagName);
  expect(elements).toContain("a");
  expect(elements).toContain("en");
  expect(elements).not.toContain("code");
});

test("pipeline translates, toggles, and picks up dynamic content", async () => {
  setupPage();
  const controller = createDomTranslator({ root: document.body, engine: markerEngine() });
  controller.start();
  await controller.whenIdle();

  const a = document.getElementById("a") as HTMLElement;
  const code = document.getElementById("code") as HTMLElement;
  const en = document.getElementById("en") as HTMLElement;
  expect(a.textContent).toBe(`⟦${GERMAN_A}⟧`);
  expect(code.textContent).toBe(GERMAN_A);
  expect(en.textContent).toBe(ENGLISH);

  controller.restoreOriginals();
  expect(a.textContent).toBe(GERMAN_A);
  controller.reapplyTranslations();
  expect(a.textContent).toBe(`⟦${GERMAN_A}⟧`);

  const late = document.createElement("p");
  late.id = "late";
  late.textContent = GERMAN_B;
  document.querySelector("main")?.appendChild(late);
  await vi.waitFor(async () => {
    await controller.whenIdle();
    expect(late.textContent).toBe(`⟦${GERMAN_B}⟧`);
  });

  const stats = controller.stats();
  expect(stats.translatedNodes).toBe(2);
  expect(stats.pendingBlocks).toBe(0);
  controller.stop();
});

test("pipeline translates whole inline blocks without gluing punctuation", async () => {
  const source = "Das Wort <x0>Trüffel</x0>, das wiederum von <x1>terrae tuber</x1> kommt.";
  document.body.innerHTML = `<main><p id="glue">Das Wort <a href="/wiki/Trüffel">Trüffel</a>, das wiederum von <i>terrae tuber</i> kommt.</p></main>`;
  const engine: SafeTranslator = {
    async translateSegment(segment) {
      return segment;
    },
    async translateText(text) {
      return text === source ? "Die Wort <x0>Trüffel</x0>, das wiederum von <x1>terrae tuber</x1> kommt." : text;
    },
    async dispose() {},
  };

  const controller = createDomTranslator({ root: document.body, engine, observeMutations: false });
  controller.start();
  await controller.whenIdle();

  const paragraph = document.getElementById("glue") as HTMLElement;
  expect(paragraph.textContent).toBe("Die Wort Trüffel, das wiederum von terrae tuber kommt.");
  expect(paragraph.querySelector("a")?.getAttribute("href")).toBe("/wiki/Trüffel");
  expect(paragraph.querySelector("i")?.textContent).toBe("terrae tuber");

  controller.restoreOriginals();
  expect(paragraph.textContent).toBe("Das Wort Trüffel, das wiederum von terrae tuber kommt.");
  controller.stop();
});

test("pipeline keeps inline element identity and translated placeholder text across toggles", async () => {
  const source = "Siehe <x0>dem Mann</x0>.";
  document.body.innerHTML = `<main><p id="p">Siehe <a id="link" href="/wiki/Mann">dem Mann</a>.</p></main>`;
  let clicks = 0;
  document.getElementById("link")?.addEventListener("click", (event) => {
    event.preventDefault();
    clicks += 1;
  });
  const originalLink = document.getElementById("link");
  const engine: SafeTranslator = {
    async translateSegment(segment) {
      return segment;
    },
    async translateText(text) {
      return text === source ? "Siehe <x0>die Mann</x0>." : text;
    },
    async dispose() {},
  };

  const controller = createDomTranslator({ root: document.body, engine, observeMutations: false });
  controller.start();
  await controller.whenIdle();

  expect(document.getElementById("link")).toBe(originalLink);
  expect(document.getElementById("link")?.textContent).toBe("die Mann");
  controller.restoreOriginals();
  expect(document.getElementById("link")).toBe(originalLink);
  expect(document.getElementById("link")?.textContent).toBe("dem Mann");
  document.getElementById("link")?.click();
  controller.reapplyTranslations();
  expect(document.getElementById("link")).toBe(originalLink);
  expect(document.getElementById("link")?.textContent).toBe("die Mann");
  document.getElementById("link")?.click();
  expect(clicks).toBe(2);
  expect(controller.stats().translatedNodes).toBe(3);
  controller.stop();
});

test("pipeline creates a detached difference layer without changing the live article", async () => {
  const source = "Siehe <x0>dem Mann</x0> heute.";
  document.body.innerHTML = `<main><p id="p">Siehe <a href="/wiki/Mann">dem Mann</a> heute.</p></main>`;
  const engine: SafeTranslator = {
    async translateSegment(segment) {
      return segment;
    },
    async translateText(text) {
      return text === source ? "Siehe <x0>die Mann</x0> heute." : text;
    },
    async dispose() {},
  };

  const controller = createDomTranslator({ root: document.querySelector("main")!, engine, observeMutations: false });
  controller.start();
  await controller.whenIdle();

  const difference = controller.createDifferenceClone();
  expect(difference).not.toBe(document.querySelector("main"));
  expect(Array.from(difference.querySelectorAll("del"), (node) => node.textContent)).toEqual(["dem Mann"]);
  expect(Array.from(difference.querySelectorAll("ins"), (node) => node.textContent)).toEqual(["die Mann"]);
  expect(difference.querySelector('ins a[href="/wiki/Mann"]')?.textContent).toBe("die Mann");
  expect(document.getElementById("p")?.textContent).toBe("Siehe die Mann heute.");
  controller.stop();
});

test("pipeline reports block lifecycle and marks changed translated runs", async () => {
  const source = "Siehe <x0>dem Mann</x0>.";
  document.body.innerHTML = `<main><p id="p">Siehe <a id="link" href="/wiki/Mann">dem Mann</a>.</p></main>`;
  let resolveTranslation: ((value: string) => void) | undefined;
  const states: string[] = [];
  const engine: SafeTranslator = {
    async translateSegment(segment) {
      return segment;
    },
    translateText(text) {
      if (text !== source) return Promise.resolve(text);
      return new Promise((resolve) => {
        resolveTranslation = resolve;
      });
    },
    async dispose() {},
  };

  const controller = createDomTranslator({
    root: document.querySelector("main")!,
    engine,
    markChanges: true,
    observeMutations: false,
    onBlockState: ({ state }) => states.push(state),
  });
  controller.start();
  await vi.waitFor(() => expect(resolveTranslation).toBeTypeOf("function"));
  expect(states).toEqual(["queued", "translating"]);

  resolveTranslation?.("Siehe <x0>die Mann</x0>.");
  await controller.whenIdle();
  expect(states).toEqual(["queued", "translating", "translated"]);
  expect(document.querySelector("#link[data-alman-change]")?.textContent).toBe("die Mann");

  controller.restoreOriginals();
  expect(document.querySelector("#link[data-alman-change]")).toBeNull();
  controller.reapplyTranslations();
  expect(document.querySelector("#link[data-alman-change]")?.textContent).toBe("die Mann");
  controller.stop();
});

test("pipeline can keep each block in the translating state for a visible minimum", async () => {
  vi.useFakeTimers();
  try {
    document.body.innerHTML = `<main><p>${GERMAN_A}</p></main>`;
    const states: string[] = [];
    const controller = createDomTranslator({
      root: document.querySelector("main")!,
      engine: markerEngine(),
      minimumTranslatingMs: 180,
      observeMutations: false,
      onBlockState: ({ state }) => states.push(state),
    });
    controller.start();
    await vi.advanceTimersByTimeAsync(179);
    expect(states).toEqual(["queued", "translating"]);

    await vi.advanceTimersByTimeAsync(1);
    await controller.whenIdle();
    expect(states).toEqual(["queued", "translating", "translated"]);
    controller.stop();
  } finally {
    vi.useRealTimers();
  }
});

test("pipeline isolates lifecycle callback failures", async () => {
  setupPage();
  const controller = createDomTranslator({
    root: document.body,
    engine: markerEngine(),
    observeMutations: false,
    onBlockState: () => { throw new Error("presentation failed"); },
  });
  controller.start();
  await controller.whenIdle();
  expect(document.getElementById("a")?.textContent).toBe(`⟦${GERMAN_A}⟧`);
  controller.stop();
});

test("pipeline leaves pending inline translations original after restoring originals", async () => {
  const source = "Siehe <x0>dem Mann</x0>.";
  document.body.innerHTML = `<main><p id="p">Siehe <a id="link" href="/wiki/Mann">dem Mann</a>.</p></main>`;
  let resolveTranslation: ((value: string) => void) | undefined;
  const engine: SafeTranslator = {
    async translateSegment(segment) {
      return segment;
    },
    translateText(text) {
      if (text !== source) return Promise.resolve(text);
      return new Promise((resolve) => {
        resolveTranslation = resolve;
      });
    },
    async dispose() {},
  };

  const controller = createDomTranslator({ root: document.body, engine, observeMutations: false });
  controller.start();
  await vi.waitFor(() => expect(resolveTranslation).toBeTypeOf("function"));
  controller.restoreOriginals();
  resolveTranslation?.("Siehe <x0>die Mann</x0>.");
  await controller.whenIdle();

  expect(document.getElementById("p")?.textContent).toBe("Siehe dem Mann.");
  controller.reapplyTranslations();
  expect(document.getElementById("p")?.textContent).toBe("Siehe die Mann.");
  controller.stop();
});

test("pipeline does not resurrect removed block children on toggles", async () => {
  const source = "Das ist <x0>wichtig</x0>.";
  document.body.innerHTML = `<main><p id="p">Das ist <a id="link" href="/wiki/Wichtig">wichtig</a>.</p></main>`;
  const engine: SafeTranslator = {
    async translateSegment(segment) {
      return segment;
    },
    async translateText(text) {
      return text === source ? "Das ist <x0>wichtig</x0> alman." : text;
    },
    async dispose() {},
  };

  const controller = createDomTranslator({ root: document.body, engine, observeMutations: false });
  controller.start();
  await controller.whenIdle();

  document.getElementById("link")?.remove();
  controller.restoreOriginals();
  expect(document.getElementById("link")).toBeNull();
  controller.reapplyTranslations();
  expect(document.getElementById("link")).toBeNull();
  controller.stop();
});

test("pipeline does not resurrect removed placeholders after translated reordering", async () => {
  const source = "Ich sehe <x0>dem Mann</x0>.";
  document.body.innerHTML = `<main><p id="p">Ich sehe <a id="link" href="/wiki/Mann">dem Mann</a>.</p></main>`;
  const engine: SafeTranslator = {
    async translateSegment(segment) {
      return segment;
    },
    async translateText(text) {
      return text === source ? "<x0>die Mann</x0> sehe ich." : text;
    },
    async dispose() {},
  };

  const controller = createDomTranslator({ root: document.body, engine, observeMutations: false });
  controller.start();
  await controller.whenIdle();

  document.getElementById("link")?.remove();
  controller.restoreOriginals();
  expect(document.getElementById("link")).toBeNull();
  controller.stop();
});

test("pipeline treats inline-block descendants as inline placeholders", async () => {
  const source = "Das ist <x0>wichtig</x0>.";
  document.body.innerHTML = `<main><p id="p">Das ist <span id="inline" style="display:inline-block">wichtig</span>.</p></main>`;
  const engine: SafeTranslator = {
    async translateSegment(segment) {
      return segment;
    },
    async translateText(text) {
      return text === source ? "Das ist <x0>wichtig</x0> alman." : text;
    },
    async dispose() {},
  };

  const controller = createDomTranslator({ root: document.body, engine, observeMutations: false });
  controller.start();
  await controller.whenIdle();

  expect(document.getElementById("p")?.textContent).toBe("Das ist wichtig alman.");
  controller.stop();
});

test("pipeline preserves dynamic block children across toggles", async () => {
  const source = "Das ist <x0>wichtig</x0>.";
  document.body.innerHTML = `<main><p id="p">Das ist <a id="link" href="/wiki/Wichtig">wichtig</a>.</p></main>`;
  const engine: SafeTranslator = {
    async translateSegment(segment) {
      return segment;
    },
    async translateText(text) {
      return text === source ? "Das ist <x0>wichtig</x0> alman." : text;
    },
    async dispose() {},
  };

  const controller = createDomTranslator({ root: document.body, engine, observeMutations: false });
  controller.start();
  await controller.whenIdle();

  const extra = document.createElement("span");
  extra.id = "extra";
  extra.textContent = "NEU";
  document.getElementById("p")?.insertBefore(extra, document.getElementById("link"));
  controller.restoreOriginals();
  expect(document.getElementById("p")?.childNodes[1]).toBe(extra);
  controller.reapplyTranslations();
  expect(document.getElementById("p")?.childNodes[1]).toBe(extra);
  controller.stop();
});

test("pipeline preserves dynamic children added while block translation is pending", async () => {
  const source = "Das ist <x0>wichtig</x0>.";
  document.body.innerHTML = `<main><p id="p">Das ist <a id="link" href="/wiki/Wichtig">wichtig</a>.</p></main>`;
  let resolveTranslation: ((value: string) => void) | undefined;
  const engine: SafeTranslator = {
    async translateSegment(segment) {
      return segment;
    },
    translateText(text) {
      if (text !== source) return Promise.resolve(text);
      return new Promise((resolve) => {
        resolveTranslation = resolve;
      });
    },
    async dispose() {},
  };

  const controller = createDomTranslator({ root: document.body, engine, observeMutations: false });
  controller.start();
  await vi.waitFor(() => expect(resolveTranslation).toBeTypeOf("function"));
  const extra = document.createElement("span");
  extra.id = "extra";
  extra.textContent = "NEU";
  document.getElementById("p")?.insertBefore(extra, document.getElementById("link"));
  resolveTranslation?.("Das ist <x0>wichtig</x0> alman.");
  await controller.whenIdle();

  expect(document.getElementById("extra")?.textContent).toBe("NEU");
  expect(document.getElementById("p")?.childNodes[1]).toBe(extra);
  controller.stop();
});

test("pipeline preserves queued nested blocks", async () => {
  const parent = "Die Eltern lesen.";
  const child = "Die Kinder schlafen.";
  document.body.innerHTML = `<main><ul><li id="parent">${parent}<ul><li id="child">${child}</li></ul></li></ul></main>`;
  const engine: SafeTranslator = {
    async translateSegment(segment) {
      return segment;
    },
    async translateText(text) {
      if (text === parent) return "Die Eltern lesen alman.";
      if (text === child) return "Die Kinder schlafen alman.";
      return text;
    },
    async dispose() {},
  };

  const controller = createDomTranslator({ root: document.body, engine, observeMutations: false });
  controller.start();
  await controller.whenIdle();

  expect(document.getElementById("parent")?.childNodes[0]?.nodeValue).toBe("Die Eltern lesen alman.");
  expect(document.getElementById("child")?.textContent).toBe("Die Kinder schlafen alman.");
  controller.restoreOriginals();
  expect(document.getElementById("parent")?.childNodes[0]?.nodeValue).toBe(parent);
  expect(document.getElementById("child")?.textContent).toBe(child);
  controller.stop();
});

test("translateAll drains off-screen work beyond the idle budget", async () => {
  class IdleIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "0px";
    readonly scrollMargin = "0px";
    readonly thresholds: readonly number[] = [];
    disconnect(): void {}
    observe(): void {}
    takeRecords(): IntersectionObserverEntry[] { return []; }
    unobserve(): void {}
  }
  vi.stubGlobal("IntersectionObserver", IdleIntersectionObserver);
  try {
    document.body.innerHTML = `<main><p>${GERMAN_A}</p><p>${GERMAN_B}</p></main>`;
    const controller = createDomTranslator({
      root: document.querySelector("main")!,
      engine: markerEngine(),
      idleBudgetSegments: 0,
      observeMutations: false,
    });
    controller.start();
    await controller.whenIdle();
    expect(controller.stats().pendingBlocks).toBe(2);

    controller.translateAll();
    await controller.whenIdle();
    expect(controller.stats().pendingBlocks).toBe(0);
    expect(document.querySelector("main")?.textContent).toContain(`⟦${GERMAN_A}⟧`);
    expect(document.querySelector("main")?.textContent).toContain(`⟦${GERMAN_B}⟧`);
    controller.stop();
  } finally {
    vi.unstubAllGlobals();
  }
});

test("restoring after stop leaves the page in its original state", async () => {
  setupPage();
  const controller = createDomTranslator({ root: document.body, engine: markerEngine(), observeMutations: false });
  controller.start();
  await controller.whenIdle();
  controller.stop();
  controller.restoreOriginals();
  expect(document.getElementById("a")?.textContent).toBe(GERMAN_A);
  expect(document.getElementById("en")?.textContent).toBe(ENGLISH);
});
