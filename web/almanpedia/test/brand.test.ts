// @vitest-environment happy-dom
import { expect, test } from "vitest";
import { createHeaderBrand, createLandingBrand } from "../src/ui/brand";

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
  expect(wordmark.alt).toBe("Almanpedia");
  expect(brand.textContent).toContain("Die freie Enzyklopädie, amtlich vereinfacht");
});

test("landing brand uses the same assets in a vertical heading", () => {
  const brand = createLandingBrand();
  const potato = brand.querySelector<HTMLImageElement>(".brand-potato")!;

  expect(brand.matches("h1.brand-vertical")).toBe(true);
  expect(potato.getAttribute("sizes")).toBe("(max-width: 40rem) 160px, 220px");
  expect(brand.querySelector<HTMLImageElement>(".brand-wordmark")?.alt).toBe("Almanpedia");
});
