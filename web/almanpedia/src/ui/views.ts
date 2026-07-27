import {
  createDomTranslator,
  type AssetProgress,
  type DomTranslatorController,
} from "@alman/core";
import { getEngine, initModel } from "../engine";
import { ArticleNotFoundError, articleUrl, displayTitle, fetchArticleHtml, historyUrl } from "../wiki/api";
import { rewriteArticleDom } from "../wiki/rewrite";
import { sanitizeParsoidBody } from "../wiki/sanitize";
import { createHeaderBrand, createLandingBrand } from "./brand";
import { createArticleContents } from "./contents";
import { el, namespaceIds } from "./dom";
import {
  arrangeWikipediaMainPageSections,
  createLandingIntroduction,
  createShortcutGuide,
  extractWikipediaMainPageSections,
  WIKIPEDIA_MAIN_PAGE_TITLE,
} from "./homepage";
import { createSearchBox } from "./search";
import { createTranslationRevealController, type TranslationRevealController } from "./reveal";
import { applyReaderSettings, createReaderSettingsPanel, loadReaderSettings } from "./settings";

export interface AppShell {
  main: HTMLElement;
  status: HTMLElement;
  footer: HTMLElement;
  navigate: (path: string) => void;
  storage: Pick<Storage, "getItem" | "setItem">;
}

const MODEL_REPOSITORY_URL = "https://huggingface.co/osolmaz/GoePT-1-20M";

let activeController: DomTranslatorController | null = null;
let activeRevealController: TranslationRevealController | null = null;
let stopActiveContents: (() => void) | null = null;

function stopActiveTranslation(): void {
  activeController?.stop();
  activeController = null;
  activeRevealController?.destroy();
  activeRevealController = null;
  stopActiveContents?.();
  stopActiveContents = null;
}

function readerSettingsStorage(): Pick<Storage, "getItem" | "setItem"> {
  try {
    return window.localStorage;
  } catch {
    const values = new Map<string, string>();
    return {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
    };
  }
}

export function renderShell(root: HTMLElement, navigate: (path: string) => void): AppShell {
  const storage = readerSettingsStorage();
  applyReaderSettings(document.documentElement, loadReaderSettings(storage));
  const status = el("div", { class: "header-status", role: "status" });
  const header = el("header", { class: "site-header" }, [
    el("div", { class: "header-inner" }, [createHeaderBrand(), createSearchBox(navigate), status]),
  ]);
  const main = el("main", { class: "site-main" });
  const footer = el("footer", { class: "site-footer" }, [
    el("div", { class: "footer-inner" }, [
      el("span", {}, ["Inhalte aus der "]),
      el("a", { href: "https://de.wikipedia.org", target: "_blank", rel: "noopener" }, ["deutschsprachigen Wikipedia"]),
      el("span", {}, [", Text lizenziert unter "]),
      el("a", { href: "https://creativecommons.org/licenses/by-sa/4.0/deed.de", target: "_blank", rel: "noopener" }, [
        "CC BY-SA 4.0",
      ]),
      el("span", {}, [". Übersetzung nach "]),
      el("a", { href: "https://alman.ai", target: "_blank", rel: "noopener" }, ["Alman"]),
      el("span", {}, [" durch "]),
      el("a", { href: MODEL_REPOSITORY_URL, target: "_blank", rel: "noopener" }, ["GoePT-1-20M"]),
      el("span", {}, [", lokal im Browser. Ein Projekt von alman.ai."]),
    ]),
  ]);
  root.replaceChildren(header, main, footer);
  return { main, status, footer, navigate, storage };
}

export async function renderLanding(shell: AppShell): Promise<void> {
  stopActiveTranslation();
  shell.footer.hidden = false;
  document.title = "Almanpedia — Die freie Enzyklopädie, vereinfacht";
  const progress = progressBar();
  const feed = el("div", { class: "landing-feed wiki-content", lang: "de" }, [
    el("p", { class: "loading" }, ["Inhalte der deutschsprachigen Wikipedia werden geladen …"]),
  ]);
  shell.main.className = "site-main landing-page";
  shell.status.replaceChildren(progress.element);
  shell.main.replaceChildren(
    el("section", { class: "landing" }, [
      createLandingBrand(),
      createLandingIntroduction(),
      createShortcutGuide(),
      el("div", { class: "landing-feed-heading" }, [
        el("h2", {}, ["Aktuell in die deutschsprachige Wikipedia"]),
        el("a", { href: articleUrl(WIKIPEDIA_MAIN_PAGE_TITLE), target: "_blank", rel: "noopener" }, ["Originale Hauptseite"]),
      ]),
      feed,
    ]),
  );

  try {
    const page = await fetchArticleHtml(WIKIPEDIA_MAIN_PAGE_TITLE);
    if (!feed.isConnected) return;
    const fragment = sanitizeParsoidBody(page.html);
    rewriteArticleDom(fragment);
    const sections = extractWikipediaMainPageSections(fragment);
    feed.replaceChildren(...arrangeWikipediaMainPageSections(sections));
  } catch (error) {
    if (!feed.isConnected) return;
    progress.done();
    feed.replaceChildren(el("p", { class: "landing-feed-error" }, [
      "Die aktuelle Wikipedia-Hauptseite konnte nicht geladen werden. Bitte versuchen Sie es später erneut.",
    ]));
    console.error("Wikipedia main page fetch failed", error);
    return;
  }

  try {
    await initModel((assetProgress: AssetProgress) => {
      if (!feed.isConnected) return;
      if (assetProgress.phase === "download") {
        progress.set(
          assetProgress.overallLoaded / assetProgress.overallTotal,
          `MODELL WIRD GELADEN: ${Math.round((assetProgress.overallLoaded / assetProgress.overallTotal) * 100)} %`,
        );
      } else {
        progress.set(1, "MODELL WIRD VORBEREITET …");
      }
    });
  } catch (error) {
    if (!feed.isConnected) return;
    progress.done();
    shell.status.append(el("span", { class: "status-error" }, [
      "Übersetzung nicht verfügbar. Die deutschsprachige Hauptseite bleibt sichtbar.",
    ]));
    console.error("model init failed", error);
    return;
  }
  if (!feed.isConnected) return;

  let inferenceComplete = false;
  let revealController: TranslationRevealController | null = null;
  const syncFeedLanguage = () => {
    const fullyRevealed = inferenceComplete && (revealController?.pendingCount() ?? 0) === 0;
    feed.lang = fullyRevealed ? "de-AL" : "de";
  };
  const controller = createDomTranslator({
    root: feed,
    engine: getEngine(),
    markChanges: true,
    deferApplication: true,
    onStats: (stats) => {
      if (stats.totalBlocks === 0 || stats.pendingBlocks === 0) {
        inferenceComplete = true;
        syncFeedLanguage();
        progress.done();
        return;
      }
      const done = stats.totalBlocks - stats.pendingBlocks;
      progress.set(done / stats.totalBlocks, `HAUPTSEITE WIRD ÜBERSETZT: ${Math.round((done / stats.totalBlocks) * 100)} %`);
    },
    onBlockState: (event) => revealController?.handleBlockState(event),
  });
  revealController = createTranslationRevealController({
    root: feed,
    applyTranslation: (element) => controller.applyTranslation(element),
    onReveal: (element) => {
      revealTranslatedBlock(element);
      syncFeedLanguage();
    },
    onPendingChange: () => syncFeedLanguage(),
  });
  activeController = controller;
  activeRevealController = revealController;
  controller.start();
  controller.translateAll();
}

export function createArticleAttribution(title: string): HTMLElement {
  return el("div", { class: "attribution", translate: "no", lang: "de" }, [
    el("span", {}, ["Quelle: "]),
    el("a", { href: articleUrl(title), target: "_blank", rel: "noopener" }, [`„${displayTitle(title)}“ (de.wikipedia.org)`]),
    el("span", {}, [", "]),
    el("a", { href: historyUrl(title), target: "_blank", rel: "noopener" }, ["Autorinnen und Autoren"]),
    el("span", {}, [
      ". Text: CC BY-SA 4.0. Die maschinelle Alman-Fassung steht als Bearbeitung unter derselben Lizenz. " +
        "Automatisch übersetzt durch ",
    ]),
    el("a", { href: MODEL_REPOSITORY_URL, target: "_blank", rel: "noopener" }, ["GoePT-1-20M"]),
    el("span", {}, ["; Fehler vorbehalten. Ein Projekt von "]),
    el("a", { href: "https://alman.ai/", target: "_blank", rel: "noopener" }, ["alman.ai"]),
    el("span", {}, ["."]),
  ]);
}

function progressBar(): { element: HTMLElement; set: (fraction: number, label: string) => void; done: () => void } {
  const fill = el("div", { class: "progress-fill" });
  const label = el("span", { class: "progress-label" });
  const element = el("div", { class: "progress", hidden: "" }, [el("div", { class: "progress-track" }, [fill]), label]);
  return {
    element,
    set(fraction, text) {
      element.hidden = false;
      fill.style.width = `${Math.round(fraction * 100)}%`;
      label.textContent = text;
    },
    done() {
      element.hidden = true;
      fill.style.width = "100%";
      label.textContent = "";
    },
  };
}

function scrollToArticleHash(hash: string | undefined): void {
  if (!hash) return;
  requestAnimationFrame(() => {
    document.getElementById(hash)?.scrollIntoView();
  });
}

const CHANGE_REVEAL_DURATION_MS = 1_500;

function revealTranslatedBlock(element: Element): void {
  const changed = [
    ...(element.matches("[data-alman-change]") ? [element] : []),
    ...element.querySelectorAll("[data-alman-change]"),
  ];
  for (const [index, node] of changed.entries()) {
    if (node instanceof HTMLElement || node instanceof SVGElement) {
      node.style.setProperty("--alman-reveal-delay", `${Math.min(index * 42, 336)}ms`);
    }
  }
  element.setAttribute("data-alman-reveal", "");
  window.setTimeout(() => {
    element.removeAttribute("data-alman-reveal");
    for (const node of changed) {
      if (node instanceof HTMLElement || node instanceof SVGElement) node.style.removeProperty("--alman-reveal-delay");
    }
  }, CHANGE_REVEAL_DURATION_MS);
}

export async function renderArticle(shell: AppShell, title: string, hash?: string): Promise<void> {
  stopActiveTranslation();
  shell.footer.hidden = true;
  document.title = `${displayTitle(title)} – Almanpedia`;
  const progress = progressBar();
  shell.status.replaceChildren(progress.element);
  shell.main.replaceChildren(el("p", { class: "loading" }, ["Artikel wird geladen …"]));

  let article;
  try {
    article = await fetchArticleHtml(title);
  } catch (error) {
    renderArticleError(shell, title, error);
    return;
  }

  const sourceTitle = displayTitle(article.title);
  const sourceDocumentTitle = `${sourceTitle} – Almanpedia`;
  const fragment = sanitizeParsoidBody(article.html);
  rewriteArticleDom(fragment);

  const heading = el("h1", { class: "article-title", lang: "de" }, [sourceTitle]);
  const toggle = el(
    "button",
    { class: "toggle-original", type: "button", disabled: "", "aria-pressed": "false" },
    ["Original anzeigen"],
  );
  const differenceToggle = el(
    "button",
    { class: "toggle-differences", type: "button", disabled: "", "aria-pressed": "false" },
    ["Änderungen anzeigen"],
  );
  const actions = el("div", { class: "article-actions", translate: "no", lang: "de" }, [toggle, differenceToggle]);
  const content = el("article", { class: "wiki-content", lang: "de" });
  content.append(fragment);
  const contents = createArticleContents(content, window.matchMedia?.("(max-width: 56rem)"));
  stopActiveContents = () => contents.destroy();
  const settings = createReaderSettingsPanel(document.documentElement, shell.storage);
  const settingsToggle = el("button", {
    class: "toggle-settings",
    type: "button",
    "aria-expanded": "false",
  }, ["Erscheinungsbild"]);
  settingsToggle.addEventListener("click", () => {
    settings.setExpanded(!settings.expanded());
    if (settings.expanded()) settings.element.scrollIntoView({ block: "nearest" });
  });
  settings.element.addEventListener("toggle", () => {
    settingsToggle.setAttribute("aria-expanded", String(settings.expanded()));
  });
  actions.append(settingsToggle);
  const articleColumn = el("div", { class: "article-column" }, [
    el("div", { class: "article-head" }, [heading, actions]),
    content,
    createArticleAttribution(article.title),
  ]);
  shell.main.className = "site-main article-page";
  shell.main.replaceChildren(
    el("div", { class: "article-layout" }, [contents.element, articleColumn, el("aside", { class: "appearance-column" }, [settings.element])]),
  );
  scrollToArticleHash(hash);
  if (document.title !== sourceDocumentTitle) document.title = sourceDocumentTitle;

  let showingOriginal = false;
  let showingDifferences = false;
  let inferenceComplete = false;
  let differenceContent: Element | null = null;
  let revealController: TranslationRevealController | null = null;

  const syncContentLanguage = () => {
    const fullyRevealed = inferenceComplete && (revealController?.pendingCount() ?? 0) === 0;
    content.lang = !showingOriginal && fullyRevealed ? "de-AL" : "de";
    if (!heading.isConnected) return;
    const translatedTitleVisible = !showingOriginal && heading.dataset.almanState === "translated";
    heading.lang = translatedTitleVisible ? "de-AL" : "de";
    document.title = translatedTitleVisible
      ? `${heading.textContent ?? sourceTitle} – Almanpedia`
      : sourceDocumentTitle;
  };

  const hideDifferences = () => {
    showingDifferences = false;
    differenceContent?.remove();
    differenceContent = null;
    content.hidden = false;
    differenceToggle.textContent = "Änderungen anzeigen";
    differenceToggle.setAttribute("aria-pressed", "false");
    revealController?.setPaused(showingOriginal);
    syncContentLanguage();
  };

  const showDifferences = () => {
    if (!activeController) return;
    const clone = activeController.createDifferenceClone(content);
    clone.classList.add("wiki-difference");
    clone.setAttribute("translate", "no");
    clone.prepend(el("p", { class: "difference-legend" }, [
      el("span", { class: "difference-legend-removed" }, ["Durchgestrichen: deutsches Original."]),
      " ",
      el("span", { class: "difference-legend-added" }, ["Blau: Alman-Fassung."]),
    ]));
    clone.removeAttribute("hidden");
    clone.setAttribute("lang", inferenceComplete ? "de-AL" : "de");
    const namespacedIds = namespaceIds(clone, "diff-", { rewriteFragmentLinks: false });
    clone.addEventListener("click", (event) => {
      if (!(event instanceof MouseEvent) || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest?.('a[href^="#"]');
      const href = anchor?.getAttribute("href");
      if (!href) return;
      const rawId = href.slice(1);
      let canonicalId = rawId;
      try {
        canonicalId = decodeURIComponent(rawId);
      } catch {
        // Keep the raw fragment when it is not valid percent-encoding.
      }
      const targetId = namespacedIds.get(canonicalId);
      const target = targetId ? clone.querySelector<HTMLElement>(`#${CSS.escape(targetId)}`) : null;
      if (!target) return;
      event.preventDefault();
      history.pushState(null, "", href);
      target.scrollIntoView();
    });
    differenceContent?.replaceWith(clone);
    if (!differenceContent) content.after(clone);
    differenceContent = clone;
    content.hidden = true;
    revealController?.setPaused(true);
  };

  toggle.addEventListener("click", () => {
    if (!activeController) return;
    showingOriginal = !showingOriginal;
    if (showingDifferences) hideDifferences();
    if (showingOriginal) {
      revealController?.setPaused(true);
      activeController.restoreOriginals();
    } else {
      activeController.reapplyTranslations();
      revealController?.setPaused(false);
    }
    syncContentLanguage();
    contents.refresh();
    toggle.textContent = showingOriginal ? "Alman anzeigen" : "Original anzeigen";
    toggle.setAttribute("aria-pressed", String(showingOriginal));
  });

  differenceToggle.addEventListener("click", () => {
    if (!activeController) return;
    if (showingDifferences) {
      hideDifferences();
      return;
    }
    if (showingOriginal) {
      showingOriginal = false;
      activeController.reapplyTranslations();
      toggle.textContent = "Original anzeigen";
      toggle.setAttribute("aria-pressed", "false");
      syncContentLanguage();
    }
    showingDifferences = true;
    revealController?.setPaused(true);
    activeController.translateAll();
    showDifferences();
    differenceToggle.textContent = "Änderungen ausblenden";
    differenceToggle.setAttribute("aria-pressed", "true");
  });

  try {
    await initModel((assetProgress: AssetProgress) => {
      if (assetProgress.phase === "download") {
        progress.set(
          assetProgress.overallLoaded / assetProgress.overallTotal,
          `MODELL WIRD GELADEN: ${Math.round((assetProgress.overallLoaded / assetProgress.overallTotal) * 100)} %`,
        );
      } else {
        progress.set(1, "MODELL WIRD VORBEREITET …");
      }
    });
  } catch (error) {
    progress.done();
    shell.status.append(el("span", { class: "status-error" }, ["Übersetzung nicht verfügbar — Original wird angezeigt."]));
    console.error("model init failed", error);
    return;
  }

  const controller = createDomTranslator({
    root: articleColumn,
    engine: getEngine(),
    markChanges: true,
    deferApplication: true,
    onStats: (stats) => {
      if (stats.totalBlocks === 0) {
        inferenceComplete = true;
        syncContentLanguage();
        progress.done();
        return;
      }
      const done = stats.totalBlocks - stats.pendingBlocks;
      if (stats.pendingBlocks === 0) {
        inferenceComplete = true;
        contents.refresh();
        if (showingDifferences) showDifferences();
        syncContentLanguage();
        progress.done();
        return;
      }
      progress.set(done / stats.totalBlocks, `ARTIKEL WIRD ÜBERSETZT: ${Math.round((done / stats.totalBlocks) * 100)} %`);
    },
    onBlockState: (event) => {
      revealController?.handleBlockState(event);
      if (event.element === heading) syncContentLanguage();
    },
  });
  revealController = createTranslationRevealController({
    root: articleColumn,
    applyTranslation: (element) => controller.applyTranslation(element),
    onReveal: (element) => {
      revealTranslatedBlock(element);
      contents.refresh();
      syncContentLanguage();
    },
    onPendingChange: () => syncContentLanguage(),
  });
  activeController = controller;
  activeRevealController = revealController;
  toggle.removeAttribute("disabled");
  differenceToggle.removeAttribute("disabled");
  controller.start();
  controller.translateAll();
}

function renderArticleError(shell: AppShell, title: string, error: unknown): void {
  shell.main.className = "site-main";
  shell.status.replaceChildren();
  if (error instanceof ArticleNotFoundError) {
    shell.main.replaceChildren(
      el("section", { class: "error-view" }, [
        el("p", { class: "form-tag" }, ["BESCHEID AP-404"]),
        el("h1", {}, ["Artikel nicht vorhanden"]),
        el("p", {}, [`Ein Artikel mit der Bezeichnung „${displayTitle(title)}“ ist nicht verzeichnet.`]),
        el("p", {}, [
          el("a", { href: `https://de.wikipedia.org/w/index.php?search=${encodeURIComponent(displayTitle(title))}`, target: "_blank", rel: "noopener" }, [
            "In der Wikipedia suchen",
          ]),
          el("span", {}, [" oder oben die Almanpedia-Suche benutzen."]),
        ]),
      ]),
    );
    return;
  }
  shell.main.replaceChildren(
    el("section", { class: "error-view" }, [
      el("p", { class: "form-tag" }, ["STÖRUNGSMELDUNG"]),
      el("h1", {}, ["Artikel konnte nicht geladen werden"]),
      el("p", {}, ["Die Verbindung zur Wikipedia ist fehlgeschlagen. Bitte versuchen Sie es erneut."]),
      el("p", {}, [
        (() => {
          const retry = el("button", { type: "button", class: "retry" }, ["Erneut versuchen"]);
          retry.addEventListener("click", () => void renderArticle(shell, title));
          return retry;
        })(),
      ]),
    ]),
  );
}
