// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vitest";
import { createHeaderBrand, createLandingHeading } from "../src/ui/brand";

test("header brand combines the raster mark with the vector wordmark", () => {
  const brand = createHeaderBrand();
  const potato = brand.querySelector<HTMLImageElement>(".brand-potato")!;
  const wordmark = brand.querySelector<HTMLImageElement>(".brand-wordmark")!;

  expect(brand.matches('a.brand-horizontal[href="/"][data-route]')).toBe(true);
  expect(potato.alt).toBe("");
  expect(potato.getAttribute("srcset")).toContain("almanpedia-potato-96.png 96w");
  expect(potato.getAttribute("srcset")).toContain("almanpedia-potato.png 973w");
  expect(potato.getAttribute("sizes")).toBe("60px");
  expect(wordmark.getAttribute("src")).toBe("/brand/almanpedia-wordmark.svg");
  expect(wordmark.alt).toBe("ALMANPEDIA – Die freie Enzyklopädie, vereinfacht");
  expect(wordmark.width).toBe(5477);
  expect(wordmark.height).toBe(1305);
  expect(brand.querySelector(".brand-sub")).toBeNull();
});

test("wordmark uses official Linux Libertine small caps and outlined paths", () => {
  const svg = readFileSync(
    resolve(process.cwd(), "almanpedia/public/brand/almanpedia-wordmark.svg"),
    "utf8",
  );

  expect(svg).toContain("<title id=\"title\">ALMANPEDIA</title>");
  expect(svg).toContain(
    "<desc id=\"description\">Die freie Enzyklopädie, vereinfacht</desc>",
  );
  expect(svg).toContain('data-outline-source="LinLibertine_Re-4.7.3.otf"');
  expect(svg).toContain('data-lettering="small-caps"');
  expect(svg).toContain('data-line-gap="120"');
  expect(svg).not.toContain("<text");
  expect(svg.match(/<path /gu)).toHaveLength(42);
  expect(svg.match(/scale\(1 -1\)/gu)).toHaveLength(10);
  expect(svg.match(/scale\(0\.38104 -0\.38104\)/gu)).toHaveLength(32);
});

test("the landing heading names the site in text, since the figure carries the mark", () => {
  const heading = createLandingHeading();

  expect(heading.matches("h1.sr-only")).toBe(true);
  expect(heading.textContent).toBe("ALMANPEDIA — Die freie Enzyklopädie, vereinfacht");
  // The brand at full size belongs to the figure's first act, not to a second
  // masthead stacked above it.
  expect(heading.querySelector("img")).toBeNull();
});
