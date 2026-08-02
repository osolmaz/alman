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
