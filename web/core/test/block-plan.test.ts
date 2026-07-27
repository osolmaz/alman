// @vitest-environment happy-dom
import { expect, test } from "vitest";
import { createBlockTranslationPlan, createTextDifferenceNodes, translateBlockPlan } from "../src/dom/block-plan";
import type { BlockTranslationResult } from "../src/dom/block-plan";
import type { SafeTranslator } from "../src/engine/safe-translation";

function applyResult(element: Element, result: BlockTranslationResult): void {
  for (const update of result.textUpdates) {
    if (update.applyDirectly) update.node.nodeValue = update.translated;
  }
  element.replaceChildren(...result.translatedChildren);
}

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

test("difference nodes separate adjacent removed and inserted words", () => {
  const paragraph = document.createElement("p");
  paragraph.append(...createTextDifferenceNodes(document, "im Jahr", "in die Jahr"));

  expect(paragraph.textContent).toBe("im in die Jahr");
  expect(paragraph.querySelector("del")?.textContent).toBe("im");
  expect(Array.from(paragraph.querySelectorAll("ins"), (node) => node.textContent)).toEqual(["in", "die "]);
  expect(paragraph.querySelector("del")?.nextSibling?.nodeValue).toBe(" ");
});

test("block plans send plain prose and project the Zagwe heading onto live links", async () => {
  document.body.innerHTML = `
    <h2 id="heading"><span id="fallback"></span><a id="office" href="/wiki/Negus">Kaiser</a> der <a id="dynasty" href="/wiki/Zagwe-Dynastie">Zagwe-Dynastie</a> (ca. 916–ca. 1270)</h2>
  `;
  const heading = document.getElementById("heading") as HTMLHeadingElement;
  const office = document.getElementById("office");
  const dynasty = document.getElementById("dynasty");
  const fallback = document.getElementById("fallback");
  const plan = createBlockTranslationPlan(heading)!;

  expect(plan.source).toBe("Kaiser der Zagwe-Dynastie (ca. 916–ca. 1270)");
  expect(plan.source).not.toContain("<x");
  const result = await translateBlockPlan(
    plan,
    translator({
      [plan.source]: "Kaiser von die Zagwe-Dynastie (ca. 916–ca. 1270)",
    }),
    { markChanges: true },
  );

  applyResult(heading, result);
  expect(result.translated).toBe(true);
  expect(heading.textContent).toBe("Kaiser von die Zagwe-Dynastie (ca. 916–ca. 1270)");
  expect(document.getElementById("office")).toBe(office);
  expect(document.getElementById("dynasty")).toBe(dynasty);
  expect(document.getElementById("fallback")).toBe(fallback);
  expect(office?.getAttribute("href")).toBe("/wiki/Negus");
  expect(dynasty?.getAttribute("href")).toBe("/wiki/Zagwe-Dynastie");
  expect(Array.from(heading.querySelectorAll("[data-alman-change]"), (node) => node.textContent)).toEqual([
    "von",
    "die ",
  ]);
});

test("inline markup does not change model input", () => {
  document.body.innerHTML = `
    <p id="plain">Kaiser der Zagwe-Dynastie.</p>
    <p id="marked"><a href="/wiki/Negus">Kaiser</a> der <em><a href="/wiki/Zagwe-Dynastie">Zagwe-Dynastie</a></em>.</p>
  `;
  const plain = createBlockTranslationPlan(document.getElementById("plain")!)!;
  const marked = createBlockTranslationPlan(document.getElementById("marked")!)!;

  expect(marked.source).toBe(plain.source);
  expect(marked.source).toBe("Kaiser der Zagwe-Dynastie.");
});

test("block plans preserve inline punctuation while updating link and italic text", async () => {
  document.body.innerHTML = `
    <p id="p">dem Wort für <a href="/wiki/Trüffel">Trüffel</a>, das wiederum von <i>terrae tuber</i> kommt.</p>
  `;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const link = paragraph.querySelector("a");
  const italic = paragraph.querySelector("i");
  const plan = createBlockTranslationPlan(paragraph)!;
  expect(plan.source).toBe("dem Wort für Trüffel, das wiederum von terrae tuber kommt.");

  const result = await translateBlockPlan(
    plan,
    translator({
      [plan.source]: "die Wort für Trüffelchen, das wiederum von terrae tuber kommt.",
    }),
  );

  applyResult(paragraph, result);
  expect(paragraph.textContent).toBe("die Wort für Trüffelchen, das wiederum von terrae tuber kommt.");
  expect(paragraph.querySelector("a")).toBe(link);
  expect(paragraph.querySelector("i")).toBe(italic);
  expect(link?.textContent).toBe("Trüffelchen");
  expect(italic?.textContent).toBe("terrae tuber");
});

test("plain projection drives comparison and reveal markup from one result", async () => {
  document.body.innerHTML = `<p id="p">dem Wort für <a href="/wiki/Trüffel">Trüffel</a>.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const link = paragraph.querySelector("a");
  const plan = createBlockTranslationPlan(paragraph)!;
  const result = await translateBlockPlan(
    plan,
    translator({ [plan.source]: "die Wort für Trüffelchen." }),
    { markChanges: true },
  );

  const difference = paragraph.cloneNode(false) as HTMLParagraphElement;
  difference.append(...result.differenceChildren.map((child) => child.cloneNode(true)));
  expect(difference.textContent).toBe("dem die Wort für Trüffel Trüffelchen.");
  expect(difference.querySelector('a[href="/wiki/Trüffel"] ins')?.textContent).toBe("Trüffelchen");

  applyResult(paragraph, result);
  expect(paragraph.textContent).toBe("die Wort für Trüffelchen.");
  expect(paragraph.querySelector("a")).toBe(link);
  expect(result.changedElements).toEqual([link]);
  expect(paragraph.querySelectorAll("[data-alman-change]")).toHaveLength(1);
});

test("comment anchors stay live while surrounding plain text translates", async () => {
  document.body.innerHTML = `<p id="p">Hallo <!--anchor-->Welt.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const comment = Array.from(paragraph.childNodes).find((node) => node.nodeType === Node.COMMENT_NODE);
  const plan = createBlockTranslationPlan(paragraph)!;

  expect(plan.source).toBe("Hallo Welt.");
  const result = await translateBlockPlan(plan, translator({ [plan.source]: "Hallo Welt alman." }));
  applyResult(paragraph, result);
  expect(Array.from(paragraph.childNodes)).toContain(comment);
  expect(paragraph.textContent).toBe("Hallo Welt alman.");
});

test("line breaks become model whitespace and remain live", async () => {
  document.body.innerHTML = `<p id="p">Der<br id="break">Mann kommt.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const lineBreak = document.getElementById("break");
  const plan = createBlockTranslationPlan(paragraph)!;

  expect(plan.source).toBe("Der Mann kommt.");
  const result = await translateBlockPlan(plan, translator({ [plan.source]: "Die Mann kommt." }));
  applyResult(paragraph, result);
  expect(result.translated).toBe(true);
  expect(paragraph.innerHTML).toBe('Die<br id="break">Mann kommt.');
  expect(document.getElementById("break")).toBe(lineBreak);
});

test("a removed line break makes a pending projection stale", async () => {
  document.body.innerHTML = `<p id="p">Der<br id="break">Mann kommt.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const plan = createBlockTranslationPlan(paragraph)!;
  const engine: SafeTranslator = {
    async translateSegment(segment) { return segment; },
    async translateText() {
      document.getElementById("break")?.remove();
      return "Die Mann kommt.";
    },
    async dispose() {},
  };

  const result = await translateBlockPlan(plan, engine);
  expect(result.translated).toBe(false);
  expect(result.failure).toBe("stale");
  expect(paragraph.textContent).toBe("DerMann kommt.");
});

test("citation anchors stay out of model input and remain live", async () => {
  document.body.innerHTML = `<p id="p">Der Mann kommt.<sup id="cite_ref-1" class="mw-ref"><a href="#note-1">[1]</a></sup> Danach geht er.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const citation = document.getElementById("cite_ref-1");
  const plan = createBlockTranslationPlan(paragraph)!;

  expect(plan.source).toBe("Der Mann kommt. Danach geht er.");
  const result = await translateBlockPlan(plan, translator({ [plan.source]: "Die Mann kommt. Danach geht er." }));
  applyResult(paragraph, result);
  expect(paragraph.textContent).toBe("Die Mann kommt.[1] Danach geht er.");
  expect(document.getElementById("cite_ref-1")).toBe(citation);
  expect(citation?.querySelector("a")?.getAttribute("href")).toBe("#note-1");
});

test("nested structural descendants stay live while parent prose translates as one block", async () => {
  document.body.innerHTML = `<li id="item">Elterntext<ul><li>Kindtext</li></ul><img src="/x.png" alt="x"></li>`;
  const item = document.getElementById("item") as HTMLLIElement;
  const list = item.querySelector("ul");
  const image = item.querySelector("img");
  const plan = createBlockTranslationPlan(item)!;
  expect(plan.source).toBe("Elterntext");

  const result = await translateBlockPlan(plan, translator({ [plan.source]: "Elterntext alman" }));
  applyResult(item, result);
  expect(item.querySelector("ul")).toBe(list);
  expect(item.querySelector("img")).toBe(image);
  expect(item.querySelector("ul li")?.textContent).toBe("Kindtext");
  expect(item.textContent).toContain("Elterntext alman");
});

test("protected and hidden subtrees never enter model input", () => {
  document.body.innerHTML = `<p id="p">Bitte <code>const der = 1;</code> und <span>versteckt</span> lesen.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const hidden = paragraph.querySelector("span") as HTMLSpanElement;
  const plan = createBlockTranslationPlan(paragraph, {
    getComputedStyle: (element) => element === hidden ? { visibility: "hidden" } : undefined,
  })!;

  expect(plan.source).toBe("Bitte  und  lesen.");
  expect(plan.source).not.toContain("const der");
  expect(plan.source).not.toContain("versteckt");
});

test("inline wrappers containing protected descendants remain untouched", async () => {
  document.body.innerHTML = `<p id="p">Bitte <a id="code-link" href="/wiki/Code"><code>const der = 1;</code></a> lesen.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const link = document.getElementById("code-link");
  const plan = createBlockTranslationPlan(paragraph)!;

  expect(plan.source).toBe("Bitte  lesen.");
  const result = await translateBlockPlan(plan, translator({ [plan.source]: "Bitte  lesen alman." }));
  applyResult(paragraph, result);
  expect(document.getElementById("code-link")).toBe(link);
  expect(link?.textContent).toBe("const der = 1;");
  expect(paragraph.textContent).toBe("Bitte const der = 1; lesen alman.");
});

test("nested link and emphasis text project without replacing elements", async () => {
  document.body.innerHTML = `<p id="p">Siehe <a id="link" href="/wiki/Mann">dem <em id="em">Mannes</em></a>.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const link = document.getElementById("link");
  const emphasis = document.getElementById("em");
  const plan = createBlockTranslationPlan(paragraph)!;
  const result = await translateBlockPlan(plan, translator({ [plan.source]: "Siehe die Mann." }));

  applyResult(paragraph, result);
  expect(paragraph.textContent).toBe("Siehe die Mann.");
  expect(document.getElementById("link")).toBe(link);
  expect(document.getElementById("em")).toBe(emphasis);
  expect(link?.textContent).toBe("die Mann");
  expect(emphasis?.textContent).toBe("Mann");
});

test("literal placeholder-like text is translated as text and never parsed", async () => {
  document.body.innerHTML = `<p id="p">Das &lt;x0&gt; bleibt Text.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const plan = createBlockTranslationPlan(paragraph)!;
  expect(plan.source).toBe("Das <x0> bleibt Text.");

  const result = await translateBlockPlan(plan, translator({ [plan.source]: "Die <x0> bleibt Text." }));
  applyResult(paragraph, result);
  expect(paragraph.textContent).toBe("Die <x0> bleibt Text.");
  expect(paragraph.querySelector("x0")).toBeNull();
});

test("ambiguous projection across sibling links falls back without mutation", async () => {
  document.body.innerHTML = `<p id="p"><a id="a">Kaiser</a><a id="b">Zagwe</a></p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const original = paragraph.innerHTML;
  const plan = createBlockTranslationPlan(paragraph)!;
  const result = await translateBlockPlan(plan, translator({ [plan.source]: "Kaiser von die Zagwe" }));

  expect(result.translated).toBe(false);
  expect(result.failure).toBe("ambiguous");
  expect(result.translatedText).toBe(plan.source);
  expect(paragraph.innerHTML).toBe(original);
});

test("plain text can reorder when no inline scope needs projection", async () => {
  document.body.innerHTML = `<p id="p">Er sieht sie.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const plan = createBlockTranslationPlan(paragraph)!;
  const result = await translateBlockPlan(plan, translator({ [plan.source]: "Sie sieht er." }));

  applyResult(paragraph, result);
  expect(result.translated).toBe(true);
  expect(paragraph.textContent).toBe("Sie sieht er.");
});

test("unscoped insertions cannot expand a terminal link", async () => {
  document.body.innerHTML = `<p id="p"><a id="link" href="/wiki/Foo">foo</a></p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const plan = createBlockTranslationPlan(paragraph)!;
  const result = await translateBlockPlan(plan, translator({ [plan.source]: "foo alman" }));

  expect(result.translated).toBe(false);
  expect(result.failure).toBe("ambiguous");
  expect(paragraph.innerHTML).toBe('<a id="link" href="/wiki/Foo">foo</a>');
});

test("one-way lexical moves cannot change a live link target", async () => {
  document.body.innerHTML = `<p id="p"><a id="link" href="/wiki/Foo">foo</a> bar baz</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const original = paragraph.innerHTML;
  const plan = createBlockTranslationPlan(paragraph)!;
  const result = await translateBlockPlan(plan, translator({ [plan.source]: "baz foo bar" }));

  expect(result.translated).toBe(false);
  expect(result.failure).toBe("ambiguous");
  expect(paragraph.innerHTML).toBe(original);
  expect(document.getElementById("link")?.textContent).toBe("foo");
});

test("non-monotonic reordering across inline scopes falls back cleanly", async () => {
  document.body.innerHTML = `<p id="p"><a id="subject">Er</a> sieht <em id="object">sie</em>.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const original = paragraph.innerHTML;
  const plan = createBlockTranslationPlan(paragraph)!;
  const result = await translateBlockPlan(plan, translator({ [plan.source]: "Sie sieht er." }));

  expect(result.translated).toBe(false);
  expect(result.failure).toBe("ambiguous");
  expect(paragraph.innerHTML).toBe(original);
});

test("a translation cannot empty a live link label", async () => {
  document.body.innerHTML = `<p id="p">Siehe <a id="link" href="/wiki/Artikel">Artikel</a>.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const plan = createBlockTranslationPlan(paragraph)!;
  const result = await translateBlockPlan(plan, translator({ [plan.source]: "Siehe ." }));

  expect(result.translated).toBe(false);
  expect(result.failure).toBe("ambiguous");
  expect(document.getElementById("link")?.textContent).toBe("Artikel");
});

test("reparented text nodes reject a completed projection", async () => {
  document.body.innerHTML = `<p id="p"><span id="source">foo</span> bar</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const plan = createBlockTranslationPlan(paragraph)!;
  const engine: SafeTranslator = {
    async translateSegment(segment) { return segment; },
    async translateText() {
      const link = document.createElement("a");
      link.id = "new-link";
      link.href = "/wiki/Foo";
      link.append(document.getElementById("source")!.firstChild!);
      paragraph.append(link);
      return "die foo bar";
    },
    async dispose() {},
  };

  const result = await translateBlockPlan(plan, engine);
  expect(result.translated).toBe(false);
  expect(result.failure).toBe("stale");
  expect(document.getElementById("new-link")?.textContent).toBe("foo");
});

test("descendants added during inference reject a completed projection", async () => {
  document.body.innerHTML = `<p id="p"><a id="link" href="/wiki/Foo">foo</a></p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const plan = createBlockTranslationPlan(paragraph)!;
  const engine: SafeTranslator = {
    async translateSegment(segment) { return segment; },
    async translateText() {
      const addition = document.createElement("span");
      addition.id = "addition";
      addition.textContent = "new";
      document.getElementById("link")!.append(addition);
      return "bar";
    },
    async dispose() {},
  };

  const result = await translateBlockPlan(plan, engine);
  expect(result.translated).toBe(false);
  expect(result.failure).toBe("stale");
  expect(document.getElementById("link")?.textContent).toBe("foonew");
});

test("stale text nodes reject a completed projection", async () => {
  document.body.innerHTML = `<p id="p">Der Mann kommt.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const plan = createBlockTranslationPlan(paragraph)!;
  const engine: SafeTranslator = {
    async translateSegment(segment) { return segment; },
    async translateText() {
      paragraph.firstChild!.nodeValue = "Dynamischer Text.";
      return "Die Mann kommt.";
    },
    async dispose() {},
  };

  const result = await translateBlockPlan(plan, engine);
  expect(result.translated).toBe(false);
  expect(result.failure).toBe("stale");
  expect(paragraph.textContent).toBe("Dynamischer Text.");
});
