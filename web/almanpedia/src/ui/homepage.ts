import { el } from "./dom";

export const WIKIPEDIA_MAIN_PAGE_TITLE = "Wikipedia:Hauptseite";

export function createLandingIntroduction(): HTMLElement {
  return el("section", { class: "landing-intro", "aria-labelledby": "landing-intro-title" }, [
    el("h2", { id: "landing-intro-title" }, ["Willkommen bei Almanpedia"]),
    el("p", {}, [
      "Almanpedia ist die Selbstlern-Website von ",
      el("a", { href: "https://alman.ai/", target: "_blank", rel: "noopener" }, ["Alman AI"]),
      ". Sie richtet sich an Menschen, das Deutsch lernen und echte Texte lesen wollen, ohne für jede Substantiv die grammatische Geschlecht auswendig lernen zu müssen.",
    ]),
    el("p", {}, [
      "Alman AI entwickelt Alman, ein vereinfachte deutsche Dialekt. Alman verwendet ein einzige Artikelform und entfernt die meiste Kasusflexionen. Die Wortschatz, Wortstellung und Verbkonjugationen bleiben eng an die Standarddeutsche. ",
      el("a", { href: "https://alman.ai/", target: "_blank", rel: "noopener" }, ["Die interaktive Einführung auf alman.ai"]),
      " zeigt die Regeln Schritt für Schritt.",
    ]),
    el("p", { class: "landing-intro-note" }, [
      "Die aktuelle Inhalte der deutschsprachige Wikipedia erscheinen unten. Almanpedia übersetzt sie lokal in diese Browser.",
    ]),
    el("nav", { class: "landing-links", "aria-label": "Almanpedia entdecken" }, [
      el("a", { href: "/wiki/Kartoffel", "data-route": "" }, ["Beispielartikel lesen"]),
      el("a", { href: "https://alman.ai/al/", target: "_blank", rel: "noopener" }, ["Alman-Spezifikation"]),
    ]),
  ]);
}

export function createShortcutGuide(): HTMLElement {
  const addressFrames = el("div", { class: "demo-address-text" }, [
    el("span", { class: "demo-address-frame demo-address-start" }, ["de.wikipedia.org/wiki/Kartoffel"]),
    el("span", { class: "demo-address-frame demo-address-select" }, [
      "de.",
      el("span", { class: "demo-selection" }, ["wiki"]),
      "pedia.org/wiki/Kartoffel",
    ]),
    el("span", { class: "demo-address-frame demo-address-type" }, [
      "de.",
      el("span", { class: "demo-typed-word" }, ["alman"]),
      el("span", { class: "demo-caret" }),
      "pedia.org/wiki/Kartoffel",
    ]),
    el("span", { class: "demo-address-frame demo-address-alias" }, ["de.almanpedia.org/wiki/Kartoffel"]),
    el("span", { class: "demo-address-frame demo-address-final" }, ["almanpedia.org/wiki/Kartoffel"]),
  ]);
  const browserDemo = el("div", { class: "browser-demo", "aria-hidden": "true" }, [
    el("div", { class: "browser-demo-toolbar" }, [
      el("div", { class: "browser-demo-tab" }, [
        el("span", { class: "browser-demo-controls" }, [el("i"), el("i"), el("i")]),
        el("span", { class: "browser-demo-tab-title" }, ["Kartoffel"]),
      ]),
      el("div", { class: "browser-demo-address" }, [
        addressFrames,
        el("kbd", { class: "demo-enter" }, ["↵"]),
      ]),
      el("div", { class: "browser-demo-progress" }),
    ]),
    el("div", { class: "browser-demo-page" }, [
      el("div", { class: "demo-source-page" }, [
        el("span", { class: "demo-site-name" }, ["Wikipedia"]),
        el("h3", {}, ["Kartoffel"]),
        el("div", { class: "demo-copy-line demo-copy-line-long" }),
        el("div", { class: "demo-copy-line" }),
        el("div", { class: "demo-copy-line demo-copy-line-short" }),
      ]),
      el("div", { class: "demo-target-page" }, [
        el("img", { src: "/brand/almanpedia-wordmark.svg", alt: "" }),
        el("h3", {}, ["Kartoffel"]),
        el("div", { class: "demo-copy-line demo-copy-line-long" }),
        el("div", { class: "demo-copy-line" }),
        el("div", { class: "demo-copy-line demo-copy-line-short" }),
      ]),
    ]),
  ]);

  return el("section", { class: "shortcut-guide", "aria-labelledby": "shortcut-title" }, [
    browserDemo,
    el("div", { class: "shortcut-copy" }, [
      el("h2", { id: "shortcut-title" }, ["Ein Wort in die Adresse ändern"]),
      el("p", {}, [
        "Bei ein Artikel der deutschsprachige Wikipedia ersetzen Sie am Anfang von ",
        el("code", {}, ["wikipedia"]),
        " die vier Buchstaben ",
        el("code", {}, ["wiki"]),
        " durch ",
        el("code", {}, ["alman"]),
        ". Die gleiche Artikel öffnet sich dann in Almanpedia.",
      ]),
      el("a", {
        class: "shortcut-url",
        href: "https://de.almanpedia.org/wiki/Kartoffel",
        target: "_blank",
        rel: "noopener",
      }, ["de.almanpedia.org/wiki/Kartoffel"]),
      el("p", {}, ["Sie können auch die Suche oben benutzen."]),
      el("h3", {}, ["Übersetzung in die Browser"]),
      el("p", {}, [
        "Die Übersetzung läuft vollständig in Ihr Browser durch ",
        el("a", { href: "https://huggingface.co/osolmaz/GoePT-1-20M", target: "_blank", rel: "noopener" }, ["GoePT-1-20M"]),
        ", ein Modell mit 20 Millionen Parameter. Bei die erste Besuch lädt die Browser rund 34 MB herunter und speichert die Modell lokal. Artikeltexte werden an kein Almanpedia-Inferenzserver übertragen.",
      ]),
    ]),
  ]);
}

export function extractWikipediaMainPageSections(fragment: DocumentFragment): HTMLElement[] {
  const sections = Array.from(fragment.querySelectorAll<HTMLElement>(".hauptseite-box"))
    .filter((section) => section.id !== "willkommen");

  for (const section of sections) {
    section.querySelectorAll(".hauptseite-upward").forEach((element) => element.remove());
  }

  if (sections.length === 0) {
    throw new Error("Wikipedia main page did not contain any content sections");
  }
  return sections;
}

export function arrangeWikipediaMainPageSections(sections: HTMLElement[]): HTMLElement[] {
  const byId = new Map(sections.map((section) => [section.id, section]));
  const placed = new Set<HTMLElement>();
  const take = (ids: string[]) => ids.flatMap((id) => {
    const section = byId.get(id);
    if (!section) return [];
    placed.add(section);
    return [section];
  });
  const left = take(["artikel", "nachrichten", "wissenswertes"]);
  const right = take(["ereignisse", "verstorbene"]);
  const sisterProjects = byId.get("schwesterprojekte");
  if (sisterProjects) placed.add(sisterProjects);
  left.push(...sections.filter((section) => !placed.has(section)));

  return [
    el("div", { class: "landing-feed-column" }, left),
    el("div", { class: "landing-feed-column" }, right),
    ...(sisterProjects ? [sisterProjects] : []),
  ];
}
