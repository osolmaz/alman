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
