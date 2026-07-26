import { MODEL_PACKAGE, assetUrl, type ModelPackageFile } from "./manifest";
import type { AssetProgress } from "./protocol";

const CACHE_PREFIX = "alman-model-";

/**
 * Cache keys use a synthetic origin so cached bytes stay valid when the
 * download base URL changes (HF CDN today, a same-origin mirror tomorrow).
 * The same base doubles as transformers.js `localModelPath`, so the file
 * URLs it requests are exactly our cache keys.
 */
export const MODEL_CACHE_KEY_BASE = "https://model.alman.internal/";

export function modelCacheName(revision: string = MODEL_PACKAGE.revision): string {
  return `${CACHE_PREFIX}${revision}`;
}

export function modelCacheKey(path: string): string {
  return `${MODEL_CACHE_KEY_BASE}${path}`;
}

async function sha256Hex(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function contentType(path: string): string {
  return path.endsWith(".json") ? "application/json" : "application/octet-stream";
}

export async function deleteStaleModelCaches(): Promise<void> {
  const names = await caches.keys();
  await Promise.all(
    names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== modelCacheName())
      .map((name) => caches.delete(name)),
  );
}

async function downloadVerified(
  file: ModelPackageFile,
  baseUrl: string | undefined,
  onChunk: (loaded: number) => void,
): Promise<Uint8Array<ArrayBuffer>> {
  const response = await fetch(assetUrl(file.path, baseUrl));
  if (!response.ok || !response.body) {
    throw new Error(`model asset download failed: ${file.path} (HTTP ${response.status})`);
  }
  const reader = response.body.getReader();
  const bytes = new Uint8Array(new ArrayBuffer(file.bytes));
  let offset = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (offset + value.byteLength > file.bytes) {
      await reader.cancel().catch(() => {});
      throw new Error(`model asset larger than manifest: ${file.path}`);
    }
    bytes.set(value, offset);
    offset += value.byteLength;
    onChunk(offset);
  }
  if (offset !== file.bytes) {
    throw new Error(`model asset size mismatch: ${file.path} (${offset} of ${file.bytes} bytes)`);
  }
  const digest = await sha256Hex(bytes);
  if (digest !== file.sha256) {
    throw new Error(`model asset integrity check failed: ${file.path}`);
  }
  return bytes;
}

export interface EnsureModelAssetsOptions {
  baseUrl?: string;
  onProgress?: (progress: AssetProgress) => void;
}

/**
 * Ensures every manifest file is present and verified in the model cache.
 * Downloads are streamed with progress, hashed, and rejected on any mismatch.
 */
export async function ensureModelAssets({ baseUrl, onProgress }: EnsureModelAssetsOptions = {}): Promise<Cache> {
  try {
    await (navigator as { storage?: { persist?: () => Promise<boolean> } }).storage?.persist?.();
  } catch {
    // Best effort only.
  }
  await deleteStaleModelCaches().catch(() => {});
  const cache = await caches.open(modelCacheName());

  const missing: ModelPackageFile[] = [];
  for (const file of MODEL_PACKAGE.files) {
    if (!(await cache.match(modelCacheKey(file.path)))) missing.push(file);
  }
  const overallTotal = MODEL_PACKAGE.totalBytes;
  let overallLoaded = overallTotal - missing.reduce((sum, file) => sum + file.bytes, 0);

  for (const file of missing) {
    const bytes = await downloadVerified(file, baseUrl, (loaded) => {
      onProgress?.({
        file: file.path,
        loaded,
        total: file.bytes,
        overallLoaded: overallLoaded + loaded,
        overallTotal,
        phase: "download",
      });
    });
    await cache.put(
      modelCacheKey(file.path),
      new Response(bytes, { headers: { "Content-Type": contentType(file.path) } }),
    );
    overallLoaded += file.bytes;
  }
  return cache;
}
