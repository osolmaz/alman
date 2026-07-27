import { browser } from "wxt/browser";
import { defineUnlistedScript } from "wxt/utils/define-unlisted-script";
import {
  createAlmanEngine,
  createDomTranslator,
  type DomTranslatorController,
  type TranslationClient,
} from "@alman/core";
import { cldDetector, pageLooksGerman } from "../src/detect";
import { getSettings } from "../src/settings";
import type { PageCommand, PageStatus } from "../src/messages";

declare global {
  interface Window {
    __almanPageTranslator?: boolean;
  }
}

async function hostRequest<T>(message: Record<string, unknown>): Promise<T> {
  const response = (await browser.runtime.sendMessage({ target: "alman-host", ...message })) as
    | T
    | { error: string }
    | undefined;
  if (!response) throw new Error("translation host unavailable");
  if (typeof response === "object" && response !== null && "error" in response) {
    throw new Error((response as { error: string }).error);
  }
  return response as T;
}

export default defineUnlistedScript(() => {
  // Idempotent: manual injection can race the registered auto script.
  if (window.__almanPageTranslator) return;
  window.__almanPageTranslator = true;

  let controller: DomTranslatorController | null = null;
  let starting = false;
  let showingOriginal = false;

  const client: TranslationClient = {
    async init() {
      await browser.runtime.sendMessage({ target: "alman-bg", kind: "ensure-host" });
      await hostRequest<{ ok: true }>({ kind: "init" });
      return { coldStartMs: 0 };
    },
    countTokens: (text) => hostRequest<{ tokens: number }>({ kind: "count-tokens", text }).then((r) => r.tokens),
    async translate(texts, options = {}) {
      const requestId = globalThis.crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
      if (options.signal?.aborted) throw options.signal.reason;
      const cancel = () => {
        void browser.runtime.sendMessage({ target: "alman-host", kind: "cancel", requestId }).catch(() => {});
      };
      options.signal?.addEventListener("abort", cancel, { once: true });
      try {
        const response = await hostRequest<{ texts: string[] }>({
          kind: "translate",
          requestId,
          deadlineAt: options.deadlineAt,
          texts,
        });
        if (options.signal?.aborted) throw options.signal.reason;
        return response.texts;
      } finally {
        options.signal?.removeEventListener("abort", cancel);
      }
    },
    async dispose() {},
  };

  const engine = createAlmanEngine({ client, detector: cldDetector(), segmentTranslator: client });

  async function startTranslation(): Promise<void> {
    if (controller) {
      if (showingOriginal) {
        controller.reapplyTranslations();
        showingOriginal = false;
      }
      return;
    }
    if (starting) return;
    starting = true;
    try {
      await client.init();
      controller = createDomTranslator({ root: document.body, engine });
      controller.start();
    } finally {
      starting = false;
    }
  }

  function toggle(): void {
    if (!controller) return;
    showingOriginal = !showingOriginal;
    if (showingOriginal) controller.restoreOriginals();
    else controller.reapplyTranslations();
  }

  browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    const command = message as PageCommand;
    if (!command || command.target !== "alman-page") return;
    switch (command.command) {
      case "status": {
        const status: PageStatus = {
          injected: true,
          translating: controller !== null || starting,
          showingOriginal,
          stats: controller?.stats() ?? null,
        };
        sendResponse(status);
        return;
      }
      case "translate":
        void startTranslation();
        sendResponse({ ok: true });
        return;
      case "toggle":
        toggle();
        sendResponse({ ok: true, showingOriginal });
        return;
    }
  });

  // Auto mode: only when the user opted in (or pinned this site to "always"),
  // and only on pages that read as German.
  void (async () => {
    const settings = await getSettings();
    const rule = settings.perSite[window.location.origin];
    if (rule === "never") return;
    if (!settings.autoTranslate && rule !== "always") return;
    if (!(await pageLooksGerman())) return;
    void startTranslation();
  })();
});
