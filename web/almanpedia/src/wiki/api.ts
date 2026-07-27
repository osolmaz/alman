import { API_USER_AGENT, WIKI_ORIGIN } from "../config";

export class ArticleNotFoundError extends Error {
  constructor(public readonly title: string) {
    super(`article not found: ${title}`);
    this.name = "ArticleNotFoundError";
  }
}

export interface WikiArticleHtml {
  /** Canonical title (underscored) after Wikipedia redirect resolution. */
  title: string;
  html: string;
}

export function normalizeTitle(title: string): string {
  return title.replaceAll(" ", "_");
}

export function displayTitle(title: string): string {
  return title.replaceAll("_", " ");
}

function decodedTitle(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const decoded = decodeURIComponent(value).trim();
    return decoded ? normalizeTitle(decoded) : undefined;
  } catch {
    return undefined;
  }
}

function titleFromWikipediaUrl(value: string): string | undefined {
  let url: URL;
  try {
    url = new URL(value, WIKI_ORIGIN);
  } catch {
    return undefined;
  }
  if (url.origin !== WIKI_ORIGIN) return undefined;
  if (url.pathname.startsWith("/wiki/")) {
    return decodedTitle(url.pathname.slice("/wiki/".length));
  }
  const legacy = url.pathname.match(/^\/api\/rest_v1\/page\/html\/(.+)$/u)?.[1];
  if (legacy) return decodedTitle(legacy);
  const current = url.pathname.match(/^\/w\/rest\.php\/v1\/page\/(.+)\/html$/u)?.[1];
  return decodedTitle(current);
}

/** Resolve page identity from Parsoid metadata, with explicit REST URL fallbacks. */
export function canonicalArticleTitle(html: string, responseUrl: string, requestedTitle: string): string {
  const document = new DOMParser().parseFromString(html, "text/html");
  const versionHref = document.querySelector('link[rel="dc:isVersionOf"]')?.getAttribute("href");
  const metadataTitle = versionHref ? titleFromWikipediaUrl(versionHref) : undefined;
  if (metadataTitle) return metadataTitle;
  const documentTitle = document.querySelector("title")?.textContent?.trim();
  if (documentTitle) return normalizeTitle(documentTitle);
  return titleFromWikipediaUrl(responseUrl) ?? normalizeTitle(requestedTitle);
}

export async function fetchArticleHtml(title: string): Promise<WikiArticleHtml> {
  const normalized = normalizeTitle(title);
  const response = await fetch(`${WIKI_ORIGIN}/api/rest_v1/page/html/${encodeURIComponent(normalized)}`, {
    headers: { "Api-User-Agent": API_USER_AGENT },
    redirect: "follow",
  });
  if (response.status === 404) throw new ArticleNotFoundError(displayTitle(title));
  if (!response.ok) throw new Error(`Wikipedia request failed (HTTP ${response.status})`);
  const html = await response.text();
  return { title: canonicalArticleTitle(html, response.url, normalized), html };
}

export async function searchSuggestions(query: string, limit = 8): Promise<string[]> {
  const url = new URL(`${WIKI_ORIGIN}/w/api.php`);
  url.searchParams.set("action", "opensearch");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("search", query);
  const response = await fetch(url, { headers: { "Api-User-Agent": API_USER_AGENT } });
  if (!response.ok) return [];
  const payload = (await response.json()) as [string, string[], string[], string[]];
  return payload[1] ?? [];
}

export function articleUrl(title: string): string {
  return `${WIKI_ORIGIN}/wiki/${encodeURIComponent(normalizeTitle(title))}`;
}

export function historyUrl(title: string): string {
  return `${WIKI_ORIGIN}/w/index.php?title=${encodeURIComponent(normalizeTitle(title))}&action=history`;
}
