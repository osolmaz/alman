import { defineConfig, type Plugin } from "vite";
import assetGeneration from "./asset-generation.json";

/**
 * Serve the bundle's own assets as same-origin requests.
 *
 * Vite marks the emitted `<script type="module">` and `<link rel="stylesheet">`
 * `crossorigin`. The module script uses CORS either way, but the same-origin
 * stylesheet does not need it. Removing the attribute keeps the stylesheet on
 * the ordinary same-origin cache path and avoids a second cache variant.
 *
 * Missing assets now return a real 404 through the narrow Pages Functions in
 * `../functions/`; this plugin is only a request-mode simplification, not the
 * cache-poisoning safeguard.
 */
function sameOriginAssets(): Plugin {
  return {
    name: "alman-same-origin-assets",
    enforce: "post",
    transformIndexHtml(html) {
      return html.replace(/(<(?:script|link)\b[^>]*?)\s+crossorigin(=(?:"[^"]*"|'[^']*'|[^\s>]*))?/gu, "$1");
    },
  };
}

/**
 * Stable namespace introduced when the first poisoned asset URLs were retired.
 * Keep it unchanged unless an incident requires abandoning this generation.
 * Normal safety comes from real asset 404s and Cloudflare Pages' default
 * revalidation policy, not from changing this value after every build.
 */
const CACHE_GENERATION = assetGeneration.generation;

export default defineConfig({
  plugins: [sameOriginAssets()],
  server: {
    /*
     * The dev server is reachable from another machine on the tailnet, where this
     * app is served under a MagicDNS name and a phone or a laptop opens it as
     * `https://<host>.<tailnet>.ts.net`. `--host` binds the socket but does not
     * answer for that name: Vite refuses a Host header it was not told about, which
     * is the DNS-rebinding guard, so the tailnet domain is allowed here.
     */
    allowedHosts: [".ts.net"],
  },
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        assetFileNames: `assets/[name]-${CACHE_GENERATION}-[hash][extname]`,
        chunkFileNames: `assets/[name]-${CACHE_GENERATION}-[hash].js`,
        entryFileNames: `assets/[name]-${CACHE_GENERATION}-[hash].js`,
      },
    },
    // The polyfill is emitted as an inline script, which the Content-Security
    // Policy in public/_headers blocks outright. Every browser that can run this
    // bundle supports module preloading natively.
    modulePreload: { polyfill: false },
  },
  worker: {
    format: "es",
    rollupOptions: {
      output: {
        assetFileNames: `assets/[name]-${CACHE_GENERATION}-[hash][extname]`,
        chunkFileNames: `assets/[name]-${CACHE_GENERATION}-[hash].js`,
        entryFileNames: `assets/[name]-${CACHE_GENERATION}-[hash].js`,
      },
    },
  },
});
