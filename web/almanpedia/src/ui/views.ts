import {
  createDomTranslator,
  type AssetProgress,
  type DomTranslatorController,
} from "@alman/core";
import { getEngine, initModel } from "../engine";
import { browserStorage, uiText } from "../i18n";
import { ArticleNotFoundError, articleUrl, displayTitle, fetchArticleHtml, historyUrl } from "../wiki/api";
import { prepareParsoidBody } from "../wiki/prepare";
import { createHeaderBrand, createLandingHeading } from "./brand";
import { createArticleContents } from "./contents";
import { el, namespaceIds, textRuns } from "./dom";
import {
  arrangeWikipediaMainPageSections,
  createLandingIntroduction,
  createShortcutGuide,
  extractWikipediaMainPageSections,
  WIKIPEDIA_MAIN_PAGE_TITLE,
} from "./homepage";
import { createLocaleSwitch } from "./locale-switch";
import { createSearchBox } from "./search";
import { markModelSettled, markModelStarted, modelKilledThisBrowser, type ModelStores } from "./model-gate";
import { createTheater, type Theater } from "./theater";
import { createTranslationRevealController, type TranslationRevealController } from "./reveal";
import { applyReaderSettings, createReaderSettingsPanel, loadReaderSettings } from "./settings";

export interface AppShell {
  main: HTMLElement;
  status: HTMLElement;
  footer: HTMLElement;
  navigate: (path: string) => void;
  storage: Pick<Storage, "getItem" | "setItem">;
  /** Where the model's attempt and kill records live; see `./model-gate`. */
  stores: ModelStores;
  /**
   * Whether a previous document of this browser was killed by the model. Decided
   * once, when the document starts, because the record is about documents: a
   * navigation inside this one is proof we are alive, so consulting the store per
   * render would refuse the next article whenever someone navigated away from a
   * translation in progress — that fires no `pagehide` and leaves the marker set.
   */
  modelUnsupported: boolean;
}

const MODEL_REPOSITORY_URL = "https://huggingface.co/osolmaz/GoePT-1-20M";

/**
 * What a browser that cannot run the model gets instead of a reader.
 *
 * Not the untranslated article: Almanpedia exists to translate, and serving the
 * Standard German text would be this site pretending to work while doing nothing
 * the German Wikipedia does not already do. It refuses, says why, and points at
 * the two things that do work — a desktop browser, and the original article.
 */
function createUnsupportedNotice(title?: string): HTMLElement {
  const t = uiText();
  return el("section", { class: "unsupported", lang: t.htmlLang }, [
    el("p", { class: "form-tag" }, [t.unsupported.tag]),
    el("h1", {}, [t.unsupported.heading]),
    el("p", {}, [t.unsupported.body]),
    el("p", {}, [t.unsupported.advice]),
    el("p", { class: "unsupported-note" }, [t.unsupported.note]),
    el("nav", { class: "unsupported-links" }, [
      ...(title
        ? [el("a", { href: articleUrl(title), target: "_blank", rel: "noopener" }, [
            t.unsupported.readWikipedia(displayTitle(title)),
          ])]
        : []),
      el("a", { href: "https://alman.ai/", target: "_blank", rel: "noopener" }, [t.unsupported.whatIsAlman]),
    ]),
  ]);
}

let activeController: DomTranslatorController | null = null;
let activeRevealController: TranslationRevealController | null = null;
let activeTheater: Theater | null = null;
let stopActiveContents: (() => void) | null = null;
let articleRenderSequence = 0;
let activeArticleRender: { id: number; controller: AbortController } | null = null;
const articleRuntimeByLayout = new WeakMap<HTMLElement, { status: HTMLElement }>();

function cancelActiveArticleRender(): void {
  activeArticleRender?.controller.abort();
  activeArticleRender = null;
}

function beginArticleRender(): { id: number; controller: AbortController } {
  cancelActiveArticleRender();
  const render = { id: ++articleRenderSequence, controller: new AbortController() };
  activeArticleRender = render;
  return render;
}

function isActiveArticleRender(render: { id: number; controller: AbortController }): boolean {
  return activeArticleRender?.id === render.id && !render.controller.signal.aborted;
}

function finishArticleRender(render: { id: number }): void {
  if (activeArticleRender?.id === render.id) activeArticleRender = null;
}

function stopActiveTranslation(): void {
  activeTheater?.stop();
  activeTheater = null;
  activeController?.stop();
  activeController = null;
  activeRevealController?.destroy();
  activeRevealController = null;
  stopActiveContents?.();
  stopActiveContents = null;
}

function modelStores(durable: Pick<Storage, "getItem" | "setItem">): ModelStores {
  return { session: browserStorage("session"), durable };
}

export function renderShell(root: HTMLElement, navigate: (path: string) => void): AppShell {
  const t = uiText();
  const storage = browserStorage();
  applyReaderSettings(document.documentElement, loadReaderSettings(storage));
  const status = el("div", { class: "header-status", role: "status" });
  const header = el("header", { class: "site-header" }, [
    el("div", { class: "header-inner" }, [createHeaderBrand(), createSearchBox(navigate), status, createLocaleSwitch()]),
  ]);
  const main = el("main", { class: "site-main" });
  const footer = el("footer", { class: "site-footer" }, [
    el("div", { class: "footer-inner" }, textRuns(t.footer)),
  ]);
  root.replaceChildren(header, main, footer);
  // Read the record before anything can clear it, then clear it: this document is
  // running, whatever happened to the last one.
  const stores = modelStores(storage);
  const modelUnsupported = modelKilledThisBrowser(stores);
  markModelSettled(stores);
  // A normal departure clears a fresh attempt; a browser killing the tab for
  // memory does not fire this, which is how the two are told apart.
  window.addEventListener("pagehide", () => markModelSettled(stores));
  return { main, status, footer, navigate, storage, stores, modelUnsupported };
}

/**
 * The description travels with the title: a page served in English should not
 * describe itself in German to anything that reads the head without running it.
 */
function setMetaDescription(text: string): void {
  document.querySelector('meta[name="description"]')?.setAttribute("content", text);
}

export async function renderLanding(shell: AppShell): Promise<void> {
  cancelActiveArticleRender();
  stopActiveTranslation();
  const t = uiText();
  const unsupported = shell.modelUnsupported;
  shell.footer.hidden = false;
  shell.main.removeAttribute("aria-busy");
  document.title = t.documentTitle;
  setMetaDescription(t.documentDescription);
  const progress = progressBar();
  const feed = el("div", { class: "landing-feed wiki-content", lang: "de" }, [
    el("p", { class: "loading" }, [t.landing.feedLoading]),
  ]);
  shell.main.className = "site-main landing-page";
  shell.status.replaceChildren(progress.element);
  const theater = createTheater();
  activeTheater = theater;
  shell.main.replaceChildren(
    el("section", { class: "landing" }, [
      // The figure opens on the brand at full size, so it stands where the
      // landing heading used to and the page is not headed by two of them.
      createLandingHeading(),
      theater.element,
      createLandingIntroduction(),
      createShortcutGuide(),
      // The figure needs no model, so the explanation of Alman survives even where
      // the reader cannot run; the feed does not, and is not offered untranslated.
      ...(unsupported ? [createUnsupportedNotice()] : [
        el("div", { class: "landing-feed-heading" }, [
          el("h2", {}, [t.landing.feedHeading]),
          el("a", { href: articleUrl(WIKIPEDIA_MAIN_PAGE_TITLE), target: "_blank", rel: "noopener" }, [t.landing.feedOriginal]),
        ]),
        feed,
      ]),
    ]),
  );
  // The autoplay observer needs the stage in the document to measure it.
  theater.start();
  if (unsupported) {
    progress.done();
    shell.status.replaceChildren();
    return;
  }

  try {
    const page = await fetchArticleHtml(WIKIPEDIA_MAIN_PAGE_TITLE);
    if (!feed.isConnected) return;
    const fragment = prepareParsoidBody(page.html);
    const sections = extractWikipediaMainPageSections(fragment);
    feed.replaceChildren(...arrangeWikipediaMainPageSections(sections));
  } catch (error) {
    if (!feed.isConnected) return;
    progress.done();
    feed.replaceChildren(el("p", { class: "landing-feed-error" }, [t.landing.feedError]));
    console.error("Wikipedia main page fetch failed", error);
    return;
  }

  // Loading the model is what kills a phone tab, so on a device that should be
  // asked first this waits for a press instead. See ./model-gate.
  async function startTranslation(): Promise<void> {
    try {
      await initModel((assetProgress: AssetProgress) => {
        if (!feed.isConnected) return;
        if (assetProgress.phase === "download") {
          const percent = Math.round((assetProgress.overallLoaded / assetProgress.overallTotal) * 100);
          progress.set(assetProgress.overallLoaded / assetProgress.overallTotal, t.progress.loadingModel(percent));
        } else {
          progress.set(1, t.progress.preparingModel);
        }
      });
    } catch (error) {
      markModelSettled(shell.stores);
      if (!feed.isConnected) return;
      progress.done();
      shell.status.append(el("span", { class: "status-error" }, [t.reader.translationUnavailableMainPage]));
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
        progress.set(done / stats.totalBlocks, t.progress.translatingMainPage(Math.round((done / stats.totalBlocks) * 100)));
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

  markModelStarted(shell.stores);
  await startTranslation();
}

export function createArticleAttribution(title: string): HTMLElement {
  const t = uiText();
  return el("div", { class: "attribution", translate: "no", lang: t.htmlLang }, [
    el("span", {}, [t.attribution.source]),
    el("a", { href: articleUrl(title), target: "_blank", rel: "noopener" }, [t.attribution.sourceLink(displayTitle(title))]),
    el("span", {}, [t.attribution.separator]),
    el("a", { href: historyUrl(title), target: "_blank", rel: "noopener" }, [t.attribution.authors]),
    el("span", {}, [t.attribution.license]),
    el("a", { href: MODEL_REPOSITORY_URL, target: "_blank", rel: "noopener" }, ["GoePT-1-20M"]),
    el("span", {}, [t.attribution.errors]),
    el("a", { href: "https://alman.ai/", target: "_blank", rel: "noopener" }, ["alman.ai"]),
    el("span", {}, ["."]),
  ]);
}

interface ProgressBar {
  element: HTMLElement;
  indeterminate: (label: string) => void;
  set: (fraction: number, label: string) => void;
  done: () => void;
}

function progressBar(): ProgressBar {
  const fill = el("div", { class: "progress-fill" });
  const label = el("span", { class: "progress-label" });
  const element = el("div", { class: "progress", hidden: "" }, [el("div", { class: "progress-track" }, [fill]), label]);
  return {
    element,
    indeterminate(text) {
      element.hidden = false;
      element.setAttribute("data-indeterminate", "");
      fill.style.width = "36%";
      label.textContent = text;
    },
    set(fraction, text) {
      element.hidden = false;
      element.removeAttribute("data-indeterminate");
      fill.style.width = `${Math.round(fraction * 100)}%`;
      label.textContent = text;
    },
    done() {
      element.hidden = true;
      element.removeAttribute("data-indeterminate");
      fill.style.width = "100%";
      label.textContent = "";
    },
  };
}

function scrollToArticlePosition(hash: string | undefined): void {
  requestAnimationFrame(() => {
    if (hash) document.getElementById(hash)?.scrollIntoView();
    else window.scrollTo(0, 0);
  });
}

const SLOW_ARTICLE_LOAD_MS = 8_000;

interface ArticleLoadingPresentation {
  progress: ProgressBar;
  retainedLayout: HTMLElement | null;
  commit: () => void;
  restore: () => void;
}

function createArticleLoadingSkeleton(title: string): HTMLElement {
  const lines = ["long", "medium", "long", "short", "medium", "long", "short"]
    .map((width) => el("span", { class: `article-loading-line article-loading-line-${width}` }));
  const contents = el("aside", { class: "article-loading-rail", "aria-hidden": "true" }, [
    el("span", { class: "article-loading-rail-heading" }),
    el("span"),
    el("span"),
    el("span"),
    el("span"),
  ]);
  const column = el("div", { class: "article-column article-loading-column" }, [
    el("div", { class: "article-head" }, [el("h1", { class: "article-title", lang: "de" }, [displayTitle(title)])]),
    el("div", { class: "article-loading-copy", "aria-hidden": "true" }, lines),
  ]);
  const appearance = el("aside", { class: "article-loading-rail article-loading-appearance", "aria-hidden": "true" }, [
    el("span", { class: "article-loading-rail-heading" }),
    el("span"),
    el("span"),
  ]);
  return el("div", { class: "article-layout", "data-article-loading-skeleton": "" }, [contents, column, appearance]);
}

function createSlowArticleNotice(title: string, onRetry: () => void): HTMLElement {
  const t = uiText();
  const retry = el("button", { type: "button", class: "retry" }, [t.reader.retry]);
  retry.addEventListener("click", onRetry);
  return el("section", { class: "article-loading-notice", hidden: "", "aria-live": "polite" }, [
    el("p", {}, [t.reader.slowLoad]),
    el("div", { class: "article-loading-notice-actions" }, [
      retry,
      el("a", { href: articleUrl(title), target: "_blank", rel: "noopener" }, [t.reader.openOriginal]),
    ]),
  ]);
}

function beginArticleLoading(
  shell: AppShell,
  title: string,
  signal: AbortSignal,
  onRetry: () => void,
): ArticleLoadingPresentation {
  const retainedLayout = shell.main.classList.contains("article-page")
    ? shell.main.querySelector<HTMLElement>('.article-layout:not([data-article-loading-skeleton])')
    : null;
  const previousDocumentTitle = retainedLayout?.dataset.articleDocumentTitle ?? document.title;
  const retainedStatus = retainedLayout ? articleRuntimeByLayout.get(retainedLayout)?.status : undefined;
  const progress = progressBar();
  progress.indeterminate(uiText().progress.loadingArticle(displayTitle(title)));
  shell.status.replaceChildren(progress.element);
  shell.footer.hidden = true;
  shell.main.className = "site-main article-page article-loading";
  shell.main.setAttribute("aria-busy", "true");
  document.title = `${displayTitle(title)} – Almanpedia`;

  const notice = createSlowArticleNotice(title, onRetry);
  if (retainedLayout) {
    activeRevealController?.setPaused(true);
    retainedLayout.setAttribute("inert", "");
    retainedLayout.setAttribute("data-article-retained", "");
    shell.main.replaceChildren(notice, retainedLayout);
  } else {
    stopActiveTranslation();
    shell.main.replaceChildren(notice, createArticleLoadingSkeleton(title));
  }

  const slowTimer = window.setTimeout(() => {
    if (notice.isConnected) notice.hidden = false;
  }, SLOW_ARTICLE_LOAD_MS);
  signal.addEventListener("abort", () => window.clearTimeout(slowTimer), { once: true });
  const clearLoadingState = () => {
    window.clearTimeout(slowTimer);
    notice.remove();
    shell.main.classList.remove("article-loading");
    shell.main.removeAttribute("aria-busy");
    retainedLayout?.removeAttribute("inert");
    retainedLayout?.removeAttribute("data-article-retained");
  };

  return {
    progress,
    retainedLayout,
    commit() {
      clearLoadingState();
      progress.indeterminate(uiText().progress.preparingTranslation);
    },
    restore() {
      clearLoadingState();
      progress.done();
      shell.status.replaceChildren(...(retainedStatus ? [retainedStatus] : []));
      document.title = previousDocumentTitle;
      activeRevealController?.setPaused(false);
    },
  };
}

function showRetainedArticleError(
  shell: AppShell,
  title: string,
  hash: string | undefined,
  error: unknown,
): void {
  const t = uiText();
  const retry = el("button", { type: "button", class: "retry" }, [t.reader.retry]);
  retry.addEventListener("click", () => void renderArticle(shell, title, hash));
  const message = error instanceof ArticleNotFoundError
    ? t.reader.retainedNotFound(displayTitle(title))
    : t.reader.retainedLoadFailed(displayTitle(title));
  shell.main.prepend(el("section", { class: "article-loading-error", role: "alert" }, [
    el("p", {}, [message]),
    el("div", { class: "article-loading-notice-actions" }, [
      retry,
      el("a", { href: articleUrl(title), target: "_blank", rel: "noopener" }, [t.reader.openOriginal]),
    ]),
  ]));
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
  if (shell.modelUnsupported) {
    cancelActiveArticleRender();
    stopActiveTranslation();
    shell.main.className = "site-main";
    shell.main.removeAttribute("aria-busy");
    shell.status.replaceChildren();
    shell.footer.hidden = false;
    document.title = `${displayTitle(title)} – Almanpedia`;
    shell.main.replaceChildren(createUnsupportedNotice(title));
    return;
  }
  const render = beginArticleRender();
  const loading = beginArticleLoading(shell, title, render.controller.signal, () => void renderArticle(shell, title, hash));
  const progress = loading.progress;

  let article;
  try {
    article = await fetchArticleHtml(title, render.controller.signal);
  } catch (error) {
    if (!isActiveArticleRender(render)) return;
    finishArticleRender(render);
    loading.restore();
    if (loading.retainedLayout) showRetainedArticleError(shell, title, hash, error);
    else renderArticleError(shell, title, error, hash);
    return;
  }
  if (!isActiveArticleRender(render)) return;

  const sourceTitle = displayTitle(article.title);
  const sourceDocumentTitle = `${sourceTitle} – Almanpedia`;
  let fragment: DocumentFragment;
  try {
    fragment = prepareParsoidBody(article.html);
  } catch (error) {
    if (!isActiveArticleRender(render)) return;
    finishArticleRender(render);
    loading.restore();
    if (loading.retainedLayout) showRetainedArticleError(shell, title, hash, error);
    else renderArticleError(shell, title, error, hash);
    console.error("Wikipedia article preparation failed", error);
    return;
  }

  loading.commit();
  stopActiveTranslation();

  const heading = el("h1", { class: "article-title", lang: "de" }, [sourceTitle]);
  /*
   * The three views of one article as a tab strip on the rule under the title —
   * the shape Wikipedia uses for Artikel/Diskussion and Lesen/Quelltext/
   * Versionsgeschichte. Two toggle buttons said less than this: the states are
   * mutually exclusive, so exactly one of them is current at any moment, and a
   * strip shows which without being read.
   */
  const t = uiText();
  const almanTab = el("button", { class: "article-view", type: "button", disabled: "", "aria-pressed": "true" }, [t.reader.tabAlman]);
  const originalTab = el("button", { class: "article-view", type: "button", disabled: "", "aria-pressed": "false" }, [t.reader.tabOriginal]);
  const differenceTab = el("button", { class: "article-view", type: "button", disabled: "", "aria-pressed": "false" }, [t.reader.tabChanges]);
  const actions = el("div", {
    class: "article-actions",
    role: "group",
    "aria-label": t.reader.viewLabel,
    translate: "no",
    lang: t.htmlLang,
  }, [almanTab, originalTab, differenceTab]);
  const content = el("article", { class: "wiki-content", lang: "de" });
  content.append(fragment);
  const contents = createArticleContents(content, window.matchMedia?.("(max-width: 56rem)"));
  stopActiveContents = () => contents.destroy();
  const settings = createReaderSettingsPanel(document.documentElement, shell.storage);
  const settingsToggle = el("button", {
    class: "toggle-settings",
    type: "button",
    "aria-expanded": "false",
  }, [t.settings.panelTitle]);
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
  const articleLayout = el("div", {
    class: "article-layout",
    "data-article-enter": "",
    "data-article-document-title": sourceDocumentTitle,
  }, [contents.element, articleColumn, el("aside", { class: "appearance-column" }, [settings.element])]);
  const articleStatus = el("div", { class: "article-status" }, [progress.element]);
  articleRuntimeByLayout.set(articleLayout, { status: articleStatus });
  shell.status.replaceChildren(articleStatus);
  shell.main.className = "site-main article-page";
  shell.main.replaceChildren(articleLayout);
  scrollToArticlePosition(hash);
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
    if (!shell.main.classList.contains("article-loading")) {
      const visibleDocumentTitle = translatedTitleVisible
        ? `${heading.textContent ?? sourceTitle} – Almanpedia`
        : sourceDocumentTitle;
      articleLayout.dataset.articleDocumentTitle = visibleDocumentTitle;
      document.title = visibleDocumentTitle;
    }
  };

  const hideDifferences = () => {
    showingDifferences = false;
    differenceContent?.remove();
    differenceContent = null;
    content.hidden = false;
    revealController?.setPaused(showingOriginal);
    syncContentLanguage();
  };

  const showDifferences = () => {
    if (!activeController) return;
    const clone = activeController.createDifferenceClone(content);
    clone.classList.add("wiki-difference");
    clone.setAttribute("translate", "no");
    clone.prepend(el("p", { class: "difference-legend" }, [
      el("span", { class: "difference-legend-removed" }, [t.reader.differenceRemoved]),
      " ",
      el("span", { class: "difference-legend-added" }, [t.reader.differenceAdded]),
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

  type ArticleView = "alman" | "original" | "changes";
  const viewTabs: Array<[ArticleView, HTMLButtonElement]> = [
    ["alman", almanTab],
    ["original", originalTab],
    ["changes", differenceTab],
  ];

  /** Switch between the three views. Selecting the current one does nothing. */
  function setView(next: ArticleView): void {
    if (!activeController) return;
    const current: ArticleView = showingDifferences ? "changes" : showingOriginal ? "original" : "alman";
    if (next === current) return;

    if (current === "changes") hideDifferences();
    if (next === "original") {
      showingOriginal = true;
      revealController?.setPaused(true);
      activeController.restoreOriginals();
    } else if (showingOriginal) {
      showingOriginal = false;
      activeController.reapplyTranslations();
      revealController?.setPaused(false);
    }
    if (next === "changes") {
      showingDifferences = true;
      revealController?.setPaused(true);
      activeController.translateAll();
      showDifferences();
    }
    for (const [view, tab] of viewTabs) tab.setAttribute("aria-pressed", String(view === next));
    syncContentLanguage();
    contents.refresh();
  }

  for (const [view, tab] of viewTabs) tab.addEventListener("click", () => setView(view));

  async function startTranslation(): Promise<void> {
    try {
      await initModel((assetProgress: AssetProgress) => {
        if (!articleColumn.isConnected) return;
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
      markModelSettled(shell.stores);
      if (!articleColumn.isConnected) return;
      finishArticleRender(render);
      progress.done();
      articleStatus.append(el("span", { class: "status-error" }, [t.reader.translationUnavailableArticle]));
      console.error("model init failed", error);
      return;
    }
    if (!articleColumn.isConnected) return;

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
        progress.set(done / stats.totalBlocks, t.progress.translatingArticle(Math.round((done / stats.totalBlocks) * 100)));
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
    if (shell.main.classList.contains("article-loading")) revealController.setPaused(true);
    for (const [, tab] of viewTabs) tab.removeAttribute("disabled");
    controller.start();
    controller.translateAll();
  }

  markModelStarted(shell.stores);
  await startTranslation();
  finishArticleRender(render);
}

function renderArticleError(shell: AppShell, title: string, error: unknown, hash?: string): void {
  const t = uiText();
  shell.main.className = "site-main";
  shell.main.removeAttribute("aria-busy");
  shell.status.replaceChildren();
  document.title = `${displayTitle(title)} – Almanpedia`;
  if (error instanceof ArticleNotFoundError) {
    shell.main.replaceChildren(
      el("section", { class: "error-view" }, [
        el("p", { class: "form-tag" }, [t.reader.notFoundTag]),
        el("h1", {}, [t.reader.notFoundHeading]),
        el("p", {}, [t.reader.notFoundBody(displayTitle(title))]),
        el("p", {}, [
          el("a", { href: `https://de.wikipedia.org/w/index.php?search=${encodeURIComponent(displayTitle(title))}`, target: "_blank", rel: "noopener" }, [
            t.reader.notFoundSearch,
          ]),
          el("span", {}, [t.reader.notFoundSearchHint]),
        ]),
      ]),
    );
    return;
  }
  shell.main.replaceChildren(
    el("section", { class: "error-view" }, [
      el("p", { class: "form-tag" }, [t.reader.failureTag]),
      el("h1", {}, [t.reader.loadFailedHeading]),
      el("p", {}, [t.reader.loadFailedBody]),
      el("p", {}, [
        (() => {
          const retry = el("button", { type: "button", class: "retry" }, [t.reader.retry]);
          retry.addEventListener("click", () => void renderArticle(shell, title, hash));
          return retry;
        })(),
      ]),
    ]),
  );
}
