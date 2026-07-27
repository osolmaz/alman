import { sha256 } from "@noble/hashes/sha2.js";
import { MODEL_PACKAGE, assetUrl, type ModelPackageFile } from "./manifest";
import type { AssetProgress } from "./protocol";

const CACHE_PREFIX = "alman-model-";
export const MODEL_ASSET_DB_NAME = "alman-model-assets";
const MODEL_ASSET_STORE = "assets";

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

export async function modelAssetSha256(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = globalThis.crypto?.subtle
    ? new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", bytes))
    : sha256(bytes);
  return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function contentType(path: string): string {
  return path.endsWith(".json") ? "application/json" : "application/octet-stream";
}

export interface ModelAssetStore {
  match(key: string): Promise<Response | undefined>;
  put(key: string, response: Response): Promise<void>;
}

class MemoryAssetStore implements ModelAssetStore {
  private responses = new Map<string, Response>();

  async match(key: string): Promise<Response | undefined> {
    return this.responses.get(key)?.clone();
  }

  async put(key: string, response: Response): Promise<void> {
    this.responses.set(key, response.clone());
  }
}

class LayeredAssetStore implements ModelAssetStore {
  constructor(private readonly stores: ModelAssetStore[]) {}

  async match(key: string): Promise<Response | undefined> {
    for (const store of this.stores) {
      try {
        const response = await store.match(key);
        if (response) return response;
      } catch {
        // Try the next storage API when this one is blocked or unavailable.
      }
    }
    return undefined;
  }

  async put(key: string, response: Response): Promise<void> {
    let lastError: unknown;
    for (const store of this.stores) {
      try {
        await store.put(key, response.clone());
        return;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error("model asset storage failed");
  }
}

interface IndexedDbAssetRow {
  id: string;
  revision: string;
  body: Blob;
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function idbTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

function openAssetDatabase(factory: IDBFactory, dbName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(dbName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(MODEL_ASSET_STORE)) {
        request.result.createObjectStore(MODEL_ASSET_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

export interface IndexedDbModelAssetStore extends ModelAssetStore {
  deleteStale(): Promise<void>;
  close(): void;
}

/** Persistent fallback for HTTP previews and browsers without Cache Storage. */
export async function openIndexedDbModelAssetStore({
  factory,
  revision = MODEL_PACKAGE.revision,
  dbName = MODEL_ASSET_DB_NAME,
}: {
  factory: IDBFactory;
  revision?: string;
  dbName?: string;
}): Promise<IndexedDbModelAssetStore> {
  const database = await openAssetDatabase(factory, dbName);
  const rowId = (key: string) => `${revision}\u0000${key}`;

  return {
    async match(key) {
      const transaction = database.transaction(MODEL_ASSET_STORE, "readonly");
      const row = await idbRequest(transaction.objectStore(MODEL_ASSET_STORE).get(rowId(key))) as IndexedDbAssetRow | undefined;
      return row ? new Response(row.body, { headers: { "Content-Type": row.body.type } }) : undefined;
    },
    async put(key, response) {
      const body = await response.blob();
      const transaction = database.transaction(MODEL_ASSET_STORE, "readwrite");
      const complete = idbTransaction(transaction);
      transaction.objectStore(MODEL_ASSET_STORE).put({ id: rowId(key), revision, body } satisfies IndexedDbAssetRow);
      await complete;
    },
    async deleteStale() {
      const transaction = database.transaction(MODEL_ASSET_STORE, "readwrite");
      const complete = idbTransaction(transaction);
      const request = transaction.objectStore(MODEL_ASSET_STORE).openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        const row = cursor.value as IndexedDbAssetRow;
        if (row.revision !== revision) cursor.delete();
        cursor.continue();
      };
      request.onerror = () => transaction.abort();
      await complete;
    },
    close() {
      database.close();
    },
  };
}

const memoryAssetStores = new Map<string, MemoryAssetStore>();

function currentMemoryAssetStore(): MemoryAssetStore {
  let store = memoryAssetStores.get(modelCacheName());
  if (!store) {
    store = new MemoryAssetStore();
    memoryAssetStores.set(modelCacheName(), store);
  }
  return store;
}

async function openModelAssetStore(): Promise<ModelAssetStore> {
  const stores: ModelAssetStore[] = [];
  if (typeof caches !== "undefined") {
    try {
      stores.push(await caches.open(modelCacheName()));
    } catch {
      // IndexedDB remains available in many contexts where Cache Storage fails.
    }
  }
  if (typeof indexedDB !== "undefined") {
    try {
      stores.push(await openIndexedDbModelAssetStore({ factory: indexedDB }));
    } catch {
      // The memory store still lets the current page initialize.
    }
  }
  stores.push(currentMemoryAssetStore());
  return new LayeredAssetStore(stores);
}

export async function deleteStaleModelCaches(): Promise<void> {
  if (typeof caches !== "undefined") {
    try {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== modelCacheName())
          .map((name) => caches.delete(name)),
      );
    } catch {
      // Continue with other stores.
    }
  }
  if (typeof indexedDB !== "undefined") {
    try {
      const store = await openIndexedDbModelAssetStore({ factory: indexedDB });
      await store.deleteStale();
      store.close();
    } catch {
      // Stale cleanup is best effort.
    }
  }
  for (const name of memoryAssetStores.keys()) {
    if (name.startsWith(CACHE_PREFIX) && name !== modelCacheName()) memoryAssetStores.delete(name);
  }
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
  const digest = await modelAssetSha256(bytes);
  if (digest !== file.sha256) {
    throw new Error(`model asset integrity check failed: ${file.path}`);
  }
  return bytes;
}

async function cachedAssetIsValid(file: ModelPackageFile, response: Response): Promise<boolean> {
  try {
    const bytes = new Uint8Array(await response.arrayBuffer()) as Uint8Array<ArrayBuffer>;
    return bytes.byteLength === file.bytes && await modelAssetSha256(bytes) === file.sha256;
  } catch {
    return false;
  }
}

export interface EnsureModelAssetsOptions {
  baseUrl?: string;
  onProgress?: (progress: AssetProgress) => void;
}

/**
 * Ensures every manifest file is present and verified in persistent browser
 * storage. Downloads are streamed with progress and rejected on any mismatch.
 */
export async function ensureModelAssets({ baseUrl, onProgress }: EnsureModelAssetsOptions = {}): Promise<ModelAssetStore> {
  try {
    await globalThis.navigator?.storage?.persist?.();
  } catch {
    // Best effort only.
  }
  await deleteStaleModelCaches().catch(() => {});
  const cache = await openModelAssetStore();

  const missing: ModelPackageFile[] = [];
  for (const file of MODEL_PACKAGE.files) {
    const cached = await cache.match(modelCacheKey(file.path));
    if (!cached || !await cachedAssetIsValid(file, cached)) missing.push(file);
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
