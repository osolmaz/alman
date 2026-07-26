/** Same role as almanpedia/scripts/copy-ort.mjs: stage the qualified ORT WASM
 * runtime as extension assets under public/ort/. */
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const entry = require.resolve("onnxruntime-web");
const packageRoot = entry.slice(0, entry.lastIndexOf(`${sep}onnxruntime-web${sep}`) + `${sep}onnxruntime-web`.length);
const dist = join(packageRoot, "dist");

const here = dirname(fileURLToPath(import.meta.url));
const target = join(here, "..", "public", "ort");
mkdirSync(target, { recursive: true });

for (const file of ["ort-wasm-simd-threaded.asyncify.mjs", "ort-wasm-simd-threaded.asyncify.wasm"]) {
  copyFileSync(join(dist, file), join(target, file));
}
console.log("copied ORT WASM runtime to public/ort/");
