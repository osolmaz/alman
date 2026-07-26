import {
  MODEL_PACKAGE,
  createAlmanEngine,
  createSegmentCache,
  createWorkerClient,
  tinyldDetector,
  type AssetProgress,
  type SafeTranslator,
  type TranslationClient,
} from "@alman/core";

let client: TranslationClient | null = null;
let engine: SafeTranslator | null = null;

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
    detector: tinyldDetector(),
    cache: createSegmentCache({ modelRevision: MODEL_PACKAGE.revision }),
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
