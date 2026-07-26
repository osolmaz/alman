import {
  createDomTranslator,
  type AssetProgress,
  type DomTranslatorController,
} from "@alman/core";
import { getEngine, initModel } from "../engine";
import { ArticleNotFoundError, articleUrl, displayTitle, fetchArticleHtml, historyUrl } from "../wiki/api";
import { rewriteArticleDom } from "../wiki/rewrite";
import { sanitizeParsoidBody } from "../wiki/sanitize";
import { el, namespaceIds } from "./dom";
import { createSearchBox } from "./search";
import { MODEL_PACKAGE } from "@alman/core";

export interface AppShell {
  main: HTMLElement;
  status: HTMLElement;
  navigate: (path: string) => void;
}

let activeController: DomTranslatorController | null = null;

function stopActiveTranslation(): void {
  activeController?.stop();
  activeController = null;
}

export function renderShell(root: HTMLElement, navigate: (path: string) => void): AppShell {
  const status = el("div", { class: "header-status", role: "status" });
  const brand = el("a", { href: "/", "data-route": "", class: "brand" }, [
    el("span", { class: "brand-name" }, ["ALMANPEDIA"]),
    el("span", { class: "brand-sub" }, ["Die freie Enzyklopädie, amtlich vereinfacht"]),
  ]);
  const header = el("header", { class: "site-header" }, [
    el("div", { class: "header-inner" }, [brand, createSearchBox(navigate), status]),
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
      el("span", {}, [` durch GoePT-1-20M, lokal im Browser. Ein Projekt von alman.ai.`]),
    ]),
  ]);
  root.replaceChildren(header, main, footer);
  return { main, status, navigate };
}

export function renderLanding(shell: AppShell): void {
  stopActiveTranslation();
  document.title = "Almanpedia — Die freie Enzyklopädie, amtlich vereinfacht";
  shell.status.replaceChildren();
  shell.main.replaceChildren(
    el("section", { class: "landing" }, [
      el("p", { class: "form-tag" }, ["FORMBLATT AP-1 — HINWEIS ZUR BENUTZUNG"]),
      el("h1", {}, ["Almanpedia"]),
      el("p", { class: "lead" }, [
        "Almanpedia zeigt Artikel der deutschsprachigen Wikipedia in ",
        el("a", { href: "https://alman.ai", target: "_blank", rel: "noopener" }, ["Alman"]),
        " — ein vereinfachte Fassung des Deutschen ohne grammatisches Geschlecht und ohne die meisten Kasusformen.",
      ]),
      el("h2", {}, ["§1 Benutzung"]),
      el("p", {}, [
        "Ersetzen Sie in ein beliebige Adresse der deutschsprachigen Wikipedia das Wort ",
        el("code", {}, ["wikipedia"]),
        " durch ",
        el("code", {}, ["almanpedia"]),
        ":",
      ]),
      el("p", { class: "url-example" }, [
        el("code", {}, ["de.wikipedia.org/wiki/Kartoffel"]),
        el("span", { class: "url-arrow" }, [" → "]),
        el("code", {}, ["de.almanpedia.org/wiki/Kartoffel"]),
      ]),
      el("p", {}, ["Oder benutzen Sie die Suche oben."]),
      el("h2", {}, ["§2 Verfahren"]),
      el("p", {}, [
        "Die Übersetzung erfolgt vollständig in Ihr Browser durch das Sprachmodell GoePT-1-20M (20 Millionen Parameter). " +
          "Beim ersten Besuch lädt Ihr Browser das Modell einmalig herunter (ca. 34 MB); danach arbeitet es lokal. " +
          "Es werden keine Inhalte an ein Server von Almanpedia übertragen — es gibt kein solche Server.",
      ]),
      el("h2", {}, ["§3 Beispiel"]),
      el("p", {}, [
        el("a", { href: "/wiki/Kartoffel", "data-route": "" }, ["Kartoffel"]),
        " — die Wappenknolle dieser Anstalt.",
      ]),
    ]),
  );
}

function attributionBlock(title: string): HTMLElement {
  return el("div", { class: "attribution" }, [
    el("span", {}, ["Quelle: "]),
    el("a", { href: articleUrl(title), target: "_blank", rel: "noopener" }, [`„${displayTitle(title)}“ (de.wikipedia.org)`]),
    el("span", {}, [", "]),
    el("a", { href: historyUrl(title), target: "_blank", rel: "noopener" }, ["Autorinnen und Autoren"]),
    el("span", {}, [
      ". Text: CC BY-SA 4.0; diese maschinelle Alman-Fassung ist ein Bearbeitung unter derselben Lizenz. " +
        `Automatisch übersetzt durch GoePT-1-20M (${MODEL_PACKAGE.revision.slice(0, 7)}); Fehler vorbehalten.`,
    ]),
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
    },
  };
}

function scrollToArticleHash(hash: string | undefined): void {
  if (!hash) return;
  requestAnimationFrame(() => {
    document.getElementById(hash)?.scrollIntoView();
  });
}

export async function renderArticle(shell: AppShell, title: string, hash?: string): Promise<void> {
  stopActiveTranslation();
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

  const fragment = sanitizeParsoidBody(article.html);
  rewriteArticleDom(fragment);

  const heading = el("h1", { class: "article-title" }, [displayTitle(article.title)]);
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
  const actions = el("div", { class: "article-actions" }, [toggle, differenceToggle]);
  const content = el("article", { class: "wiki-content", lang: "de" });
  content.append(fragment);
  shell.main.replaceChildren(
    el("div", { class: "article-head" }, [heading, actions]),
    content,
    attributionBlock(article.title),
  );
  scrollToArticleHash(hash);
  if (document.title !== `${displayTitle(article.title)} – Almanpedia`) {
    document.title = `${displayTitle(article.title)} – Almanpedia`;
  }

  let showingOriginal = false;
  let showingDifferences = false;
  let translationComplete = false;
  let differenceContent: Element | null = null;

  const hideDifferences = () => {
    showingDifferences = false;
    differenceContent?.remove();
    differenceContent = null;
    content.hidden = false;
    differenceToggle.textContent = "Änderungen anzeigen";
    differenceToggle.setAttribute("aria-pressed", "false");
  };

  const showDifferences = () => {
    if (!activeController) return;
    const clone = activeController.createDifferenceClone();
    clone.classList.add("wiki-difference");
    clone.removeAttribute("hidden");
    clone.setAttribute("lang", translationComplete ? "de-AL" : "de");
    namespaceIds(clone, "diff-");
    differenceContent?.replaceWith(clone);
    if (!differenceContent) content.after(clone);
    differenceContent = clone;
    content.hidden = true;
  };

  toggle.addEventListener("click", () => {
    if (!activeController) return;
    if (showingDifferences) hideDifferences();
    showingOriginal = !showingOriginal;
    if (showingOriginal) {
      activeController.restoreOriginals();
      content.lang = "de";
    } else {
      activeController.reapplyTranslations();
      content.lang = translationComplete ? "de-AL" : "de";
    }
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
      content.lang = translationComplete ? "de-AL" : "de";
    }
    showingDifferences = true;
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
    root: content,
    engine: getEngine(),
    onStats: (stats) => {
      if (stats.totalBlocks === 0) return;
      const done = stats.totalBlocks - stats.pendingBlocks;
      if (stats.pendingBlocks === 0) translationComplete = true;
      if (showingDifferences) showDifferences();
      if (stats.pendingBlocks === 0) {
        if (!showingOriginal) content.lang = "de-AL";
        progress.done();
        return;
      }
      if (stats.pendingVisibleBlocks === 0) {
        progress.set(done / stats.totalBlocks, "SICHTBARER ABSCHNITT ÜBERSETZT. REST FOLGT BEIM SCROLLEN.");
        return;
      }
      progress.set(done / stats.totalBlocks, `ÜBERSETZUNG: ${Math.round((done / stats.totalBlocks) * 100)} %`);
    },
  });
  activeController = controller;
  toggle.removeAttribute("disabled");
  differenceToggle.removeAttribute("disabled");
  controller.start();
}

function renderArticleError(shell: AppShell, title: string, error: unknown): void {
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
