import {
  MODEL_PACKAGE,
  TRANSLATION_RUNTIME_POLICY_REVISION,
  createAlmanEngine,
  createSegmentCache,
  createWorkerClient,
  fixedDetector,
  type AssetProgress,
  type SafeTranslator,
  type TranslationClient,
} from "@alman/core";

let client: TranslationClient | null = null;
let engine: SafeTranslator | null = null;

/** Almanpedia content comes from the German Wikipedia REST API by construction. */
export const germanWikipediaDetector = fixedDetector({ language: "de", confidence: 1 });

export function getClient(): TranslationClient {
  client ??= createWorkerClient({
    createWorker: () => new Worker(new URL("./translate-worker.ts", import.meta.url), { type: "module" }),
    wasmBaseUrl: new URL("/ort/", window.location.href).href,
    // Optional same-origin mirror of the model files (local dev, or serving
    // the package from Pages instead of the HF CDN).
    assetBaseUrl: (import.meta.env.VITE_MODEL_BASE_URL as string | undefined)
      ? new URL(import.meta.env.VITE_MODEL_BASE_URL as string, window.location.href).href
      : undefined,
  });
  return client;
}

export function getEngine(): SafeTranslator {
  engine ??= createAlmanEngine({
    client: getClient(),
    // Per-sentence detection skips German prose containing many foreign names.
    // The browser extension still uses detection because it accepts arbitrary pages.
    detector: germanWikipediaDetector,
    cache: createSegmentCache({
      modelRevision: MODEL_PACKAGE.revision,
      policyRevision: TRANSLATION_RUNTIME_POLICY_REVISION,
    }),
  });
  return engine;
}

export function initModel(onProgress?: (progress: AssetProgress) => void): Promise<{ coldStartMs: number }> {
  return getClient().init(onProgress);
}

window.addEventListener("pagehide", () => {
  void client?.dispose();
  client = null;
  engine = null;
});
