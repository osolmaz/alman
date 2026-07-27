# Browser model cache

Alman web products keep the GoePT-1-20M files in browser storage after the first download. A page reload creates a new model runtime, but the runtime reads the 34 MB package from the model cache. It does not download the model files again.

## Storage order

`web/core/src/model/assets.ts` gives Transformers.js one model cache. That model cache tries Cache Storage first. If Cache Storage is missing or blocked, it tries IndexedDB. A final in-memory store lets the current page run when persistent browser storage is unavailable.

IndexedDB matters for plain HTTP previews because those pages may not receive the Cache Storage API. Each IndexedDB row records the model revision, the Transformers.js request key, and the response body as a `Blob`. The request key is independent of the download host, so a mirror can use the same cached files.

A storage failure moves the write to the next store. The write stops after one store accepts it, which avoids keeping duplicate model files under normal conditions.

## File checks

The model manifest pins the size and SHA-256 digest of every model file. A download is checked before it enters the model cache. A cached file is checked again when the worker starts. Missing, truncated, or modified files are downloaded again and replace the bad cache entry.

Cache Storage has one cache name for each model revision. IndexedDB prefixes each row key with the model revision. Startup cleanup removes rows and caches from old revisions. The in-memory fallback follows the same rule.

The worker asks the browser to retain the model cache through `navigator.storage.persist()` when that API exists. Browsers can still enforce their own storage quotas and eviction rules.

## Reload behavior

Transformers.js can load only from the checked model cache because remote model loading is disabled. The ONNX runtime files remain versioned site assets and are handled by the normal browser HTTP cache.

A reload still starts a Web Worker, compiles the ONNX model, and performs one warm-up generation. These steps use the cached model files and can take a short time. Closing the page releases the compiled model and its WASM memory while leaving the model files in persistent browser storage.
