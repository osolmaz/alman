# Alman web products

Two client-side consumers of the GoePT-1-20M German→Alman translation model:
the **browser extension** (`extension/`) and **almanpedia.org** (`almanpedia/`),
sharing one engine (`core/`). The model runs entirely in the visitor's browser
(ONNX int8 + single-threaded WASM); there is no inference backend. Almanpedia's
reader behavior is documented in [`../docs/almanpedia-interface.md`](../docs/almanpedia-interface.md).
The persistent model store is documented in
[`../docs/browser-model-cache.md`](../docs/browser-model-cache.md).

## Model provenance and production sign-off

| Fact | Value |
| --- | --- |
| Production model | **GoePT-1-20M** (public mirror repo `osolmaz/GoePT-1-20M`) |
| Mirrored from | `osolmaz/alman-student-spm16k-base-10m-h50-onnx@8049cbd9cee1f9f417540e14df788022e9e7a5b7` |
| Research program | `ALMAN-TS-20260723-01` (see `alman-research`) |
| Quality | AlmanBench 893/1029 (86.78%) in-browser; sealed test 79.28% |
| Release gates | All passed (`browser.json` in the package) |
| Production approval | The release report recorded `approved_for_production: false`; **the maintainer (osolmaz) explicitly approved this candidate for production on 2026-07-26**, superseding that record. |

Integrity: every model file is pinned by SHA-256 in
[`core/src/model/manifest.ts`](core/src/model/manifest.ts) and verified before
use, at download time in browsers and in CI. The ORT WASM runtime shipped as
app assets is asserted hash-identical to the qualified package by
`core/test/manifest.test.ts`.

## Packages

- **`core/`** — `@alman/core`: the frozen safe-translation engine (TS port of
  the alman-research browser module, pinned by the ported 12-test safety
  suite in `core/test/safe-translation.test.ts`), the model runtime worker
  (`@alman/core/worker`, transformers.js pinned to the ORT build the model
  qualified with), DOM pipeline (visible-first, mutation-aware, original/Alman
  toggle), a persistent model asset store, and an IndexedDB segment cache.
- **`extension/`** — WXT MV3 extension for Chrome and Firefox. Default flow is
  on-demand via the popup (activeTab only); auto-translate is opt-in and
  requests `<all_urls>` at runtime. Inference host: offscreen document
  (Chrome) / background page (Firefox), one model instance per profile,
  disposed after 5 minutes idle.
- **`almanpedia/`** — Vite SPA for almanpedia.org: fetches German Wikipedia
  articles (Parsoid HTML via the CORS-enabled REST API), sanitizes (DOMPurify,
  hard-fails if unsupported) and rewrites them, then schedules the complete
  article for translation in the visitor's browser. The reader includes a
  Wikipedia-like responsive layout, persistent motion settings, source toggles,
  and a word-level comparison. Deployed to Cloudflare Pages; `de.almanpedia.org`
  is aliased so swapping `wikipedia` → `almanpedia` in any German Wikipedia URL
  works.

## Commands

```bash
cd web
npm install
npm run typecheck        # all packages
npm test                 # unit + ported frozen safety suite
npm run test:model       # real-model parity gate (needs ALMAN_MODEL_DIR)
npm run dev:pedia        # almanpedia dev server
npm run dev:ext          # extension dev (Chrome)
npm run build            # everything; extension zips via `npm run zip -w @alman/extension`
```

For the parity gate, fetch the pinned model once:

```bash
node --experimental-strip-types scripts/fetch-model.mjs ~/.cache/alman-model
MODEL_IT=1 ALMAN_MODEL_DIR=~/.cache/alman-model npm run test:model
```

It asserts exact output equality with predictions from the frozen browser
evaluation of the qualified artifact — a failure means transformers/ORT
version skew against the pinned `@huggingface/transformers` version. Do not
bump that dependency without re-running this gate.

## Deployment

- **almanpedia.org**: `.github/workflows/deploy-almanpedia.yml` deploys
  `almanpedia/dist` to the Cloudflare Pages project `almanpedia` on pushes to
  `main` touching `web/`. Required repo secrets: `CLOUDFLARE_API_TOKEN`
  (Pages:Edit), `CLOUDFLARE_ACCOUNT_ID`. One-time dashboard setup: create the
  Pages project and attach `almanpedia.org`, `www.almanpedia.org`, and
  `de.almanpedia.org`.
- **Extension**: CI (`web-test` job) uploads Chrome/Firefox zips as build
  artifacts. Store submission is manual for now.
- **CI secrets**: `HF_TOKEN` is only needed by the `web-model-parity` job
  while the model repo is private; drop it once `osolmaz/GoePT-1-20M` is
  public.

## Launch checklist

1. Publish the model mirror (maintainer):
   `hf repo create GoePT-1-20M --repo-type model` then
   `hf upload osolmaz/GoePT-1-20M <verified package dir> . --exclude ".cache/*"`.
2. Pin the mirror's commit hash as `revision` in
   `core/src/model/manifest.ts` (replaces `"main"`) and re-run
   `npm test && npm run test:model`.
3. Cloudflare Pages project + domains + repo secrets (above).
4. Manual extension matrix: Chrome + Firefox, a German news site, a
   strict-CSP site, a non-German page (must stay untouched), auto-translate
   permission flow.

## Notes

- Model assets use Cache Storage when available, IndexedDB on restricted or
  insecure origins, and memory as the final fallback. Every cached file is
  checked against the pinned manifest before use.
- The translation worker for the extension is prebuilt to a stable path
  (`extension/public/ort/worker.js`) by `extension/scripts/build-worker.mjs`;
  Vite's worker pipeline would otherwise inline the 24MB WASM into the
  background bundle as base64.
- Wikipedia content is CC BY-SA 4.0; every almanpedia article carries source,
  authors, and license attribution, and the machine translation is offered
  under the same license. `robots.txt` disallows `/wiki/` (mirrored content
  should not compete with Wikipedia in search).
