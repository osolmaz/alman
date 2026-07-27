import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { IDBFactory } from "fake-indexeddb";
import { expect, test, vi } from "vitest";
import { MODEL_PACKAGE, assetUrl } from "../src/model/manifest";
import {
  MODEL_CACHE_KEY_BASE,
  modelAssetSha256,
  modelCacheKey,
  openIndexedDbModelAssetStore,
} from "../src/model/assets";

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

test("model asset hashing works without the secure-context Web Crypto API", async () => {
  vi.stubGlobal("crypto", undefined);
  try {
    const bytes = new TextEncoder().encode("abc") as Uint8Array<ArrayBuffer>;
    expect(await modelAssetSha256(bytes)).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  } finally {
    vi.unstubAllGlobals();
  }
});

test("IndexedDB model assets survive store reopen and preserve response metadata", async () => {
  const factory = new IDBFactory();
  const options = { factory, revision: "revision-a", dbName: "model-assets-persistence-test" };
  const first = await openIndexedDbModelAssetStore(options);
  await first.put(modelCacheKey("model/config.json"), new Response("cached model", {
    headers: { "Content-Type": "application/json" },
  }));
  first.close();

  const reopened = await openIndexedDbModelAssetStore(options);
  const response = await reopened.match(modelCacheKey("model/config.json"));
  expect(response?.headers.get("Content-Type")).toBe("application/json");
  expect(await response?.text()).toBe("cached model");
  reopened.close();
});

test("IndexedDB model asset cleanup removes superseded revisions", async () => {
  const factory = new IDBFactory();
  const dbName = "model-assets-revision-test";
  const oldStore = await openIndexedDbModelAssetStore({ factory, revision: "old", dbName });
  await oldStore.put(modelCacheKey("model/config.json"), new Response("old model"));
  oldStore.close();

  const currentStore = await openIndexedDbModelAssetStore({ factory, revision: "current", dbName });
  await currentStore.deleteStale();
  currentStore.close();

  const oldStoreAfterCleanup = await openIndexedDbModelAssetStore({ factory, revision: "old", dbName });
  expect(await oldStoreAfterCleanup.match(modelCacheKey("model/config.json"))).toBeUndefined();
  oldStoreAfterCleanup.close();
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
