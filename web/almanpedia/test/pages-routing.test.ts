import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vitest";

const publicDirectory = resolve(process.cwd(), "almanpedia/public");

test("article routes use the SPA while asset functions reject missing files", () => {
  expect(existsSync(resolve(publicDirectory, "404.html"))).toBe(false);

  const functionsDirectory = resolve(process.cwd(), "functions");
  expect(existsSync(resolve(functionsDirectory, "assets/[[path]].ts"))).toBe(true);
  expect(existsSync(resolve(functionsDirectory, "ort/[[path]].ts"))).toBe(true);

  const rules = readFileSync(resolve(publicDirectory, "_redirects"), "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  expect(rules).toEqual(["/wiki/* / 200"]);

  const headers = readFileSync(resolve(publicDirectory, "_headers"), "utf8");
  expect(headers).not.toMatch(/immutable|max-age=31536000|CDN-Cache-Control/iu);
});
