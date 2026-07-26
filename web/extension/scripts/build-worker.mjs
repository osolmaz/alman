/**
 * Prebuilds the translation worker as a stable-named ES module at
 * public/ort/worker.js. Building it outside WXT's entrypoint pipeline keeps
 * the ~24MB ORT WASM out of the background bundle graph (Vite inlines assets
 * into workers spawned from single-file builds) and lets every context spawn
 * the same worker via runtime.getURL().
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const here = dirname(fileURLToPath(import.meta.url));

await build({
  configFile: false,
  logLevel: "warn",
  root: resolve(here, ".."),
  publicDir: false,
  build: {
    outDir: resolve(here, "..", "public", "ort"),
    emptyOutDir: false,
    target: "es2022",
    assetsInlineLimit: 0,
    rollupOptions: {
      input: resolve(here, "..", "src", "translate-worker.ts"),
      output: {
        format: "es",
        entryFileNames: "worker.js",
        chunkFileNames: "worker-[hash].js",
        // Keep original asset names so ORT's runtime lookups by exact
        // filename (wasmPaths + name) keep working.
        assetFileNames: "[name][extname]",
      },
    },
  },
});
console.log("built public/ort/worker.js");
