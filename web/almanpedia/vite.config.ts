import { defineConfig, type Plugin } from "vite";

/**
 * Serve the bundle's own assets as same-origin requests.
 *
 * Vite marks the emitted `<script type="module">` and `<link rel="stylesheet">`
 * `crossorigin`, which makes the browser fetch them in CORS mode and send an
 * `Origin` header. Everything here is same-origin, so the attribute buys nothing
 * and cost production a day: Cloudflare Pages answers a request for a missing file
 * with `index.html` and a 200 rather than a 404, `public/_headers` marks
 * `/assets/*` immutable for a year, and Pages caches CORS and non-CORS responses
 * under separate keys. One request during a deploy window was enough to pin
 * `text/html` into the CORS variant of the stylesheet URL, after which every
 * browser refused the stylesheet on MIME grounds and the site rendered unstyled —
 * while a plain `curl` of the same URL returned correct CSS.
 *
 * Without the attribute the browser sends no `Origin`, so it reads the same cache
 * variant an ordinary fetch does, and a poisoned CORS entry cannot be reached.
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
 * Bumped to retire built asset URLs.
 *
 * A content hash cannot rescue a URL whose *cache entry* is wrong. Cloudflare
 * answered a request for one of these files with `index.html` during a deploy and
 * `_headers` marks `/assets/*` immutable for a year, so the URL is burnt while its
 * content is fine and rebuilding produces the same name. Changing this changes
 * every asset name, which is the only way to walk away from the entry without a
 * cache purge.
 *
 * Serving a real 404 for a missing asset would prevent it, but the `_redirects`
 * rewrite that would have kept `/wiki/*` working alongside a `404.html` was
 * ignored by Pages and every article URL returned the 404 page, so that approach
 * is out. `CDN-Cache-Control` in `public/_headers` bounds the damage instead: a
 * wrong edge entry ages out in ten minutes rather than a year.
 */
const CACHE_GENERATION = "g2";

export default defineConfig({
  plugins: [sameOriginAssets()],
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
  },
});
