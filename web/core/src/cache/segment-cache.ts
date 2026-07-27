/**
 * IndexedDB cache of validated segment translations keyed by model revision,
 * runtime-policy revision, and the SHA-256 of the NFC-normalized source.
 * Failures degrade to cache misses; callers must treat this layer as best effort.
 */
export interface SegmentCache {
  get(source: string): Promise<string | undefined>;
  put(source: string, target: string): Promise<void>;
  delete(source: string): Promise<void>;
}

export interface SegmentCacheOptions {
  modelRevision: string;
  policyRevision: string;
  dbName?: string;
  maxEntries?: number;
}

interface SegmentRow {
  key: string;
  target: string;
  lastUsed: number;
}

const STORE = "segments";
const TRIM_CHECK_EVERY = 250;

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

export function createSegmentCache({
  modelRevision,
  policyRevision,
  dbName = "alman-segment-cache",
  maxEntries = 50_000,
}: SegmentCacheOptions): SegmentCache {
  let dbPromise: Promise<IDBDatabase> | null = null;
  let putsSinceTrim = 0;

  function open(): Promise<IDBDatabase> {
    dbPromise ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore(STORE, { keyPath: "key" });
        store.createIndex("lastUsed", "lastUsed");
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
    });
    return dbPromise;
  }

  async function key(source: string): Promise<string> {
    return `${modelRevision}:${policyRevision}:${await sha256Hex(source.normalize("NFC"))}`;
  }

  async function trimIfNeeded(db: IDBDatabase): Promise<void> {
    putsSinceTrim += 1;
    if (putsSinceTrim < TRIM_CHECK_EVERY) return;
    putsSinceTrim = 0;
    const countTx = db.transaction(STORE, "readonly");
    const count = await requestToPromise(countTx.objectStore(STORE).count());
    if (count <= maxEntries) return;
    const excess = count - maxEntries + Math.floor(maxEntries / 10);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const cursorRequest = tx.objectStore(STORE).index("lastUsed").openCursor();
      let removed = 0;
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (!cursor || removed >= excess) {
          resolve();
          return;
        }
        cursor.delete();
        removed += 1;
        cursor.continue();
      };
      cursorRequest.onerror = () => reject(cursorRequest.error ?? new Error("trim failed"));
    });
  }

  return {
    async get(source) {
      const cacheKey = await key(source);
      const db = await open();
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const row = (await requestToPromise(store.get(cacheKey))) as SegmentRow | undefined;
      if (!row) return undefined;
      store.put({ ...row, lastUsed: Date.now() });
      return row.target;
    },
    async put(source, target) {
      const db = await open();
      const row: SegmentRow = { key: await key(source), target, lastUsed: Date.now() };
      const tx = db.transaction(STORE, "readwrite");
      await requestToPromise(tx.objectStore(STORE).put(row));
      await trimIfNeeded(db);
    },
    async delete(source) {
      const cacheKey = await key(source);
      const db = await open();
      const tx = db.transaction(STORE, "readwrite");
      await requestToPromise(tx.objectStore(STORE).delete(cacheKey));
    },
  };
}
