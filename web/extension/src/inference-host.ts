import { browser } from "wxt/browser";
import {
  MODEL_PACKAGE,
  TRANSLATION_RUNTIME_POLICY_REVISION,
  createSegmentCache,
  createValidatedSegmentService,
  createWorkerClient,
  type SegmentCache,
  type TranslationClient,
  type ValidatedSegmentService,
} from "@alman/core";
import type { BroadcastEvent, HostRequest, ModelState } from "./messages";

/**
 * Serves the model runtime RPC inside an extension context that supports
 * Workers: the offscreen document on Chrome, the background page on Firefox.
 * One model instance per browser profile; the segment cache lives here too so
 * page origins never see extension storage.
 */
export function createInferenceHost(): void {
  let client: TranslationClient | null = null;
  let cache: SegmentCache | null = null;
  let service: ValidatedSegmentService | null = null;
  const requests = new Map<string, AbortController>();
  const cancelledRequests = new Set<string>();
  let state: ModelState = { state: "empty" };
  let lastUsed = Date.now();

  function broadcast(event: BroadcastEvent): void {
    void browser.runtime.sendMessage(event).catch(() => {});
  }

  function setState(next: ModelState): void {
    state = next;
    broadcast({ type: "alman:model-state", state: next });
  }

  function ensureClient(): TranslationClient {
    // Staged by scripts/{copy-ort,build-worker}.mjs, so absent from WXT's typed public paths.
    const publicUrl = (path: string) =>
      browser.runtime.getURL(path as unknown as Parameters<typeof browser.runtime.getURL>[0]);
    client ??= createWorkerClient({
      createWorker: () => new Worker(publicUrl("/ort/worker.js"), { type: "module" }),
      wasmBaseUrl: publicUrl("/ort/"),
    });
    cache ??= createSegmentCache({
      modelRevision: MODEL_PACKAGE.revision,
      policyRevision: TRANSLATION_RUNTIME_POLICY_REVISION,
    });
    return client;
  }

  function ensureService(): ValidatedSegmentService {
    const active = ensureClient();
    service ??= createValidatedSegmentService({ client: active, cache: cache ?? undefined });
    return service;
  }

  async function init(): Promise<void> {
    const active = ensureClient();
    await active.init((progress) => {
      setState(progress.phase === "download" ? { state: "downloading", progress } : { state: "preparing" });
    });
    setState({ state: "ready" });
  }

  browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    const request = message as HostRequest;
    if (!request || request.target !== "alman-host") return;
    lastUsed = Date.now();
    void (async () => {
      switch (request.kind) {
        case "init":
          if (state.state !== "ready") await init();
          return { ok: true };
        case "count-tokens":
          return { tokens: await ensureService().countTokens(request.text) };
        case "translate": {
          const controller = new AbortController();
          requests.set(request.requestId, controller);
          if (cancelledRequests.delete(request.requestId)) {
            controller.abort(new DOMException("translation timed out", "AbortError"));
          }
          try {
            return {
              texts: await ensureService().translate(request.texts, { signal: controller.signal }),
            };
          } finally {
            requests.delete(request.requestId);
          }
        }
        case "cancel": {
          const controller = requests.get(request.requestId);
          if (controller) controller.abort(new DOMException("translation timed out", "AbortError"));
          else cancelledRequests.add(request.requestId);
          return { ok: true };
        }
        case "status":
          return state;
        case "idle-check": {
          const idleMs = Date.now() - lastUsed;
          if (idleMs > 5 * 60_000 && client) {
            // Free the ~300MB WASM heap; cached assets make re-init cheap.
            for (const controller of requests.values()) controller.abort();
            requests.clear();
            cancelledRequests.clear();
            if (service?.dispose) await service.dispose();
            else await client.dispose();
            service = null;
            client = null;
            setState({ state: "empty" });
            return { disposed: true, idleMs };
          }
          return { disposed: false, idleMs };
        }
      }
    })().then(sendResponse, (error: unknown) => {
      sendResponse({ error: error instanceof Error ? error.message : String(error) });
    });
    return true;
  });
}
