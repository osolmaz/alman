/**
 * Copies the ONNX Runtime WASM runtime (the exact build the model package
 * qualified with — hash parity is enforced by web/core tests) into public/ort/
 * so the translator page's worker can load it same-origin.
 */
import { copyFileSync, mkdirSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// @alman/core is a file: link to ../web/core, and onnxruntime-web (a
// transformers.js dependency) lives in web/node_modules — resolve from there.
const coreDir = realpathSync(join(here, "..", "node_modules", "@alman", "core"));
let entry;
try {
  entry = require.resolve("onnxruntime-web", { paths: [coreDir] });
} catch {
  throw new Error(
    "onnxruntime-web not found — @alman/core resolves its dependencies from web/node_modules; run `npm install` in web/ first",
  );
}
const packageRoot = entry.slice(0, entry.lastIndexOf(`${sep}onnxruntime-web${sep}`) + `${sep}onnxruntime-web`.length);
const dist = join(packageRoot, "dist");

const target = join(here, "..", "public", "ort");
mkdirSync(target, { recursive: true });

for (const file of ["ort-wasm-simd-threaded.asyncify.mjs", "ort-wasm-simd-threaded.asyncify.wasm"]) {
  copyFileSync(join(dist, file), join(target, file));
}
console.log("copied ORT WASM runtime to public/ort/");
