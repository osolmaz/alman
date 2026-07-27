// @vitest-environment happy-dom
import { expect, test } from "vitest";
import { createBlockTranslationPlan, createTextDifferenceNodes, translateBlockPlan } from "../src/dom/block-plan";
import type { SafeTranslator } from "../src/engine/safe-translation";

function applyPlaceholderUpdates(updates: Array<{ node: Text; translated: string }>): void {
  for (const update of updates) update.node.nodeValue = update.translated;
}

test("difference nodes separate adjacent removed and inserted words", () => {
  const paragraph = document.createElement("p");
  paragraph.append(...createTextDifferenceNodes(document, "im Jahr", "in die Jahr"));

  expect(paragraph.textContent).toBe("im in die Jahr");
  expect(paragraph.querySelector("del")?.textContent).toBe("im");
  expect(Array.from(paragraph.querySelectorAll("ins"), (node) => node.textContent)).toEqual(["in", "die "]);
  expect(paragraph.querySelector("del")?.nextSibling?.nodeValue).toBe(" ");
});

function translator(map: Record<string, string>): SafeTranslator {
  return {
    async translateSegment(segment) {
      return map[segment] ?? segment;
    },
    async translateText(text) {
      return map[text] ?? text;
    },
    async dispose() {},
  };
}

test("block plans preserve inline punctuation while restoring link and italic nodes", async () => {
  document.body.innerHTML = `
    <p id="p">dem Wort für <a href="/wiki/Trüffel">Trüffel</a>, das wiederum von <i>terrae tuber</i> kommt.</p>
  `;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const plan = createBlockTranslationPlan(paragraph);
  expect(plan?.source).toBe("dem Wort für <x0>Trüffel</x0>, das wiederum von <x1>terrae tuber</x1> kommt.");

  const result = await translateBlockPlan(
    plan!,
    translator({
      [plan!.source]: "die Wort für <x0>Trüffelchen</x0>, das wiederum von <x1>terrae tuber</x1> kommt.",
    }),
  );

  applyPlaceholderUpdates(result.placeholderTextUpdates);
  paragraph.replaceChildren(...result.translatedChildren);
  expect(paragraph.textContent).toBe("die Wort für Trüffelchen, das wiederum von terrae tuber kommt.");
  expect(paragraph.querySelector("a")?.getAttribute("href")).toBe("/wiki/Trüffel");
  expect(paragraph.querySelector("i")?.textContent).toBe("terrae tuber");
  expect(paragraph.querySelector("[data-alman-change]")).toBeNull();
  expect(result.changedElements).toEqual([]);
});

test("block plans build a semantic word diff while preserving inline links", async () => {
  document.body.innerHTML = `<p id="p">dem Wort für <a href="/wiki/Trüffel">Trüffel</a>.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const plan = createBlockTranslationPlan(paragraph)!;
  const result = await translateBlockPlan(
    plan,
    translator({ [plan.source]: "die Wort für <x0>Trüffelchen</x0>." }),
    { markChanges: true },
  );

  const difference = paragraph.cloneNode(false) as HTMLParagraphElement;
  difference.append(...result.differenceChildren.map((child) => child.cloneNode(true)));

  expect(Array.from(difference.querySelectorAll("del"), (node) => node.textContent)).toEqual(["dem", "Trüffel"]);
  expect(Array.from(difference.querySelectorAll("ins"), (node) => node.textContent)).toEqual(["die", "Trüffelchen"]);
  expect(difference.querySelector('ins a[href="/wiki/Trüffel"]')?.textContent).toBe("Trüffelchen");
  expect(difference.textContent).toBe("dem die Wort für Trüffel Trüffelchen.");

  const translated = document.createElement("p");
  translated.append(...result.translatedChildren.map((child) => child.cloneNode(true)));
  expect(Array.from(translated.querySelectorAll("[data-alman-change]"), (node) => node.textContent)).toEqual(["die"]);
  expect(result.changedElements).toEqual([paragraph.querySelector("a")]);
  expect(paragraph.innerHTML).toBe('dem Wort für <a href="/wiki/Trüffel">Trüffel</a>.');
});

test("block plans keep comment anchors as opaque placeholders", async () => {
  document.body.innerHTML = `<p id="p">Hallo <!--anchor-->Welt.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const comment = Array.from(paragraph.childNodes).find((node) => node.nodeType === Node.COMMENT_NODE);
  const plan = createBlockTranslationPlan(paragraph)!;

  expect(plan.source).toBe("Hallo <x0></x0>Welt.");
  const result = await translateBlockPlan(plan, translator({ [plan.source]: "Hallo <x0></x0>Welt alman." }));
  paragraph.replaceChildren(...result.translatedChildren);
  expect(Array.from(paragraph.childNodes)).toContain(comment);
  expect(paragraph.textContent).toBe("Hallo Welt alman.");
});

test("block plans keep structural descendants as opaque placeholders", async () => {
  document.body.innerHTML = `<li id="item">Elterntext<ul><li>Kindtext</li></ul><img src="/x.png" alt="x"></li>`;
  const item = document.getElementById("item") as HTMLLIElement;
  const plan = createBlockTranslationPlan(item)!;
  expect(plan.source).toBe("Elterntext<x0></x0><x1></x1>");

  const result = await translateBlockPlan(plan, translator({ [plan.source]: "Elterntext alman <x0></x0><x1></x1>" }));
  applyPlaceholderUpdates(result.placeholderTextUpdates);
  item.replaceChildren(...result.translatedChildren);

  expect(item.querySelector("ul li")?.textContent).toBe("Kindtext");
  expect(item.querySelector("img")?.getAttribute("src")).toBe("/x.png");
  expect(item.textContent).toContain("Elterntext alman");
});

test("standard inline edit tags remain translatable placeholders", async () => {
  document.body.innerHTML = `<p id="p">Ein <del>alter Mann</del> kommt.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const plan = createBlockTranslationPlan(paragraph)!;

  expect(plan.source).toBe("Ein <x0>alter Mann</x0> kommt.");
  const result = await translateBlockPlan(plan, translator({ [plan.source]: "Ein <x0>alte Mann</x0> kommt." }));
  applyPlaceholderUpdates(result.placeholderTextUpdates);
  paragraph.replaceChildren(...result.translatedChildren);
  expect(paragraph.querySelector("del")?.textContent).toBe("alte Mann");
});

test("computed-style hidden inline subtrees use opaque placeholders", () => {
  document.body.innerHTML = `<p id="p">Bitte <span>versteckt</span> lesen.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const hidden = paragraph.querySelector("span") as HTMLSpanElement;
  const plan = createBlockTranslationPlan(paragraph, {
    getComputedStyle: (element) => element === hidden ? { visibility: "hidden" } : undefined,
  })!;

  expect(plan.source).toBe("Bitte <x0></x0> lesen.");
});

test("protected inline subtrees use opaque placeholders", () => {
  document.body.innerHTML = `<p id="p">Bitte <code>const der = 1;</code> lesen.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const plan = createBlockTranslationPlan(paragraph)!;

  expect(plan.source).toBe("Bitte <x0></x0> lesen.");
});

test("inline wrappers containing protected descendants stay opaque", async () => {
  document.body.innerHTML = `<p id="p">Bitte <a href="/wiki/Code"><code>const der = 1;</code></a> lesen.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const plan = createBlockTranslationPlan(paragraph)!;

  expect(plan.source).toBe("Bitte <x0></x0> lesen.");
  const result = await translateBlockPlan(plan, translator({ [plan.source]: "Bitte <x0></x0> lesen alman." }));
  applyPlaceholderUpdates(result.placeholderTextUpdates);
  paragraph.replaceChildren(...result.translatedChildren);
  expect(paragraph.querySelector("code")?.textContent).toBe("const der = 1;");
  expect(paragraph.textContent).toBe("Bitte const der = 1; lesen alman.");
});

test("nested inline placeholder text updates without replacing the outer element", async () => {
  document.body.innerHTML = `<p id="p">Siehe <a id="link" href="/wiki/Mann"><span>dem Mann</span></a>.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const link = document.getElementById("link");
  const plan = createBlockTranslationPlan(paragraph)!;

  const result = await translateBlockPlan(plan, translator({ [plan.source]: "Siehe <x0>die Mann</x0>." }));

  expect(result.translated).toBe(true);
  expect(link?.textContent).toBe("dem Mann");
  applyPlaceholderUpdates(result.placeholderTextUpdates);
  paragraph.replaceChildren(...result.translatedChildren);
  expect(document.getElementById("link")).toBe(link);
  expect(link?.textContent).toBe("die Mann");
});

test("nested emphasis placeholder text keeps a stable emphasized suffix when possible", async () => {
  document.body.innerHTML = `<p id="p">Siehe <a id="link" href="/wiki/Mann">dem <em>Mann</em></a>.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const plan = createBlockTranslationPlan(paragraph)!;

  const result = await translateBlockPlan(plan, translator({ [plan.source]: "Siehe <x0>die Mann</x0>." }));

  applyPlaceholderUpdates(result.placeholderTextUpdates);
  paragraph.replaceChildren(...result.translatedChildren);
  expect(document.getElementById("link")?.textContent).toBe("die Mann");
  expect(document.querySelector("#link em")?.textContent).toBe("Mann");
});

test("nested emphasis remains populated when its translated suffix changes", async () => {
  document.body.innerHTML = `<p id="p">Siehe <a id="link" href="/wiki/Mann">dem <em>Mannes</em></a>.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const plan = createBlockTranslationPlan(paragraph)!;

  const result = await translateBlockPlan(plan, translator({ [plan.source]: "Siehe <x0>die Mann</x0>." }));

  applyPlaceholderUpdates(result.placeholderTextUpdates);
  paragraph.replaceChildren(...result.translatedChildren);
  expect(document.getElementById("link")?.textContent).toBe("die Mann");
  expect(document.querySelector("#link em")?.textContent).toBe("Mann");
});

test("malformed placeholder output does not partially mutate inline nodes", async () => {
  document.body.innerHTML = `<p id="p">Siehe <a href="/wiki/Mann">dem Mann</a> und <a href="/wiki/Frau">der Frau</a>.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const plan = createBlockTranslationPlan(paragraph)!;

  const result = await translateBlockPlan(plan, translator({ [plan.source]: "Siehe <x0>die Mann</x0> und die Frau." }));

  expect(result.translated).toBe(false);
  expect(paragraph.querySelector('a[href="/wiki/Mann"]')?.textContent).toBe("dem Mann");
  expect(paragraph.querySelector('a[href="/wiki/Frau"]')?.textContent).toBe("der Frau");
});

test("block translation falls back when placeholders are malformed", async () => {
  document.body.innerHTML = `<p id="p">Siehe <a href="/wiki/Kartoffel">Kartoffel</a>.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const plan = createBlockTranslationPlan(paragraph)!;

  const result = await translateBlockPlan(plan, translator({ [plan.source]: "Siehe Kartoffel." }));

  expect(result.translated).toBe(false);
  paragraph.replaceChildren(...result.translatedChildren);
  expect(paragraph.innerHTML).toBe('Siehe <a href="/wiki/Kartoffel">Kartoffel</a>.');
});
