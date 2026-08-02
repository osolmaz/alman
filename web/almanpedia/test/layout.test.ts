import { describe, expect, test } from "vitest";
import { normalizeParsoidLayout } from "../src/wiki/layout";
import { prepareParsoidBody } from "../src/wiki/prepare";
import { sanitizeParsoidBody } from "../src/wiki/sanitize";

const LAYOUT_FIXTURE = `
<section>
  <div class="infobox" style="all:revert; float:right">
    <table class="infobox float-right" style="width:316px"><tbody><tr><td>Info</td></tr></tbody></table>
    <div class="linkbox float-right" style="width:316px">Links</div>
  </div>
  <p>First paragraph</p>
  <figure typeof="mw:File/Thumb"><a href="./Datei:Right.jpg"><img src="//upload.wikimedia.org/right.jpg"></a><figcaption>Right</figcaption></figure>
  <figure class="mw-halign-left" typeof="mw:File/Thumb"><img src="//upload.wikimedia.org/left.jpg"><figcaption>Left</figcaption></figure>
  <table class="infobox" style="width:270px"><tbody><tr><td>Standalone</td></tr></tbody></table>
  <table class="wikitable"><tbody><tr><td>Wide data</td></tr></tbody></table>
  <table class="navbox"><tbody><tr><td>Navigation data</td></tr></tbody></table>
  <div class="unknown-template"><span>Unknown stays readable</span></div>
</section>`;

function host(fragment: DocumentFragment): HTMLElement {
  const element = document.createElement("div");
  element.append(fragment);
  return element;
}

describe("normalizeParsoidLayout", () => {
  test("builds an owned float stack without confusing its wrapper and table", () => {
    const root = host(prepareParsoidBody(LAYOUT_FIXTURE));
    const stack = root.querySelector<HTMLElement>('div[data-wiki-layout="float-stack"]')!;
    const table = stack.querySelector<HTMLTableElement>(':scope > table[data-wiki-component="infobox"]')!;
    const linkbox = stack.querySelector<HTMLElement>(':scope > [data-wiki-component="linkbox"]')!;

    expect(stack.dataset.wikiFloat).toBe("right");
    expect(stack.style.getPropertyValue("all")).toBe("");
    expect(stack.style.float).toBe("");
    expect(table.style.width).toBe("316px");
    expect(table.dataset.wikiStackItem).toBe("");
    expect(linkbox.dataset.wikiStackItem).toBe("");
    expect(table.dataset.wikiFloat).toBe("right");
    expect(linkbox.dataset.wikiFloat).toBe("right");
  });

  test("preserves thumbnail semantics through sanitization and consumes foreign metadata", () => {
    const root = host(prepareParsoidBody(LAYOUT_FIXTURE));
    const figures = [...root.querySelectorAll<HTMLElement>("figure")];

    expect(figures).toHaveLength(2);
    expect(figures[0]?.dataset.wikiComponent).toBe("thumbnail");
    expect(figures[0]?.dataset.wikiFloat).toBe("right");
    expect(figures[1]?.dataset.wikiComponent).toBe("thumbnail");
    expect(figures[1]?.dataset.wikiFloat).toBe("left");
    expect(root.querySelector("[typeof]")).toBeNull();
  });

  test("keeps standalone infoboxes distinct and wraps ordinary data tables once", () => {
    const root = host(prepareParsoidBody(LAYOUT_FIXTURE));
    const standalone = [...root.querySelectorAll<HTMLTableElement>('table[data-wiki-component="infobox"]')]
      .find((table) => !table.hasAttribute("data-wiki-stack-item"));
    const scrolls = [...root.querySelectorAll<HTMLElement>('[data-wiki-layout="table-scroll"]')];

    expect(standalone?.style.width).toBe("270px");
    expect(standalone?.dataset.wikiFloat).toBe("right");
    expect(scrolls).toHaveLength(2);
    expect(scrolls[0]?.firstElementChild?.getAttribute("data-wiki-component")).toBe("data-table");
    expect(scrolls[1]?.firstElementChild?.getAttribute("data-wiki-component")).toBe("navbox");
    expect(root.querySelector(".unknown-template")?.textContent).toBe("Unknown stays readable");
  });

  test("is idempotent and preserves visible text", () => {
    const fragment = sanitizeParsoidBody(LAYOUT_FIXTURE);
    const originalText = fragment.textContent;
    normalizeParsoidLayout(fragment);
    const root = host(fragment);
    const once = root.innerHTML;

    normalizeParsoidLayout(root);

    expect(root.innerHTML).toBe(once);
    expect(root.textContent).toBe(originalText);
  });

  test("does not replace nodes while normalizing a fragment", () => {
    const fragment = sanitizeParsoidBody(LAYOUT_FIXTURE);
    const anchor = fragment.querySelector("a")!;
    const image = fragment.querySelector("img")!;
    const text = fragment.querySelector(".unknown-template span")?.firstChild;

    normalizeParsoidLayout(fragment);

    expect(fragment.querySelector("a")).toBe(anchor);
    expect(fragment.querySelector("img")).toBe(image);
    expect(fragment.querySelector(".unknown-template span")?.firstChild).toBe(text);
  });

  test("removes unsafe active layout while retaining bounded dimensions", () => {
    const fragment = sanitizeParsoidBody(
      `<div style="position:fixed; inset:0; z-index:12; transform:scale(2); width:20rem; max-height:100vh">Safe text</div>` +
        `<span style="position:absolute; left:-500px">Unknown overlay</span>`,
    );
    const diagnostics = normalizeParsoidLayout(fragment);
    const element = fragment.querySelector<HTMLElement>("div")!;
    const overlay = fragment.querySelector<HTMLElement>("span")!;

    expect(element.style.position).toBe("");
    expect(element.style.inset).toBe("");
    expect(element.style.zIndex).toBe("");
    expect(element.style.transform).toBe("");
    expect(element.style.width).toBe("20rem");
    expect(element.style.maxHeight).toBe("");
    expect(overlay.style.position).toBe("");
    expect(overlay.style.left).toBe("");
    expect(diagnostics.map(({ reason }) => reason).sort()).toEqual([
      "removed-absolute-position",
      "removed-fixed-position",
      "removed-transform",
      "removed-viewport-size",
      "removed-z-index",
    ]);
  });
});
