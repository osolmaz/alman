import { el } from "./dom";

export interface ArticleContents {
  element: HTMLElement;
  refresh(): void;
  destroy(): void;
}

export interface ResponsiveContentsQuery {
  readonly matches: boolean;
  addEventListener(type: "change", listener: (event: MediaQueryListEvent) => void): void;
  removeEventListener(type: "change", listener: (event: MediaQueryListEvent) => void): void;
}

function ensureHeadingId(heading: HTMLHeadingElement, index: number, reservedIds: Set<string>): string {
  if (heading.id) {
    reservedIds.add(heading.id);
    return heading.id;
  }
  const base = heading.textContent?.trim().replaceAll(/\s+/gu, "_") || `Abschnitt_${index + 1}`;
  let candidate = base;
  let suffix = 2;
  while (reservedIds.has(candidate) || heading.ownerDocument.getElementById(candidate)) {
    candidate = `${base}_${suffix}`;
    suffix += 1;
  }
  heading.id = candidate;
  reservedIds.add(candidate);
  return candidate;
}

export function createArticleContents(article: Element, narrowQuery?: ResponsiveContentsQuery): ArticleContents {
  const list = el("ol", { class: "contents-list" });
  const details = el("details", { class: "contents-details" }, [
    el("summary", { class: "contents-heading" }, ["Inhalt"]),
    list,
  ]);
  const element = el("nav", { class: "article-contents", "aria-label": "Inhaltsverzeichnis" }, [details]);

  const setResponsiveState = (narrow: boolean) => {
    details.open = !narrow;
  };
  const handleViewportChange = (event: MediaQueryListEvent) => setResponsiveState(event.matches);
  if (narrowQuery) {
    setResponsiveState(narrowQuery.matches);
    narrowQuery.addEventListener("change", handleViewportChange);
  } else {
    details.open = true;
  }

  const refresh = () => {
    const headings = Array.from(article.querySelectorAll<HTMLHeadingElement>("h2, h3"));
    const reservedIds = new Set(
      Array.from(article.querySelectorAll<HTMLElement>("[id]"), (candidate) => candidate.id).filter(Boolean),
    );
    list.replaceChildren(
      ...headings.map((heading, index) => {
        const id = ensureHeadingId(heading, index, reservedIds);
        return el("li", { class: `contents-level-${heading.tagName === "H3" ? "3" : "2"}` }, [
          el("a", { href: `#${encodeURIComponent(id)}` }, [heading.textContent?.trim() || `Abschnitt ${index + 1}`]),
        ]);
      }),
    );
    element.hidden = headings.length === 0;
  };

  refresh();
  return {
    element,
    refresh,
    destroy() {
      narrowQuery?.removeEventListener("change", handleViewportChange);
    },
  };
}
