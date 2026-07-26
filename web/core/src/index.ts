export {
  createSafeTranslator,
  elementBlocksTranslation,
  sentenceSegments,
  translateVisibleTextNodes,
  type ComputedStyleGetter,
  type SafeTranslator,
  type SafeTranslatorOptions,
  type SegmentTranslator,
} from "./engine/safe-translation";
export { fixedDetector, tinyldDetector, type Detection, type LanguageDetector } from "./engine/detectors";
export { GENERATION_PARAMS, MODEL_PACKAGE, assetUrl, type ModelPackageFile } from "./model/manifest";
export {
  MODEL_CACHE_KEY_BASE,
  deleteStaleModelCaches,
  ensureModelAssets,
  modelCacheKey,
  modelCacheName,
} from "./model/assets";
export type { AssetProgress, WorkerRequest, WorkerResponse } from "./model/protocol";
export {
  createPortClient,
  createWorkerClient,
  type MessageTransport,
  type TranslationClient,
  type WorkerClientOptions,
} from "./model/client";
export { collectTextBlocks, type TextBlock } from "./dom/blocks";
export {
  createBlockTranslationPlan,
  translateBlockPlan,
  type BlockPlaceholder,
  type BlockTranslationPlan,
  type BlockTranslationResult,
} from "./dom/block-plan";
export {
  createDomTranslator,
  type DomTranslationStats,
  type DomTranslatorController,
  type DomTranslatorOptions,
} from "./dom/pipeline";
export { createSegmentCache, type SegmentCache, type SegmentCacheOptions } from "./cache/segment-cache";

import { createSafeTranslator, type SafeTranslator, type SegmentTranslator } from "./engine/safe-translation";
import type { LanguageDetector } from "./engine/detectors";
import type { TranslationClient } from "./model/client";
import type { SegmentCache } from "./cache/segment-cache";

export interface AlmanEngineOptions {
  client: TranslationClient;
  detector: LanguageDetector;
  cache?: SegmentCache;
  sourceMaxTokens?: number;
  minimumGermanConfidence?: number;
  timeoutMs?: number;
  locale?: string;
}

/**
 * Composes the model runtime client, a language detector, and the optional
 * segment cache into the frozen safe-translation engine.
 */
export function createAlmanEngine({ client, detector, cache, ...engineOptions }: AlmanEngineOptions): SafeTranslator {
  const translator: SegmentTranslator = {
    async translate(texts) {
      const output: string[] = [];
      for (const text of texts) {
        let cached: string | undefined;
        if (cache) {
          try {
            cached = await cache.get(text);
          } catch {
            cached = undefined;
          }
        }
        if (cached !== undefined) {
          output.push(cached);
          continue;
        }
        const [translated] = await client.translate([text]);
        if (typeof translated !== "string") throw new Error("empty translation result");
        if (cache) {
          try {
            await cache.put(text, translated);
          } catch {
            // Cache failures must never fail translation.
          }
        }
        output.push(translated);
      }
      return output;
    },
    dispose: () => client.dispose(),
  };
  return createSafeTranslator({ translator, detector, tokenCounter: (text) => client.countTokens(text), ...engineOptions });
}
