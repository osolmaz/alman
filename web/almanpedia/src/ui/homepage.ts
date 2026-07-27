import { el } from "./dom";

export const WIKIPEDIA_MAIN_PAGE_TITLE = "Wikipedia:Hauptseite";

export function createLandingIntroduction(): HTMLElement {
  return el("section", { class: "landing-intro", "aria-labelledby": "landing-intro-title" }, [
    el("h2", { id: "landing-intro-title" }, ["Willkommen bei Almanpedia"]),
    el("p", {}, [
      "Almanpedia ist die Selbstlern-Website von ",
      el("a", { href: "https://alman.ai/al/about/", target: "_blank", rel: "noopener" }, ["Alman AI"]),
      ". Sie richtet sich an Menschen, das Deutsch lernen und echte Texte lesen wollen, ohne für jede Substantiv die grammatische Geschlecht auswendig lernen zu müssen.",
    ]),
    el("p", {}, [
      "Alman AI entwickelt Alman, ein vereinfachte deutsche Dialekt. Alman verwendet ein einzige Artikelform und entfernt die meiste Kasusflexionen. Die Wortschatz, Wortstellung und Verbkonjugationen bleiben eng an die Standarddeutsche.",
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
