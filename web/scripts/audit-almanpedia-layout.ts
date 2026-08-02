import { chromium, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

interface BoxIssue {
  kind: string;
  selector: string;
  detail: string;
}

interface PageAudit {
  path: string;
  title: string;
  blocks: number;
  tables: number;
  thumbnails: number;
  issues: BoxIssue[];
}

interface AuditReport {
  baseUrl: string;
  seed: number;
  viewport: { height: number; width: number };
  colorMode: "dark" | "light";
  pages: PageAudit[];
  issueCount: number;
}

const baseUrl = new URL(process.env.ALMANPEDIA_URL ?? "http://127.0.0.1:8788/");
const pageCount = Number(process.env.ALMANPEDIA_AUDIT_PAGES ?? 10);
const seed = Number(process.env.ALMANPEDIA_AUDIT_SEED ?? 20260802);
const reportPath = process.env.ALMANPEDIA_LAYOUT_REPORT ?? "/tmp/almanpedia-layout-audit.json";
const viewport = {
  width: Number(process.env.ALMANPEDIA_AUDIT_WIDTH ?? 1440),
  height: Number(process.env.ALMANPEDIA_AUDIT_HEIGHT ?? 1000),
};
const colorMode = process.env.ALMANPEDIA_AUDIT_COLOR === "dark" ? "dark" : "light";
const startPath = process.env.ALMANPEDIA_AUDIT_START ?? "/wiki/Achtzigj%C3%A4hriger_Krieg";

function randomSource(initial: number): () => number {
  let state = initial >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

async function waitForArticle(page: Page): Promise<void> {
  await page.waitForSelector('.site-main:not([aria-busy="true"]) .wiki-content', { timeout: 20_000 });
  await page.waitForFunction(() => document.querySelector(".article-title")?.textContent?.trim().length);
}

async function loadDeferredMedia(page: Page): Promise<void> {
  const height = await page.evaluate(() => document.body.scrollHeight);
  const steps = Math.min(60, Math.max(1, Math.ceil(height / 800)));
  for (let index = 1; index <= steps; index += 1) {
    await page.evaluate((top) => scrollTo(0, top), Math.round((height * index) / steps));
    await page.waitForTimeout(25);
  }
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForFunction(
    () => [...document.querySelectorAll<HTMLImageElement>(".wiki-content img")].every((image) => image.complete),
    undefined,
    { timeout: 10_000 },
  ).catch(() => undefined);
  await page.waitForTimeout(250);
}

async function inspectPage(page: Page): Promise<PageAudit> {
  await loadDeferredMedia(page);
  return page.evaluate(() => {
    const article = document.querySelector<HTMLElement>(".wiki-content")!;
    const articleRect = article.getBoundingClientRect();
    const issues: BoxIssue[] = [];
    const selectorFor = (element: Element): string => {
      const component = element.getAttribute("data-wiki-component");
      const layout = element.getAttribute("data-wiki-layout");
      if (component) return `[data-wiki-component="${component}"]`;
      if (layout) return `[data-wiki-layout="${layout}"]`;
      return element.tagName.toLowerCase();
    };

    if (document.body.scrollWidth > innerWidth + 1) {
      issues.push({ kind: "page-overflow", selector: "body", detail: `${document.body.scrollWidth}>${innerWidth}` });
    }
    if (article.scrollWidth > article.clientWidth + 1) {
      issues.push({ kind: "article-overflow", selector: ".wiki-content", detail: `${article.scrollWidth}>${article.clientWidth}` });
    }
    if (article.querySelector("[typeof]")) {
      issues.push({ kind: "foreign-layout-metadata", selector: "[typeof]", detail: "unconsumed typeof attribute" });
    }

    for (const element of article.querySelectorAll<HTMLElement>("*")) {
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const rect = element.getBoundingClientRect();
      if (!rect.width && !rect.height) continue;
      if (element.closest('[data-wiki-layout="table-scroll"]') && !element.matches('[data-wiki-layout="table-scroll"]')) continue;
      if (rect.left < articleRect.left - 2 || rect.right > articleRect.right + 2) {
        issues.push({
          kind: "component-overflow",
          selector: selectorFor(element),
          detail: `${Math.round(rect.left)}..${Math.round(rect.right)} outside ${Math.round(articleRect.left)}..${Math.round(articleRect.right)}`,
        });
      }
    }

    for (const stack of article.querySelectorAll<HTMLElement>('[data-wiki-layout="float-stack"]')) {
      const children = [...stack.querySelectorAll<HTMLElement>(":scope > [data-wiki-stack-item]")];
      for (let index = 1; index < children.length; index += 1) {
        const previous = children[index - 1]!.getBoundingClientRect();
        const current = children[index]!.getBoundingClientRect();
        if (current.top < previous.bottom - 1) {
          issues.push({ kind: "float-stack-overlap", selector: selectorFor(stack), detail: `item ${index} starts before item ${index - 1} ends` });
        }
      }
    }

    for (const table of article.querySelectorAll<HTMLTableElement>("table")) {
      if (table.parentElement?.closest("table")) continue;
      const owner = table.closest('[data-wiki-layout="table-scroll"], [data-wiki-layout="float-stack"]');
      const component = table.getAttribute("data-wiki-component");
      if (!owner && component !== "infobox" && !table.hasAttribute("data-wiki-float")) {
        issues.push({ kind: "uncontained-table", selector: selectorFor(table), detail: "top-level table has no layout owner" });
      }
      if (component === "infobox" && table.scrollWidth > table.clientWidth + 2) {
        issues.push({ kind: "infobox-clipping", selector: selectorFor(table), detail: `${table.scrollWidth}>${table.clientWidth}` });
      }
    }

    for (const figure of article.querySelectorAll<HTMLElement>('[data-wiki-component="thumbnail"]')) {
      const rect = figure.getBoundingClientRect();
      const style = getComputedStyle(figure);
      if (article.clientWidth > 640 && figure.dataset.wikiFloat && style.float !== figure.dataset.wikiFloat) {
        issues.push({ kind: "thumbnail-float", selector: selectorFor(figure), detail: `${figure.dataset.wikiFloat}->${style.float}` });
      }
      if (rect.width > articleRect.width + 1) {
        issues.push({ kind: "thumbnail-width", selector: selectorFor(figure), detail: `${Math.round(rect.width)}>${Math.round(articleRect.width)}` });
      }
    }

    for (const image of article.querySelectorAll<HTMLImageElement>("img")) {
      if (!image.currentSrc || !image.complete || image.naturalWidth === 0) {
        issues.push({ kind: "failed-image", selector: "img", detail: image.getAttribute("src")?.slice(0, 160) ?? "missing src" });
      }
      const rect = image.getBoundingClientRect();
      const owner = image.closest<HTMLElement>('figure, [data-wiki-component="infobox"], [data-wiki-layout="table-scroll"]') ?? article;
      if (rect.width > owner.getBoundingClientRect().width + 2) {
        issues.push({ kind: "image-overflow", selector: "img", detail: `${Math.round(rect.width)}>${Math.round(owner.getBoundingClientRect().width)}` });
      }
    }

    return {
      path: location.pathname,
      title: document.querySelector(".article-title")?.textContent?.trim() ?? document.title,
      blocks: article.querySelectorAll("section").length,
      tables: article.querySelectorAll("table").length,
      thumbnails: article.querySelectorAll('[data-wiki-component="thumbnail"]').length,
      issues,
    };
  });
}

async function internalChoices(page: Page, visited: Set<string>): Promise<Array<{ href: string; path: string }>> {
  const links = await page.locator('a[data-internal][href^="/wiki/"]').evaluateAll((anchors) =>
    anchors.map((anchor) => ({
      href: (anchor as HTMLAnchorElement).getAttribute("href")!,
      path: new URL((anchor as HTMLAnchorElement).href).pathname,
    })),
  );
  const choices = new Map<string, { href: string; path: string }>();
  for (const link of links) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(link.path);
    } catch {
      continue;
    }
    if (!visited.has(link.path) && !decoded.includes(":")) choices.set(link.path, link);
  }
  return [...choices.values()];
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport });
if (colorMode === "dark") {
  await context.addInitScript(() => {
    localStorage.setItem(
      "almanpedia:reader-settings:v1",
      JSON.stringify({ version: 1, translationWave: true, changeEffects: true, textSize: "standard", colorMode: "dark" }),
    );
  });
}
await context.route(/huggingface\.co|\.hf\.co|translate-worker/u, (route) => route.abort("blockedbyclient"));
const page = await context.newPage();
const random = randomSource(seed);
const visited = new Set<string>();
const pages: PageAudit[] = [];

try {
  await page.goto(new URL(startPath, baseUrl).href, { waitUntil: "domcontentloaded" });
  for (let index = 0; index < pageCount; index += 1) {
    await waitForArticle(page);
    const audit = await inspectPage(page);
    pages.push(audit);
    visited.add(audit.path);
    console.log(`${index + 1}/${pageCount} ${audit.path}: ${audit.issues.length} issue(s), ${audit.tables} table(s), ${audit.thumbnails} thumbnail(s)`);
    if (index === pageCount - 1) break;

    const choices = await internalChoices(page, visited);
    if (!choices.length) throw new Error(`no unvisited internal links remain at ${audit.path}`);
    const next = choices[Math.floor(random() * choices.length)]!;
    const current = page.url();
    const escapedHref = next.href.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
    await page.locator(`a[data-internal][href="${escapedHref}"]`).first().click();
    await page.waitForURL((url) => url.href !== current && url.pathname === next.path, { timeout: 20_000 });
  }
} finally {
  await browser.close();
}

const report: AuditReport = {
  baseUrl: baseUrl.href,
  seed,
  viewport,
  colorMode,
  pages,
  issueCount: pages.reduce((total, pageAudit) => total + pageAudit.issues.length, 0),
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`wrote ${reportPath}`);
if (pages.length !== pageCount || report.issueCount) process.exitCode = 1;
