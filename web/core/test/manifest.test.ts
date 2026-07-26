import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { expect, test } from "vitest";
import { MODEL_PACKAGE, assetUrl } from "../src/model/manifest";
import { modelCacheKey, MODEL_CACHE_KEY_BASE } from "../src/model/assets";

test("manifest is internally consistent", () => {
  expect(MODEL_PACKAGE.files).toHaveLength(6);
  const total = MODEL_PACKAGE.files.reduce((sum, file) => sum + file.bytes, 0);
  expect(total).toBe(MODEL_PACKAGE.totalBytes);
  for (const file of [...MODEL_PACKAGE.files, ...MODEL_PACKAGE.wasm]) {
    expect(file.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(file.bytes).toBeGreaterThan(0);
  }
});

test("asset URLs resolve against the pinned repo and custom bases", () => {
  expect(assetUrl("model/config.json")).toBe(
    `https://huggingface.co/${MODEL_PACKAGE.repo}/resolve/${MODEL_PACKAGE.revision}/model/config.json`,
  );
  expect(assetUrl("model/config.json", "https://example.org/pkg/")).toBe("https://example.org/pkg/model/config.json");
  expect(assetUrl("model/config.json", "https://example.org/pkg")).toBe("https://example.org/pkg/model/config.json");
});

test("cache keys live under the synthetic model origin", () => {
  expect(modelCacheKey("model/tokenizer.json")).toBe(`${MODEL_CACHE_KEY_BASE}model/tokenizer.json`);
});

test("npm onnxruntime-web dist is hash-identical to the qualified WASM runtime", () => {
  const require = createRequire(import.meta.url);
  // onnxruntime-web does not export package.json; resolve the entry point and
  // walk back to the package's dist directory.
  const entry = require.resolve("onnxruntime-web");
  const packageRoot = entry.slice(0, entry.lastIndexOf(`${sep}onnxruntime-web${sep}`) + `${sep}onnxruntime-web`.length);
  const ortDist = join(packageRoot, "dist");
  for (const file of MODEL_PACKAGE.wasm) {
    const local = join(ortDist, file.path.replace("wasm/", ""));
    expect(statSync(local).size, file.path).toBe(file.bytes);
    const digest = createHash("sha256").update(readFileSync(local)).digest("hex");
    expect(digest, file.path).toBe(file.sha256);
  }
});
