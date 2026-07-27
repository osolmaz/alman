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

test("foreign inline text keeps a stable model boundary without blocking surrounding translation", async () => {
  document.body.innerHTML = `<p id="p">Der <span id="foreign" lang="en">API</span> Mann kommt.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const foreign = document.getElementById("foreign");
  const inputs: string[] = [];
  const plan = createBlockTranslationPlan(paragraph)!;
  const engine: SafeTranslator = {
    async translateSegment(segment) { return segment; },
    async translateText(text) {
      inputs.push(text);
      if (text === "Der Mann kommt.") return "Die Typ kommt.";
      return text;
    },
    async dispose() {},
  };

  expect(plan.source).toBe("Der Mann kommt.");
  const result = await translateBlockPlan(plan, engine);
  applyResult(paragraph, result);

  expect(inputs).toEqual(["Der Mann kommt."]);
  expect(result.translated).toBe(true);
  expect(result.translatedText).toBe("Die Typ kommt.");
  expect(paragraph.textContent).toBe("Die API Typ kommt.");
  expect(document.getElementById("foreign")).toBe(foreign);
  expect(foreign?.textContent).toBe("API");
});

test("foreign inline text without surrounding spaces still gets a plain-text boundary", async () => {
  document.body.innerHTML = `<p id="p">Das<span id="foreign" lang="en">API</span>ist gut.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const foreign = document.getElementById("foreign");
  const plan = createBlockTranslationPlan(paragraph)!;

  expect(plan.source).toBe("Das ist gut.");
  const result = await translateBlockPlan(plan, translator({ [plan.source]: "Die ist gut." }));
  applyResult(paragraph, result);

  expect(result.translated).toBe(true);
  expect(paragraph.textContent).toBe("DieAPIist gut.");
  expect(document.getElementById("foreign")).toBe(foreign);
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

test("grapheme refinement edits a linked compound suffix without replacing the link", async () => {
  document.body.innerHTML = `<p id="p">Eine Fernseh<a id="link" href="/wiki/Journalist">journalistin</a>.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const link = document.getElementById("link") as HTMLAnchorElement;
  let clicks = 0;
  link.addEventListener("click", (event) => {
    event.preventDefault();
    clicks += 1;
  });
  const plan = createBlockTranslationPlan(paragraph)!;
  const result = await translateBlockPlan(
    plan,
    translator({ [plan.source]: "Ein Fernsehjournalist." }),
  );

  applyResult(paragraph, result);
  expect(result.translated).toBe(true);
  expect(paragraph.textContent).toBe("Ein Fernsehjournalist.");
  expect(document.getElementById("link")).toBe(link);
  expect(link.textContent).toBe("journalist");
  link.click();
  expect(clicks).toBe(1);
});

test("whitespace affinity keeps an expanded contraction before an adjacent link", async () => {
  document.body.innerHTML = `<li id="item"><span>Archiv 31/1980 vom 21. Juli 1980, im </span><a id="link" href="/wiki/Munzinger-Archiv">Munzinger-Archiv</a><span> abrufbar</span></li>`;
  const item = document.getElementById("item") as HTMLLIElement;
  const link = document.getElementById("link");
  const plan = createBlockTranslationPlan(item)!;
  const result = await translateBlockPlan(
    plan,
    translator({ [plan.source]: "Archiv 31/1980 von die 21. Juli 1980, in die Munzinger-Archiv abrufbar" }),
  );

  applyResult(item, result);
  expect(result.translated).toBe(true);
  expect(item.textContent).toBe("Archiv 31/1980 von die 21. Juli 1980, in die Munzinger-Archiv abrufbar");
  expect(document.getElementById("link")).toBe(link);
  expect(link?.textContent).toBe("Munzinger-Archiv");
});

test("grapheme refinement still rejects one lexical rewrite owned by multiple scopes", async () => {
  document.body.innerHTML = `<p id="p"><span id="prefix">Fernseh</span><a id="link">journalistin</a></p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const original = paragraph.innerHTML;
  const plan = createBlockTranslationPlan(paragraph)!;
  const result = await translateBlockPlan(plan, translator({ [plan.source]: "TV-Reporter" }));

  expect(result.translated).toBe(false);
  expect(result.failure).toBe("ambiguous");
  expect(paragraph.innerHTML).toBe(original);
});

test("arbitrary inline splits either project the exact target or leave the DOM untouched", async () => {
  const source = "Fernsehjournalistin";
  const target = "Fernsehjournalist";
  let accepted = 0;
  for (let split = 1; split < source.length; split += 1) {
    document.body.innerHTML = `<p id="p"><span id="left"></span><a id="right"></a></p>`;
    const paragraph = document.getElementById("p") as HTMLParagraphElement;
    const left = document.getElementById("left")!;
    const right = document.getElementById("right")!;
    left.textContent = source.slice(0, split);
    right.textContent = source.slice(split);
    const original = paragraph.innerHTML;
    const plan = createBlockTranslationPlan(paragraph)!;
    const result = await translateBlockPlan(plan, translator({ [source]: target }));

    if (result.translated) {
      applyResult(paragraph, result);
      accepted += 1;
      expect(paragraph.textContent, `split ${split}`).toBe(target);
      expect(document.getElementById("left"), `split ${split}`).toBe(left);
      expect(document.getElementById("right"), `split ${split}`).toBe(right);
    } else {
      expect(paragraph.textContent, `split ${split}`).toBe(source);
      expect(paragraph.innerHTML, `split ${split}`).toBe(original);
    }
  }
  expect(accepted).toBeGreaterThan(0);
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

test("a deletion spanning sibling inline scopes remains ambiguous", async () => {
  document.body.innerHTML = `<p id="p"><span id="a">Fernseh</span><a id="b">journalistin</a></p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const original = paragraph.innerHTML;
  const plan = createBlockTranslationPlan(paragraph)!;
  const result = await translateBlockPlan(plan, translator({ [plan.source]: "" }));

  expect(result.translated).toBe(false);
  expect(paragraph.innerHTML).toBe(original);
});

test("independent sentences do not confuse inflection changes with lexical moves", async () => {
  document.body.innerHTML = `
    <p id="p"><b id="title">Der heimliche Aufmarsch</b> ist ein <a id="poem">Gedicht</a> von Erich Weinert, das er im Jahre 1927 schrieb. Es wurde 1929 von Wladimir Vogel anlässlich des ersten internationalen <a id="day">Antikriegstages</a> vertont.</p>
  `;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const title = document.getElementById("title");
  const poem = document.getElementById("poem");
  const day = document.getElementById("day");
  const plan = createBlockTranslationPlan(paragraph)!;
  const target = "Die heimliche Aufmarsch ist ein Gedicht von Erich Weinert, das er in die Jahr 1927 schrieb. Es wurde 1929 von Wladimir Vogel anlässlich der erste internationale Antikriegstag vertont.";
  const result = await translateBlockPlan(plan, translator({ [plan.source]: target }));

  applyResult(paragraph, result);
  expect(result.translated).toBe(true);
  expect(paragraph.textContent).toBe(target);
  expect(document.getElementById("title")).toBe(title);
  expect(document.getElementById("poem")).toBe(poem);
  expect(document.getElementById("day")).toBe(day);
});

test("lexical moves cannot cross omitted foreign inline content", async () => {
  document.body.innerHTML = `<p id="p">Foo,<span id="foreign" lang="en">X</span> bar</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const original = paragraph.innerHTML;
  const plan = createBlockTranslationPlan(paragraph)!;
  const result = await translateBlockPlan(plan, translator({ [plan.source]: "bar, Foo" }));

  expect(plan.source).toBe("Foo, bar");
  expect(result.translated).toBe(false);
  expect(result.failureDetail).toBe("lexical-move");
  expect(paragraph.innerHTML).toBe(original);
});

test("same-scope inflections are not mistaken for moves around an inline link", async () => {
  document.body.innerHTML = `<p id="p">Dies ist ein <a id="link">Begriff</a>, das bleibt.</p>`;
  const paragraph = document.getElementById("p") as HTMLParagraphElement;
  const link = document.getElementById("link");
  const plan = createBlockTranslationPlan(paragraph)!;
  const target = "Das ist ein Begriff, die bleibt.";
  const result = await translateBlockPlan(plan, translator({ [plan.source]: target }));

  applyResult(paragraph, result);
  expect(result.translated).toBe(true);
  expect(paragraph.textContent).toBe(target);
  expect(document.getElementById("link")).toBe(link);
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
