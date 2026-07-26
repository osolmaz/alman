import type { AssetProgress, WorkerRequest, WorkerResponse } from "./protocol";

export interface TranslationClient {
  /** Resolves once the model runtime is downloaded, verified, and warm. */
  init(onProgress?: (progress: AssetProgress) => void): Promise<{ coldStartMs: number }>;
  countTokens(text: string): Promise<number>;
  translate(texts: string[]): Promise<string[]>;
  dispose(): Promise<void>;
}

/** Transport abstraction so the same client runs over a Worker or an extension port. */
export interface MessageTransport {
  post(message: WorkerRequest): void;
  subscribe(listener: (message: WorkerResponse) => void): () => void;
}

interface Pending {
  resolve(value: WorkerResponse): void;
  reject(reason: Error): void;
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type RuntimeRequest = DistributiveOmit<Extract<WorkerRequest, { id: number }>, "id">;

class Correlator {
  private nextId = 1;
  private pending = new Map<number, Pending>();
  private progressListener: ((progress: AssetProgress) => void) | undefined;
  private readyResolvers: Array<{ resolve(value: { coldStartMs: number }): void; reject(reason: Error): void }> = [];

  constructor(private transport: MessageTransport) {}

  attach(): () => void {
    return this.transport.subscribe((message) => this.dispatch(message));
  }

  private dispatch(message: WorkerResponse): void {
    switch (message.type) {
      case "progress":
        this.progressListener?.(message.progress);
        return;
      case "ready": {
        const resolvers = this.readyResolvers.splice(0);
        for (const resolver of resolvers) resolver.resolve({ coldStartMs: message.coldStartMs });
        return;
      }
      case "count-tokens-result":
      case "translate-result": {
        const pending = this.pending.get(message.id);
        this.pending.delete(message.id);
        pending?.resolve(message);
        return;
      }
      case "error": {
        const error = new Error(message.message);
        error.name = message.name;
        if (message.id !== undefined) {
          const pending = this.pending.get(message.id);
          this.pending.delete(message.id);
          pending?.reject(error);
        } else {
          const resolvers = this.readyResolvers.splice(0);
          for (const resolver of resolvers) resolver.reject(error);
        }
        return;
      }
    }
  }

  init(request: { assetBaseUrl?: string; wasmBaseUrl: string }, onProgress?: (p: AssetProgress) => void): Promise<{ coldStartMs: number }> {
    if (onProgress) this.progressListener = onProgress;
    return new Promise((resolve, reject) => {
      this.readyResolvers.push({ resolve, reject });
      this.transport.post({ type: "init", ...request });
    });
  }

  request(message: RuntimeRequest): Promise<WorkerResponse> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.transport.post({ ...message, id } as WorkerRequest);
    });
  }

  failAll(reason: Error): void {
    for (const pending of this.pending.values()) pending.reject(reason);
    this.pending.clear();
    for (const resolver of this.readyResolvers.splice(0)) resolver.reject(reason);
  }

  post(message: WorkerRequest): void {
    this.transport.post(message);
  }
}

export interface WorkerClientOptions {
  /** Caller constructs the Worker so bundler-specific `new Worker(new URL(...))` stays at the edge. */
  createWorker: () => Worker;
  assetBaseUrl?: string;
  /** Directory URL serving the ORT WASM runtime files (app assets). */
  wasmBaseUrl: string;
  /**
   * Hard bound on worker *silence* while requests are pending. A wedged WASM
   * inference cannot be aborted, so when the worker emits nothing (results,
   * progress) for this long it is terminated and respawned; cached, verified
   * assets make the re-init cheap (~1s). Queue depth alone never trips it —
   * every worker message resets the clock.
   */
  hardTimeoutMs?: number;
}

export function createWorkerClient({
  createWorker,
  assetBaseUrl,
  wasmBaseUrl,
  hardTimeoutMs = 20_000,
}: WorkerClientOptions): TranslationClient {
  let worker: Worker | null = null;
  let correlator: Correlator | null = null;
  let detach: (() => void) | null = null;
  let initPromise: Promise<{ coldStartMs: number }> | null = null;
  let lastProgress: ((progress: AssetProgress) => void) | undefined;
  let disposed = false;
  let pendingRequests = 0;
  let lastActivity = 0;
  let watchdogTimer: ReturnType<typeof setInterval> | null = null;

  function watchdogCheck(): void {
    if (pendingRequests > 0 && Date.now() - lastActivity > hardTimeoutMs) {
      kill(new Error("translation runtime watchdog expired"));
    }
  }

  function spawn(): Correlator {
    const spawned = createWorker();
    const transport: MessageTransport = {
      post: (message) => spawned.postMessage(message),
      subscribe: (listener) => {
        const handler = (event: MessageEvent) => {
          lastActivity = Date.now();
          listener(event.data as WorkerResponse);
        };
        spawned.addEventListener("message", handler);
        return () => spawned.removeEventListener("message", handler);
      },
    };
    worker = spawned;
    correlator = new Correlator(transport);
    detach = correlator.attach();
    lastActivity = Date.now();
    watchdogTimer ??= setInterval(watchdogCheck, Math.min(hardTimeoutMs, 5_000));
    return correlator;
  }

  function kill(reason: Error): void {
    correlator?.failAll(reason);
    detach?.();
    worker?.terminate();
    worker = null;
    correlator = null;
    detach = null;
    initPromise = null;
    pendingRequests = 0;
    if (watchdogTimer) {
      clearInterval(watchdogTimer);
      watchdogTimer = null;
    }
  }

  function ensureInit(onProgress?: (progress: AssetProgress) => void): Promise<{ coldStartMs: number }> {
    if (disposed) return Promise.reject(new Error("translation client disposed"));
    if (onProgress) lastProgress = onProgress;
    if (!initPromise) {
      const active = correlator ?? spawn();
      pendingRequests += 1;
      initPromise = active
        .init({ assetBaseUrl, wasmBaseUrl }, lastProgress)
        .catch((error: Error) => {
          kill(error);
          throw error;
        })
        .finally(() => {
          pendingRequests = Math.max(0, pendingRequests - 1);
        });
    }
    return initPromise;
  }

  async function guarded(message: RuntimeRequest): Promise<WorkerResponse> {
    await ensureInit();
    const active = correlator;
    if (!active) throw new Error("translation runtime unavailable");
    pendingRequests += 1;
    lastActivity = Math.max(lastActivity, Date.now());
    try {
      return await active.request(message);
    } finally {
      pendingRequests = Math.max(0, pendingRequests - 1);
    }
  }

  return {
    init: (onProgress) => ensureInit(onProgress),
    async countTokens(text) {
      const response = await guarded({ type: "count-tokens", text });
      if (response.type !== "count-tokens-result") throw new Error("unexpected runtime response");
      return response.tokens;
    },
    async translate(texts) {
      const response = await guarded({ type: "translate", texts });
      if (response.type !== "translate-result") throw new Error("unexpected runtime response");
      return response.texts;
    },
    async dispose() {
      disposed = true;
      correlator?.post({ type: "dispose" });
      // Give the worker a beat to close cleanly, then hard-stop.
      await new Promise((resolve) => setTimeout(resolve, 50));
      kill(new Error("translation client disposed"));
    },
  };
}

/**
 * Client over an existing message channel (extension content script to the
 * inference host). Lifecycle — spawn, watchdog, respawn — belongs to the
 * channel's host side.
 */
export function createPortClient(transport: MessageTransport, options: { assetBaseUrl?: string; wasmBaseUrl?: string } = {}): TranslationClient {
  const correlator = new Correlator(transport);
  correlator.attach();
  let initPromise: Promise<{ coldStartMs: number }> | null = null;

  return {
    init(onProgress) {
      initPromise ??= correlator.init(
        { assetBaseUrl: options.assetBaseUrl, wasmBaseUrl: options.wasmBaseUrl ?? "" },
        onProgress,
      );
      return initPromise;
    },
    async countTokens(text) {
      const response = await correlator.request({ type: "count-tokens", text });
      if (response.type !== "count-tokens-result") throw new Error("unexpected runtime response");
      return response.tokens;
    },
    async translate(texts) {
      const response = await correlator.request({ type: "translate", texts });
      if (response.type !== "translate-result") throw new Error("unexpected runtime response");
      return response.texts;
    },
    async dispose() {
      correlator.post({ type: "dispose" });
      correlator.failAll(new Error("translation client disposed"));
    },
  };
}
