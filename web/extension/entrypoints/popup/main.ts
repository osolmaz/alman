import { browser } from "wxt/browser";
import { getSettings, setSiteRule, updateSettings, type SiteRule } from "../../src/settings";
import { resolveLocale, t, type StringKey } from "../../src/i18n";
import type { BroadcastEvent, ModelState, PageStatus } from "../../src/messages";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
  element.append(...children);
  return element;
}

async function activeTab(): Promise<{ id: number; origin: string | null } | null> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return null;
  let origin: string | null = null;
  try {
    const url = new URL(tab.url ?? "");
    origin = url.protocol.startsWith("http") ? url.origin : null;
  } catch {
    origin = null;
  }
  return { id: tab.id, origin };
}

async function pageStatus(tabId: number): Promise<PageStatus | null> {
  try {
    return (await browser.tabs.sendMessage(tabId, { target: "alman-page", command: "status" })) as PageStatus;
  } catch {
    return null;
  }
}

async function modelState(): Promise<ModelState> {
  try {
    const state = (await browser.runtime.sendMessage({ target: "alman-host", kind: "status" })) as ModelState;
    return state?.state ? state : { state: "empty" };
  } catch {
    return { state: "empty" };
  }
}

async function main(): Promise<void> {
  const settings = await getSettings();
  const locale = resolveLocale(settings.uiLanguage);
  const tr = (key: StringKey) => t(locale, key);
  const tab = await activeTab();

  const status = el("div", { class: "status" });
  const progressFill = el("div", { class: "progress-fill" });
  const progressTrack = el("div", { class: "progress-track", hidden: "" }, [progressFill]);
  const translateButton = el("button", { class: "primary", type: "button" }, [tr("translate")]) as HTMLButtonElement;
  const toggleButton = el("button", { class: "secondary", type: "button", hidden: "" }, [
    tr("showOriginal"),
  ]) as HTMLButtonElement;

  const autoCheckbox = el("input", { type: "checkbox" }) as HTMLInputElement;
  autoCheckbox.checked = settings.autoTranslate;
  const siteSelect = el("select") as HTMLSelectElement;
  for (const [value, label] of [
    ["default", tr("siteDefault")],
    ["always", tr("siteAlways")],
    ["never", tr("siteNever")],
  ] as const) {
    siteSelect.append(el("option", { value }, [label]));
  }

  function renderModelState(state: ModelState): void {
    progressTrack.hidden = state.state !== "downloading";
    switch (state.state) {
      case "empty":
        status.textContent = tr("modelEmpty");
        break;
      case "downloading": {
        const percent = Math.round((state.progress.overallLoaded / state.progress.overallTotal) * 100);
        status.textContent = `${tr("modelDownloading")}: ${percent} %`;
        progressFill.style.width = `${percent}%`;
        break;
      }
      case "preparing":
        status.textContent = tr("modelPreparing");
        break;
      case "ready":
        status.textContent = tr("modelReady");
        break;
    }
  }

  function renderPageStatus(page: PageStatus | null): void {
    if (!tab) {
      translateButton.disabled = true;
      status.textContent = tr("noAccess");
      return;
    }
    if (page?.translating) {
      translateButton.hidden = true;
      toggleButton.hidden = false;
      toggleButton.textContent = page.showingOriginal ? tr("showAlman") : tr("showOriginal");
      const stats = page.stats;
      if (stats && stats.pendingBlocks > 0) {
        const done = stats.totalBlocks - stats.pendingBlocks;
        status.textContent = `${tr("pageTranslating")}: ${Math.round((done / Math.max(stats.totalBlocks, 1)) * 100)} %`;
      } else if (stats) {
        status.textContent = tr("pageDone");
      }
    }
  }

  translateButton.addEventListener("click", async () => {
    if (!tab) return;
    translateButton.disabled = true;
    try {
      await browser.runtime.sendMessage({ target: "alman-bg", kind: "translate-tab", tabId: tab.id });
      renderPageStatus(await pageStatus(tab.id));
    } finally {
      translateButton.disabled = false;
    }
  });

  toggleButton.addEventListener("click", async () => {
    if (!tab) return;
    await browser.tabs.sendMessage(tab.id, { target: "alman-page", command: "toggle" }).catch(() => {});
    renderPageStatus(await pageStatus(tab.id));
  });

  autoCheckbox.addEventListener("change", async () => {
    if (autoCheckbox.checked) {
      const granted = await browser.permissions.request({ origins: ["<all_urls>"] }).catch(() => false);
      if (!granted) {
        autoCheckbox.checked = false;
        return;
      }
    }
    await updateSettings({ autoTranslate: autoCheckbox.checked });
  });

  siteSelect.addEventListener("change", async () => {
    if (!tab?.origin) return;
    await setSiteRule(tab.origin, siteSelect.value === "default" ? null : (siteSelect.value as SiteRule));
  });

  if (tab?.origin) siteSelect.value = settings.perSite[tab.origin] ?? "default";
  else siteSelect.disabled = true;

  browser.runtime.onMessage.addListener((message: unknown) => {
    const event = message as BroadcastEvent;
    if (event?.type === "alman:model-state") renderModelState(event.state);
  });

  document.getElementById("app")?.append(
    el("div", { class: "popup" }, [
      el("div", { class: "title" }, [tr("title"), el("div", { class: "subtitle" }, [tr("subtitle")])]),
      el("div", {}, [status, progressTrack]),
      translateButton,
      toggleButton,
      el("label", { class: "row" }, [el("span", {}, [tr("autoTranslate")]), autoCheckbox]),
      el("div", { class: "row" }, [el("span", {}, [tr("siteRule")]), siteSelect]),
      el("div", { class: "footer" }, [
        el("a", { href: "https://alman.ai", target: "_blank", rel: "noopener" }, ["alman.ai"]),
        el("span", {}, [" · GoePT-1-20M · lokal"]),
      ]),
    ]),
  );

  renderModelState(await modelState());
  if (tab) renderPageStatus(await pageStatus(tab.id));
}

void main();
