import { expect, test, type Page } from "@playwright/test";
import { resolve } from "node:path";

const ARTICLE = `
<main class="frame">
  <article class="wiki-content">
    <section>
      <div data-wiki-layout="float-stack" data-wiki-float="right">
        <table data-wiki-component="infobox" data-wiki-float="right" data-wiki-stack-item style="width:316px; margin-left:1em">
          <tbody><tr><th>Infobox</th></tr><tr><td>Bounded table content</td></tr></tbody>
        </table>
        <div data-wiki-component="linkbox" data-wiki-float="right" data-wiki-stack-item style="width:316px; margin-left:1em">
          <strong>Linkbox</strong><div>One<br>Two<br>Three</div>
        </div>
      </div>
      <p>${"Article text flows beside the floated component without being covered. ".repeat(18)}</p>
    </section>
    <section class="figure-section">
      <figure data-wiki-component="thumbnail" data-wiki-float="right">
        <div class="media"></div><figcaption>A bounded thumbnail caption</figcaption>
      </figure>
      <p>${"Later text flows around the licensed thumbnail. ".repeat(16)}</p>
    </section>
    <section class="left-figure-section">
      <figure data-wiki-component="figure" data-wiki-float="left">
        <div class="media"></div><figcaption>A left-aligned media figure</figcaption>
      </figure>
      <p>${"An ordinary aligned figure follows the same bounded layout contract. ".repeat(12)}</p>
    </section>
    <section class="legacy-figure-section">
      <div class="legacy-thumb" data-wiki-component="thumbnail" data-wiki-float="right">
        <div class="media"></div><div>A legacy thumbnail container</div>
      </div>
      <p>${"Legacy thumbnail containers use the same responsive layout contract. ".repeat(10)}</p>
    </section>
    <section class="left-infobox-section">
      <table class="left-infobox" data-wiki-component="infobox" data-wiki-float="left" style="width:270px">
        <tbody><tr><th>Left infobox</th></tr><tr><td>Left-aligned content</td></tr></tbody>
      </table>
      <p>${"A left infobox keeps its spacing on the text side. ".repeat(10)}</p>
    </section>
    <section class="floated-table-section">
      <table data-wiki-component="floated-table" data-wiki-float="right" style="width:900px">
        <tbody><tr><td>A generic floated table stays bounded.</td></tr></tbody>
      </table>
      <p>${"A generic floated table remains a bounded sidebar. ".repeat(10)}</p>
    </section>
    <section class="table-section">
      <div data-wiki-layout="table-scroll">
        <table data-wiki-component="data-table" style="width:900px">
          <tbody><tr>${Array.from({ length: 12 }, (_, index) => `<th>Column ${index + 1}</th>`).join("")}</tr>
          <tr>${Array.from({ length: 12 }, (_, index) => `<td>Value ${index + 1}</td>`).join("")}</tr></tbody>
        </table>
      </div>
    </section>
  </article>
</main>`;

const FRAME_CSS = `
:root {
  --article-font-size: 16px;
  --article-line-height: 1.625;
  --ink: #202122;
  --border: #a2a9b1;
  --border-subtle: #eaecf0;
  --surface-subtle: #f8f9fa;
  --surface-raised: #fff;
  --font-body: sans-serif;
}
* { box-sizing: border-box; }
body { margin: 0; font-family: var(--font-body); }
.frame { width: min(858px, calc(100vw - 24px)); margin: 12px auto; }
.media { width: 400px; height: 200px; max-width: 100%; background: #ccc; }
.figure-section, .left-figure-section, .legacy-figure-section { min-height: 20rem; }
.left-figure-section, .legacy-figure-section, .left-infobox-section, .floated-table-section, .table-section { clear: both; }
.left-infobox-section, .floated-table-section { min-height: 10rem; }
`;

async function mount(page: Page, width: number): Promise<void> {
  await page.setViewportSize({ width, height: 900 });
  await page.setContent(`<style>${FRAME_CSS}</style>${ARTICLE}`);
  await page.addStyleTag({ path: resolve(process.cwd(), "almanpedia/src/styles/wiki-content.css") });
}

/*
 * The article act, reduced to the parts this suite measures: the figure's stage,
 * the browser inside it, one line with three words that change length, and one
 * ending card. The last line of the article and the card each carry a single
 * space with white-space: pre, which is the width of one word space in their own
 * type, and the reference every measured gap is compared against.
 */
const SWAP_FIXTURE = `
<div class="th-theater">
  <div class="th-stagewrap">
    <div class="th-stage">
      <div class="th-browser" data-browser style="width: 40rem">
        <div class="th-page" data-page>
          <p class="th-line">Die Hypothese ist
            <span class="th-swap" data-swap data-state="de"><span class="th-swap-de">eine</span><span class="th-swap-al">ein</span></span>
            <span class="th-next">Annahme</span> aus
            <span class="th-swap" data-swap data-state="de"><span class="th-swap-de">der</span><span class="th-swap-al">von die</span></span>
            <span class="th-next">Sprachwissenschaft</span>, auf
            <span class="th-swap" data-swap data-state="de"><span class="th-swap-de">seinen</span><span class="th-swap-al">sein</span></span>
            <span class="th-next">Lehrer</span>.</p>
          <p class="th-line"><span class="th-ref" style="white-space: pre"> </span></p>
          <div class="th-card" data-card data-state="de">
            <span class="th-card-rule">§4a</span>
            <p class="th-card-phrase">ein <span class="th-word">gut<span class="th-ending"><span class="th-drop">er</span><span class="th-add">e</span></span></span> Mann<span class="th-ref" style="white-space: pre"> </span></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`;

/** Mount the figure's own stylesheet, with the markup the article act builds. */
async function mountTheater(page: Page): Promise<void> {
  await page.setViewportSize({ width: 900, height: 700 });
  await page.setContent(`<style>${FRAME_CSS}</style>${SWAP_FIXTURE}`);
  await page.addStyleTag({ path: resolve(process.cwd(), "almanpedia/src/styles/theater.css") });
}

/*
 * The header, reduced to the parts this suite measures: the brand, the search box,
 * the status line and the language switch, in the grid the shell mounts them in.
 */
const HEADER_FIXTURE = `
<header class="site-header">
  <div class="header-inner">
    <a class="brand brand-horizontal" href="/">
      <img class="brand-potato" width="973" height="717" alt="">
      <img class="brand-wordmark" width="5477" height="1305" alt="Almanpedia">
    </a>
    <div class="search-box"><input type="search" placeholder="Search articles …" aria-label="Search"></div>
    <div class="header-status" role="status"></div>
    <div class="locale-switch" role="group" aria-label="Language">
      <button class="locale-option" aria-pressed="true">DE</button>
      <button class="locale-option" aria-pressed="false">EN</button>
    </div>
  </div>
</header>`;

/** Mount the shell's header with the stylesheet that places it. */
async function mountHeader(page: Page, width: number): Promise<void> {
  await page.setViewportSize({ width, height: 800 });
  await page.setContent(`<style>${FRAME_CSS}</style>${HEADER_FIXTURE}`);
  await page.addStyleTag({ path: resolve(process.cwd(), "almanpedia/src/styles/base.css") });
}

/**
 * Write the one number the figure's stylesheet cannot work out for itself: how much
 * wider the second spelling of a cell is than the first. This mirrors the figure's
 * own measurement, which lives in TypeScript the browser suite cannot import; the
 * rest of the mechanism, the pull and its timing, is the shipped stylesheet.
 */
async function measureSlack(page: Page): Promise<void> {
  await page.evaluate(() => {
    const textWidth = (node: Element | null) => {
      if (!node) return 0;
      const range = document.createRange();
      range.selectNodeContents(node);
      return range.getBoundingClientRect().width;
    };
    const write = (element: Element, first: Element | null, second: Element | null) => {
      (element as HTMLElement).style.setProperty("--spell-slack", `${textWidth(second) - textWidth(first)}px`);
    };
    for (const swap of document.querySelectorAll(".th-swap")) write(swap, swap.firstElementChild, swap.lastElementChild);
    for (const ending of document.querySelectorAll(".th-ending")) {
      write(ending, ending.querySelector(".th-drop"), ending.querySelector(".th-add"));
    }
  });
}

/** Turn every changed word and card to one state, and wait for the pull to settle. */
async function setSpelling(page: Page, state: "de" | "al"): Promise<void> {
  await page.locator(".th-swap, .th-card").evaluateAll((elements, value) => {
    for (const element of elements) (element as HTMLElement).dataset.state = value;
  }, state);
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".th-swap, .th-ending")].every((node) =>
      node.getAnimations().every((animation) => animation.playState !== "running"),
    ),
  );
}

async function box(page: Page, selector: string) {
  const value = await page.locator(selector).boundingBox();
  expect(value, `${selector} should have layout`).not.toBeNull();
  return value!;
}

async function expectNoPageOverflow(page: Page): Promise<void> {
  const sizes = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: innerWidth }));
  expect(sizes.body).toBeLessThanOrEqual(sizes.viewport);
}

test("wide articles preserve float stacks, thumbnail placement, and table containment", async ({ page }) => {
  await mount(page, 1200);
  const article = await box(page, ".wiki-content");
  const stack = await box(page, '[data-wiki-layout="float-stack"]');
  const infobox = await box(page, '[data-wiki-stack-item][data-wiki-component="infobox"]');
  const linkbox = await box(page, '[data-wiki-component="linkbox"]');
  const thumbnail = await box(page, 'figure[data-wiki-component="thumbnail"]');
  const leftFigure = await box(page, '[data-wiki-component="figure"]');

  expect(infobox.width).toBeCloseTo(316, 0);
  expect(linkbox.y).toBeGreaterThanOrEqual(infobox.y + infobox.height - 1);
  expect(stack.x + stack.width).toBeLessThanOrEqual(article.x + article.width + 1);
  expect(await page.locator('[data-wiki-layout="float-stack"]').evaluate((element) => getComputedStyle(element).float)).toBe("right");
  expect(await page.locator('figure[data-wiki-component="thumbnail"]').evaluate((element) => getComputedStyle(element).float)).toBe("right");
  expect(thumbnail.x).toBeGreaterThan(article.x + article.width / 2);
  expect(await page.locator('[data-wiki-component="figure"]').evaluate((element) => getComputedStyle(element).float)).toBe("left");
  expect(leftFigure.x).toBeLessThan(article.x + article.width / 2);
  expect(await page.locator(".legacy-thumb").evaluate((element) => getComputedStyle(element).float)).toBe("right");
  const leftInfoboxStyle = await page.locator(".left-infobox").evaluate((element) => {
    const style = getComputedStyle(element);
    return { float: style.float, marginLeft: style.marginLeft, marginRight: style.marginRight };
  });
  expect(leftInfoboxStyle).toEqual({ float: "left", marginLeft: "0px", marginRight: "20px" });
  expect((await box(page, '[data-wiki-component="floated-table"]')).width).toBeLessThanOrEqual(384);

  const scroller = page.locator('[data-wiki-layout="table-scroll"]');
  const tableWidths = await scroller.evaluate((element) => ({ client: element.clientWidth, scroll: element.scrollWidth }));
  expect(tableWidths.scroll).toBeGreaterThan(tableWidths.client);
  await expectNoPageOverflow(page);
});

test("narrow desktop columns stack before fixed-width components become cramped", async ({ page }) => {
  await mount(page, 650);
  const article = await box(page, ".wiki-content");
  const stack = await box(page, '[data-wiki-layout="float-stack"]');
  const infobox = await box(page, '[data-wiki-stack-item][data-wiki-component="infobox"]');
  const linkbox = await box(page, '[data-wiki-component="linkbox"]');

  expect(await page.locator('[data-wiki-layout="float-stack"]').evaluate((element) => getComputedStyle(element).float)).toBe("none");
  expect(stack.width).toBeCloseTo(article.width, 0);
  expect(infobox.width).toBeLessThanOrEqual(article.width + 1);
  expect(linkbox.y).toBeGreaterThanOrEqual(infobox.y + infobox.height - 1);
  await expectNoPageOverflow(page);
});

test("phone columns stack components in order and contain wide content", async ({ page }) => {
  await mount(page, 390);
  const article = await box(page, ".wiki-content");
  const stack = await box(page, '[data-wiki-layout="float-stack"]');
  const infobox = await box(page, '[data-wiki-stack-item][data-wiki-component="infobox"]');
  const linkbox = await box(page, '[data-wiki-component="linkbox"]');
  const thumbnail = await box(page, 'figure[data-wiki-component="thumbnail"]');
  const leftFigure = await box(page, '[data-wiki-component="figure"]');

  expect(await page.locator('[data-wiki-layout="float-stack"]').evaluate((element) => getComputedStyle(element).float)).toBe("none");
  expect(await page.locator('figure[data-wiki-component="thumbnail"]').evaluate((element) => getComputedStyle(element).float)).toBe("none");
  expect(await page.locator('[data-wiki-component="figure"]').evaluate((element) => getComputedStyle(element).float)).toBe("none");
  expect(stack.width).toBeCloseTo(article.width, 0);
  expect(infobox.width).toBeLessThanOrEqual(article.width + 1);
  expect(linkbox.y).toBeGreaterThanOrEqual(infobox.y + infobox.height - 1);
  expect(thumbnail.width).toBeLessThanOrEqual(article.width + 1);
  expect(leftFigure.width).toBeLessThanOrEqual(article.width + 1);
  expect(await page.locator(".legacy-thumb").evaluate((element) => getComputedStyle(element).float)).toBe("none");
  expect(await page.locator(".left-infobox").evaluate((element) => getComputedStyle(element).float)).toBe("none");
  expect(await page.locator('[data-wiki-component="floated-table"]').evaluate((element) => getComputedStyle(element).float)).toBe("none");

  const scroller = page.locator('[data-wiki-layout="table-scroll"]');
  const tableWidths = await scroller.evaluate((element) => ({ client: element.clientWidth, scroll: element.scrollWidth }));
  expect(tableWidths.scroll).toBeGreaterThan(tableWidths.client);
  await expectNoPageOverflow(page);
});

test("a word that changes length keeps the ordinary space around it", async ({ page }) => {
  await mountTheater(page);
  await measureSlack(page);

  /*
   * The gap is measured between the letters, not between the boxes: the cell holds
   * both spellings and is as wide as the longer of the two, so the width the word on
   * screen does not need has to be pulled back out of the line.
   */
  const measure = () => page.evaluate(() => {
    const textRect = (node: Node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return range.getBoundingClientRect();
    };
    const space = textRect(document.querySelector(".th-ref")!).width;
    const line = document.querySelector(".th-line")!;

    return {
      space,
      /* A line that re-wraps at either spelling would change its own height. */
      lineHeight: line.getBoundingClientRect().height,
      rows: [...document.querySelectorAll(".th-swap")].map((swap) => {
        const state = (swap as HTMLElement).dataset.state;
        const shown = swap.querySelector(state === "de" ? ".th-swap-de" : ".th-swap-al")!;
        const next = swap.nextElementSibling!;
        return {
          pair: `${shown.textContent} ${next.textContent}`,
          gap: textRect(next).left - textRect(shown).right,
        };
      }),
    };
  });

  let height = 0;
  for (const state of ["de", "al"] as const) {
    await setSpelling(page, state);

    const measured = await measure();
    expect(measured.rows.length).toBeGreaterThan(0);
    expect(measured.space, "the fixture needs a space to compare against").toBeGreaterThan(0);
    if (height === 0) height = measured.lineHeight;
    expect(measured.lineHeight, `the line re-wrapped in the ${state} state`).toBeCloseTo(height, 0);

    for (const row of measured.rows) {
      /* A cell that keeps the room of the longer spelling leaves 5 to 26px here.
         Sub-pixel rounding leaves under 1px. */
      expect(Math.abs(row.gap - measured.space), `${row.pair} in the ${state} state`).toBeLessThan(1.5);
    }
  }
});

test("an ending that falls away keeps the ordinary space around it", async ({ page }) => {
  await mountTheater(page);
  await measureSlack(page);

  const measure = () => page.evaluate(() => {
    const textRect = (node: Node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return range.getBoundingClientRect();
    };
    const card = document.querySelector(".th-card")!;
    const word = card.querySelector(".th-word")!;
    const ending = word.querySelector(".th-ending")!;
    const state = (card as HTMLElement).dataset.state;
    const shown = ending.querySelector(state === "de" ? ".th-drop" : ".th-add");
    const stem = textRect(word.firstChild!);

    /* The word after this one starts past the space that separates them. */
    const after = word.nextSibling as Text;
    const nextRange = document.createRange();
    nextRange.setStart(after, 1);
    nextRange.setEnd(after, after.textContent!.length);

    return {
      pair: `gut${shown?.textContent ?? ""} Mann`,
      space: textRect(card.querySelector(".th-ref")!).width,
      /* The last letter on the card is the stem's, or the ending's when it is there. */
      gap: nextRange.getBoundingClientRect().left - (shown ? Math.max(stem.right, textRect(shown).right) : stem.right),
    };
  });

  for (const state of ["de", "al"] as const) {
    await setSpelling(page, state);

    const measured = await measure();
    expect(measured.space, "the fixture needs a space to compare against").toBeGreaterThan(0);
    expect(Math.abs(measured.gap - measured.space), `${measured.pair} in the ${state} state`).toBeLessThan(1.5);
  }
});

test("the language switch stays the width of its two codes", async ({ page }) => {
  const measure = () => page.evaluate(() => {
    const inner = document.querySelector(".header-inner")!.getBoundingClientRect();
    const pill = document.querySelector(".locale-switch")!.getBoundingClientRect();
    const codes = [...document.querySelectorAll(".locale-option")].map((b) => b.getBoundingClientRect());
    return {
      innerLeft: inner.left,
      innerRight: inner.right,
      pillWidth: pill.width,
      pillLeft: pill.left,
      pillRight: pill.right,
      codesWidth: codes.reduce((sum, box) => sum + box.width, 0),
      lastCodeRight: codes.at(-1)!.right,
    };
  });

  /* The header's last track is `auto` and the tracks before it take the width, so a
     pill that filled its track would run on past its two codes. The pill is the two
     codes plus its own 1px border on either side. */
  for (const width of [1440, 1000]) {
    await mountHeader(page, width);
    const measured = await measure();
    expect(Math.abs(measured.pillWidth - measured.codesWidth - 2), `the pill at ${width}px`).toBeLessThan(1.5);
    expect(Math.abs(measured.pillRight - measured.lastCodeRight), `the last code at ${width}px`).toBeLessThan(2);
  }

  /* On a phone the switch shares the brand's line, and it stays inside it. */
  for (const width of [390, 320]) {
    await mountHeader(page, width);
    const measured = await measure();
    expect(measured.pillLeft, `the pill at ${width}px`).toBeGreaterThanOrEqual(measured.innerLeft);
    expect(measured.pillRight, `the pill at ${width}px`).toBeLessThanOrEqual(measured.innerRight + 0.5);
    expect(Math.abs(measured.pillWidth - measured.codesWidth - 2), `the pill at ${width}px`).toBeLessThan(1.5);
  }
});
