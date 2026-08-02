import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vitest";

const publicDirectory = resolve(process.cwd(), "almanpedia/public");

test("Cloudflare Pages serves direct article URLs through the SPA shell", () => {
  // A top-level 404.html disables Pages' automatic SPA fallback.
  expect(existsSync(resolve(publicDirectory, "404.html"))).toBe(false);

  const rules = readFileSync(resolve(publicDirectory, "_redirects"), "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  expect(rules).toEqual(["/wiki/* / 200"]);
});
