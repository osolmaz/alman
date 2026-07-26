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

export async function fetchArticleHtml(title: string): Promise<WikiArticleHtml> {
  const normalized = normalizeTitle(title);
  const response = await fetch(`${WIKI_ORIGIN}/api/rest_v1/page/html/${encodeURIComponent(normalized)}`, {
    headers: { "Api-User-Agent": API_USER_AGENT },
    redirect: "follow",
  });
  if (response.status === 404) throw new ArticleNotFoundError(displayTitle(title));
  if (!response.ok) throw new Error(`Wikipedia request failed (HTTP ${response.status})`);
  const html = await response.text();
  const finalSegment = new URL(response.url).pathname.split("/").pop() ?? normalized;
  return { title: decodeURIComponent(finalSegment), html };
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
