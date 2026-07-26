import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import { createInferenceHost } from "../src/inference-host";
import { getSettings } from "../src/settings";
import type { BackgroundRequest } from "../src/messages";

const AUTO_SCRIPT_ID = "alman-auto-translate";

async function ensureHost(): Promise<void> {
  if (import.meta.env.FIREFOX) return; // host runs in this background page
  const contexts = await browser.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT" as never] });
  if (contexts.length > 0) return;
  await browser.offscreen.createDocument({
    url: "/offscreen.html",
    reasons: ["WORKERS" as never],
    justification: "Runs the local German→Alman ONNX translation model in a Web Worker",
  });
}

async function closeIdleHost(): Promise<void> {
  if (import.meta.env.FIREFOX) {
    await browser.runtime.sendMessage({ target: "alman-host", kind: "idle-check" }).catch(() => {});
    return;
  }
  const contexts = await browser.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT" as never] });
  if (contexts.length === 0) return;
  const result = (await browser.runtime
    .sendMessage({ target: "alman-host", kind: "idle-check" })
    .catch(() => null)) as { disposed: boolean } | null;
  if (result?.disposed) await browser.offscreen.closeDocument().catch(() => {});
}

async function injectPageTranslator(tabId: number): Promise<void> {
  await ensureHost();
  await browser.scripting.executeScript({ target: { tabId }, files: ["/page-translator.js"] });
  await browser.tabs.sendMessage(tabId, { target: "alman-page", command: "translate" });
}

async function syncAutoRegistration(): Promise<void> {
  const settings = await getSettings();
  const granted = await browser.permissions.contains({ origins: ["<all_urls>"] }).catch(() => false);
  const registered = await browser.scripting.getRegisteredContentScripts({ ids: [AUTO_SCRIPT_ID] });
  if (settings.autoTranslate && granted) {
    if (registered.length === 0) {
      await browser.scripting.registerContentScripts([
        {
          id: AUTO_SCRIPT_ID,
          js: ["/page-translator.js"],
          matches: ["<all_urls>"],
          runAt: "document_idle",
          persistAcrossSessions: true,
        },
      ]);
    }
  } else if (registered.length > 0) {
    await browser.scripting.unregisterContentScripts({ ids: [AUTO_SCRIPT_ID] });
  }
}

export default defineBackground(() => {
  if (import.meta.env.FIREFOX) createInferenceHost();

  browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    const request = message as BackgroundRequest;
    if (!request || request.target !== "alman-bg") return;
    void (async () => {
      switch (request.kind) {
        case "ensure-host":
          await ensureHost();
          return { ok: true };
        case "translate-tab":
          await injectPageTranslator(request.tabId);
          return { ok: true };
      }
    })().then(sendResponse, (error: unknown) => {
      sendResponse({ error: error instanceof Error ? error.message : String(error) });
    });
    return true;
  });

  browser.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes["settings"]) void syncAutoRegistration();
  });
  browser.permissions.onAdded?.addListener(() => void syncAutoRegistration());
  browser.permissions.onRemoved?.addListener(() => void syncAutoRegistration());
  void syncAutoRegistration();

  browser.alarms.create("alman-idle-check", { periodInMinutes: 1 });
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "alman-idle-check") void closeIdleHost();
  });
});
