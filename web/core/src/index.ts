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
export {
  createValidatedSegmentService,
  splitRejectedSegment,
  type SegmentOutcomeReason,
  type SegmentServiceDiagnostics,
  type ValidatedSegmentService,
  type ValidatedSegmentServiceOptions,
} from "./engine/segment-service";
export {
  TRANSLATION_RUNTIME_POLICY_REVISION,
  outputTokenBudget,
  validateTranslationOutput,
  type OutputValidationReason,
  type OutputValidationResult,
} from "./engine/validation";
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
  createTranslatedTextNodes,
  translateBlockPlan,
  type BlockAnchor,
  type BlockTextRun,
  type BlockTranslationPlan,
  type BlockTranslationResult,
  type TextUpdate,
} from "./dom/block-plan";
export {
  createDomTranslator,
  type DomTranslationBlockEvent,
  type DomTranslationBlockState,
  type DomTranslationStats,
  type DomTranslatorController,
  type DomTranslatorOptions,
} from "./dom/pipeline";
export { createSegmentCache, type SegmentCache, type SegmentCacheOptions } from "./cache/segment-cache";

import { createSafeTranslator, type SafeTranslator, type SegmentTranslator } from "./engine/safe-translation";
import type { LanguageDetector } from "./engine/detectors";
import { createValidatedSegmentService } from "./engine/segment-service";
import type { TranslationClient } from "./model/client";
import type { SegmentCache } from "./cache/segment-cache";

export interface AlmanEngineOptions {
  client: TranslationClient;
  detector: LanguageDetector;
  cache?: SegmentCache;
  /** Use when the client endpoint already owns validation and persistent caching. */
  segmentTranslator?: SegmentTranslator;
  sourceMaxTokens?: number;
  minimumGermanConfidence?: number;
  timeoutMs?: number;
  locale?: string;
}

/**
 * Composes the model runtime client, a language detector, and the optional
 * segment cache into the frozen safe-translation engine.
 */
export function createAlmanEngine({
  client,
  detector,
  cache,
  segmentTranslator,
  ...engineOptions
}: AlmanEngineOptions): SafeTranslator {
  const validatedService = segmentTranslator ? null : createValidatedSegmentService({ client, cache });
  const translator = segmentTranslator ?? validatedService!;
  const tokenCounter = validatedService
    ? (text: string) => validatedService.countTokens(text)
    : (text: string) => client.countTokens(text);
  return createSafeTranslator({ translator, detector, tokenCounter, ...engineOptions });
}
