import { WIKI_ORIGIN } from "../config";

/**
 * German Wikipedia namespaces (plus their discussion variants) whose pages we
 * do not mirror; links to them go to Wikipedia itself. Article titles may
 * legitimately contain colons, so classification checks this list rather than
 * the mere presence of a colon.
 */
const EXTERNAL_NAMESPACES = new Set(
  [
    "Benutzer", "Benutzerin", "Bild", "Datei", "Diskussion", "Hilfe", "Kategorie",
    "MediaWiki", "Modul", "Portal", "Spezial", "Vorlage", "Wikipedia",
  ].flatMap((ns) => [ns, `${ns}_Diskussion`, `${ns} Diskussion`]),
);

const ALLOWED_MEDIA_HOSTS = new Set(["upload.wikimedia.org", "maps.wikimedia.org", "commons.wikimedia.org"]);

function markExternal(anchor: Element): void {
  anchor.setAttribute("target", "_blank");
  anchor.setAttribute("rel", "noopener");
}

function classifyWikiTitle(rawTitle: string): "internal" | "external" {
  const decoded = (() => {
    try {
      return decodeURIComponent(rawTitle);
    } catch {
      return rawTitle;
    }
  })();
  if (decoded.includes("?") || decoded.includes("#")) return "external";
  const colon = decoded.indexOf(":");
  if (colon > 0 && EXTERNAL_NAMESPACES.has(decoded.slice(0, colon))) return "external";
  return "internal";
}

function rewriteAnchor(anchor: Element): void {
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#")) return;

  if (href.startsWith("./")) {
    const rest = href.slice(2);
    const fragmentIndex = rest.indexOf("#");
    const title = fragmentIndex === -1 ? rest : rest.slice(0, fragmentIndex);
    const fragment = fragmentIndex === -1 ? "" : rest.slice(fragmentIndex);
    if (classifyWikiTitle(title) === "internal") {
      anchor.setAttribute("href", `/wiki/${title}${fragment}`);
      anchor.setAttribute("data-internal", "");
    } else {
      anchor.setAttribute("href", `${WIKI_ORIGIN}/wiki/${title}${fragment}`);
      markExternal(anchor);
    }
    return;
  }
  if (href.startsWith("//")) {
    anchor.setAttribute("href", `https:${href}`);
    markExternal(anchor);
    return;
  }
  if (href.startsWith("/")) {
    anchor.setAttribute("href", `${WIKI_ORIGIN}${href}`);
    markExternal(anchor);
    return;
  }
  if (href.startsWith("http://") || href.startsWith("https://")) {
    markExternal(anchor);
  }
}

function mediaHostAllowed(url: string): boolean {
  const absolute = url.startsWith("//") ? `https:${url}` : url;
  if (absolute.startsWith("/") || !absolute.includes("//")) return true; // same-origin relative, rewritten below
  try {
    return ALLOWED_MEDIA_HOSTS.has(new URL(absolute).hostname);
  } catch {
    return false;
  }
}

function rewriteMediaUrl(url: string): string {
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${WIKI_ORIGIN}${url}`;
  return url;
}

function rewriteMedia(element: Element): void {
  const src = element.getAttribute("src");
  const srcset = element.getAttribute("srcset");
  if ((src && !mediaHostAllowed(src)) || (srcset && !srcset.split(",").every((part) => mediaHostAllowed(part.trim().split(/\s+/)[0] ?? "")))) {
    element.remove();
    return;
  }
  if (src) element.setAttribute("src", rewriteMediaUrl(src));
  if (srcset) {
    element.setAttribute(
      "srcset",
      srcset
        .split(",")
        .map((part) => {
          const [url, ...descriptor] = part.trim().split(/\s+/);
          return [rewriteMediaUrl(url ?? ""), ...descriptor].join(" ");
        })
        .join(", "),
    );
  }
}

/**
 * Rewrites sanitized Parsoid content in place: article links stay on
 * almanpedia, namespace/external links leave for Wikipedia in a new tab,
 * media URLs are absolutized and restricted to Wikimedia hosts, and Parsoid
 * payload attributes are stripped.
 */
export function rewriteArticleDom(container: Element | DocumentFragment): void {
  for (const anchor of container.querySelectorAll("a[href]")) rewriteAnchor(anchor);
  for (const media of container.querySelectorAll("img, source")) rewriteMedia(media);
  for (const element of container.querySelectorAll("[data-mw]")) element.removeAttribute("data-mw");
  for (const element of container.querySelectorAll("[about]")) element.removeAttribute("about");
}
