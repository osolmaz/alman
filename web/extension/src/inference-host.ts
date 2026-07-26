import { browser } from "wxt/browser";
import {
  MODEL_PACKAGE,
  createSegmentCache,
  createWorkerClient,
  type SegmentCache,
  type TranslationClient,
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
    cache ??= createSegmentCache({ modelRevision: MODEL_PACKAGE.revision });
    return client;
  }

  async function init(): Promise<void> {
    const active = ensureClient();
    await active.init((progress) => {
      setState(progress.phase === "download" ? { state: "downloading", progress } : { state: "preparing" });
    });
    setState({ state: "ready" });
  }

  async function translate(texts: string[]): Promise<string[]> {
    const active = ensureClient();
    const output: string[] = [];
    for (const text of texts) {
      let cached: string | undefined;
      try {
        cached = await cache?.get(text);
      } catch {
        cached = undefined;
      }
      if (cached !== undefined) {
        output.push(cached);
        continue;
      }
      const [translated] = await active.translate([text]);
      if (typeof translated !== "string") throw new Error("empty translation result");
      try {
        await cache?.put(text, translated);
      } catch {
        // Best effort.
      }
      output.push(translated);
    }
    return output;
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
          return { tokens: await ensureClient().countTokens(request.text) };
        case "translate":
          return { texts: await translate(request.texts) };
        case "status":
          return state;
        case "idle-check": {
          const idleMs = Date.now() - lastUsed;
          if (idleMs > 5 * 60_000 && client) {
            // Free the ~300MB WASM heap; cached assets make re-init cheap.
            await client.dispose();
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
