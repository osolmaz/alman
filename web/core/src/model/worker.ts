/**
 * Model runtime worker: downloads and verifies the GoePT-1-20M package, then
 * serves `count-tokens` and `translate` requests sequentially (one in-flight
 * inference bounds WASM memory, matching the qualified pipeline).
 *
 * The adapter replicates the qualified package's `translator.mjs` exactly:
 * transformers.js `text2text-generation` on WASM, int8, single thread, greedy
 * decoding with the frozen generation parameters. The npm dependency is pinned
 * to the version bundling the same ONNX Runtime build the package qualified
 * with; the Node parity test enforces output equality with the frozen
 * browser predictions.
 */
import { env, pipeline } from "@huggingface/transformers";
import { MODEL_CACHE_KEY_BASE, ensureModelAssets } from "./assets";
import { GENERATION_PARAMS, MODEL_PACKAGE } from "./manifest";
import type { WorkerRequest, WorkerResponse } from "./protocol";

interface WorkerScope {
  postMessage(message: WorkerResponse): void;
  addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
  close?(): void;
}

const scope = globalThis as unknown as WorkerScope;

function post(message: WorkerResponse): void {
  scope.postMessage(message);
}

type RuntimeGenerationParams = Omit<typeof GENERATION_PARAMS, "max_new_tokens"> & { max_new_tokens: number };

interface TranslatorPipeline {
  (text: string, params: RuntimeGenerationParams): Promise<Array<{ generated_text: string }>>;
  tokenizer: (text: string) => { input_ids: { dims: number[] } };
  dispose(): Promise<void>;
}

let pipe: TranslatorPipeline | null = null;

async function init(message: { assetBaseUrl?: string; wasmBaseUrl: string }): Promise<void> {
  if (pipe) {
    post({ type: "ready", coldStartMs: 0 });
    return;
  }
  const started = performance.now();
  const cache = await ensureModelAssets({
    baseUrl: message.assetBaseUrl,
    onProgress: (progress) => post({ type: "progress", progress }),
  });

  env.allowLocalModels = true;
  env.allowRemoteModels = false;
  env.localModelPath = MODEL_CACHE_KEY_BASE;
  env.useBrowserCache = false;
  // Serve every model file from the verified cache bucket; nothing else may load.
  const envUntyped = env as unknown as {
    useCustomCache: boolean;
    customCache: { match(key: string): Promise<Response | undefined>; put(): Promise<void> };
  };
  envUntyped.useCustomCache = true;
  envUntyped.customCache = {
    match: (key: string) => cache.match(key),
    put: async () => {},
  };
  const wasm = env.backends.onnx.wasm as { numThreads?: number; wasmPaths?: string };
  wasm.numThreads = 1;
  wasm.wasmPaths = message.wasmBaseUrl;

  post({
    type: "progress",
    progress: {
      file: "",
      loaded: 0,
      total: 0,
      overallLoaded: MODEL_PACKAGE.totalBytes,
      overallTotal: MODEL_PACKAGE.totalBytes,
      phase: "compile",
    },
  });
  pipe = (await pipeline("text2text-generation", "model", {
    device: "wasm",
    dtype: "q8",
    local_files_only: true,
  })) as unknown as TranslatorPipeline;
  // One tiny warm-up generation so "ready" means genuinely ready.
  await pipe("Ja.", GENERATION_PARAMS);
  post({ type: "ready", coldStartMs: performance.now() - started });
}

async function handle(message: WorkerRequest): Promise<void> {
  switch (message.type) {
    case "init": {
      await init(message);
      return;
    }
    case "count-tokens": {
      if (!pipe) throw new Error("model runtime not initialized");
      const encoded = pipe.tokenizer(message.text);
      const tokens = Number(encoded.input_ids.dims.at(-1) ?? 0);
      post({ type: "count-tokens-result", id: message.id, tokens });
      return;
    }
    case "translate": {
      if (!pipe) throw new Error("model runtime not initialized");
      const requestedMax = Number.isInteger(message.maxNewTokens) && Number(message.maxNewTokens) > 0
        ? Number(message.maxNewTokens)
        : GENERATION_PARAMS.max_new_tokens;
      const maxNewTokens = Math.min(GENERATION_PARAMS.max_new_tokens, requestedMax);
      const texts: string[] = [];
      for (const text of message.texts) {
        const [output] = await pipe(text, { ...GENERATION_PARAMS, max_new_tokens: maxNewTokens });
        texts.push(output?.generated_text ?? "");
      }
      post({ type: "translate-result", id: message.id, texts });
      return;
    }
    case "dispose": {
      const current = pipe;
      pipe = null;
      await current?.dispose();
      scope.close?.();
      return;
    }
  }
}

let queue: Promise<void> = Promise.resolve();

scope.addEventListener("message", (event) => {
  const message = event.data as WorkerRequest;
  queue = queue
    .then(() => handle(message))
    .catch((error: unknown) => {
      const id = "id" in message && typeof message.id === "number" ? message.id : undefined;
      post({
        type: "error",
        id,
        name: error instanceof Error ? error.name : "Error",
        message: error instanceof Error ? error.message : String(error),
      });
    });
});
