import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vitest";

const publicDirectory = resolve(process.cwd(), "almanpedia/public");

test("article routes use the SPA while missing assets use the real 404", () => {
  const notFound = readFileSync(resolve(publicDirectory, "404.html"), "utf8");
  expect(existsSync(resolve(publicDirectory, "404.html"))).toBe(true);
  expect(notFound).toContain('<html lang="de">');
  expect(notFound).toContain("BESCHEID AP-404");

  const rules = readFileSync(resolve(publicDirectory, "_redirects"), "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  expect(rules).toEqual(["/wiki/* / 200"]);

  const headers = readFileSync(resolve(publicDirectory, "_headers"), "utf8");
  expect(headers).not.toMatch(/immutable|max-age=31536000|CDN-Cache-Control/iu);
});
