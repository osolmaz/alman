// @vitest-environment happy-dom
import { expect, test } from "vitest";
import { createArticleContents } from "../src/ui/contents";

test("article contents links source headings and refreshes their labels", () => {
  document.body.innerHTML = `
    <article>
      <h2 id="Geschichte">Geschichte</h2>
      <h3 id="Frühe_Zeit">Frühe Zeit</h3>
    </article>
  `;
  const article = document.querySelector("article")!;
  const contents = createArticleContents(article);
  document.body.append(contents.element);

  expect(Array.from(contents.element.querySelectorAll("a"), (link) => link.getAttribute("href"))).toEqual([
    "#Geschichte",
    "#Fr%C3%BChe_Zeit",
  ]);
  expect(Array.from(contents.element.querySelectorAll("a"), (link) => link.textContent)).toEqual([
    "Geschichte",
    "Frühe Zeit",
  ]);

  article.querySelector("h2")!.textContent = "Geschicht";
  contents.refresh();
  expect(contents.element.querySelector("a")?.textContent).toBe("Geschicht");
  expect(contents.element.querySelector("a")?.getAttribute("href")).toBe("#Geschichte");
});

test("article contents collapses on narrow screens and follows viewport changes", () => {
  document.body.innerHTML = `<article><h2 id="Geschichte">Geschichte</h2></article>`;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const query = {
    matches: true,
    addEventListener: (_type: "change", listener: (event: MediaQueryListEvent) => void) => void listeners.add(listener),
    removeEventListener: (_type: "change", listener: (event: MediaQueryListEvent) => void) => void listeners.delete(listener),
  };
  const contents = createArticleContents(document.querySelector("article")!, query);
  const details = contents.element.querySelector("details")!;

  expect(details.open).toBe(false);
  for (const listener of listeners) listener({ matches: false } as MediaQueryListEvent);
  expect(details.open).toBe(true);
  contents.destroy();
  expect(listeners.size).toBe(0);
});

test("article contents creates unique ids when source headings lack them", () => {
  document.body.innerHTML = `<article><h2>Eine Überschrift</h2><h2>Eine Überschrift</h2></article>`;
  const article = document.querySelector("article")!;
  const contents = createArticleContents(article);

  expect(Array.from(article.querySelectorAll("h2"), (heading) => heading.id)).toEqual([
    "Eine_Überschrift",
    "Eine_Überschrift_2",
  ]);
  expect(contents.element.hidden).toBe(false);
});
