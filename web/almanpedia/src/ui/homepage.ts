import { uiText } from "../i18n";
import { el, textRuns } from "./dom";
import { DEMO_ARTICLE_PATH, DEMO_ARTICLE_TITLE } from "./theater";

export const WIKIPEDIA_MAIN_PAGE_TITLE = "Wikipedia:Hauptseite";

export function createLandingIntroduction(): HTMLElement {
  const t = uiText();
  return el("section", { class: "landing-intro", "aria-labelledby": "landing-intro-title" }, [
    el("h2", { id: "landing-intro-title" }, [t.landing.introTitle]),
    el("p", {}, textRuns(t.landing.introLead)),
    el("p", {}, textRuns(t.landing.introMethod)),
    el("p", { class: "landing-intro-note" }, [t.landing.introNote]),
    el("nav", { class: "landing-links", "aria-label": t.landing.discoverLabel }, [
      el("a", { href: DEMO_ARTICLE_PATH, "data-route": "" }, [t.landing.readExample]),
      el("a", { href: "https://alman.ai/al/", target: "_blank", rel: "noopener" }, [t.landing.specification]),
    ]),
  ]);
}

/**
 * The prose beside the staged figure. The figure demonstrates the address swap
 * and the Alman rules; this section states them, so the page still explains
 * itself with the animation paused or unread by assistive technology.
 */
export function createShortcutGuide(): HTMLElement {
  const t = uiText();
  return el("section", { class: "shortcut-guide", "aria-labelledby": "shortcut-title" }, [
    el("div", { class: "shortcut-copy" }, [
      el("h2", { id: "shortcut-title" }, [t.landing.guideTitle]),
      el("p", {}, textRuns(t.landing.guideSteps)),
      el("a", {
        class: "shortcut-url",
        href: `https://de.almanpedia.org/wiki/${DEMO_ARTICLE_TITLE}`,
        target: "_blank",
        rel: "noopener",
      }, [`de.almanpedia.org/wiki/${DEMO_ARTICLE_TITLE}`]),
      el("p", {}, [t.landing.guideSearchHint]),
      el("h3", {}, [t.landing.guideDownloadTitle]),
      el("p", {}, textRuns(t.landing.guideDownload)),
    ]),
    el("div", { class: "shortcut-rules" }, [
      el("h3", {}, [t.landing.guideRulesTitle]),
      el("dl", {}, t.landing.guideRules.flatMap((rule) => [
        el("dt", {}, [rule.term]),
        el("dd", {}, [rule.detail]),
      ])),
      el("a", { href: "https://alman.ai/al/", target: "_blank", rel: "noopener" }, [t.landing.guideSpecification]),
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
