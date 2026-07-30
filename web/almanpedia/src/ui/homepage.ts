import { el } from "./dom";
import { DEMO_ARTICLE_PATH, DEMO_ARTICLE_TITLE } from "./theater";

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
      el("a", { href: DEMO_ARTICLE_PATH, "data-route": "" }, ["Beispielartikel lesen"]),
      el("a", { href: "https://alman.ai/al/", target: "_blank", rel: "noopener" }, ["Alman-Spezifikation"]),
    ]),
  ]);
}

/**
 * The prose beside the staged figure. The figure demonstrates the address swap
 * and the Alman rules; this section states them, so the page still explains
 * itself with the animation paused or unread by assistive technology.
 */
export function createShortcutGuide(): HTMLElement {
  return el("section", { class: "shortcut-guide", "aria-labelledby": "shortcut-title" }, [
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
        href: `https://de.almanpedia.org/wiki/${DEMO_ARTICLE_TITLE}`,
        target: "_blank",
        rel: "noopener",
      }, [`de.almanpedia.org/wiki/${DEMO_ARTICLE_TITLE}`]),
      el("p", {}, ["Sie können auch die Suche oben benutzen."]),
      el("h3", {}, ["Übersetzung in die Browser"]),
      el("p", {}, [
        "Die Übersetzung läuft vollständig in Ihr Browser durch ",
        el("a", { href: "https://huggingface.co/osolmaz/GoePT-1-20M", target: "_blank", rel: "noopener" }, ["GoePT-1-20M"]),
        ", ein Modell mit 20 Millionen Parameter. Bei die erste Besuch lädt die Browser rund 34 MB herunter und speichert die Modell lokal. Artikeltexte werden an kein Almanpedia-Inferenzserver übertragen.",
      ]),
    ]),
    el("div", { class: "shortcut-rules" }, [
      el("h3", {}, ["Die Regeln in die Animation"]),
      el("dl", {}, [
        el("dt", {}, ["Alle Artikel werden die"]),
        el("dd", {}, ["„der“, „die“, „das“, „den“ und „dem“ fallen zu ein Form zusammen (§1a)."]),
        el("dt", {}, ["In die Genitiv bleibt der"]),
        el("dd", {}, ["Die Endung fällt weg: „des Hundes“ wird der Hund (§1b, §3a)."]),
        el("dt", {}, ["Ein für alle unbestimmte Artikel"]),
        el("dd", {}, ["„ein“, „eine“, „einen“ und „einem“ werden ein (§2a)."]),
        el("dt", {}, ["Jede Adjektivendung wird -e"]),
        el("dd", {}, ["„ein guter Mann“ wird ein gute Mann (§4a)."]),
        el("dt", {}, ["Kein Suffix -in"]),
        el("dd", {}, ["„die Lehrerin“ und „die Lehrer“ werden ein Wort (§10)."]),
        el("dt", {}, ["Verschmelzungen werden aufgelöst"]),
        el("dd", {}, ["„ins Kino“ wird in die Kino (§1f)."]),
      ]),
      el("a", { href: "https://alman.ai/al/", target: "_blank", rel: "noopener" }, ["Die vollständige Spezifikation"]),
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
