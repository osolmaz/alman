/** Markdown mirror path for a canonical page URL. */
export function mdPath(url: string): string {
  if (url === "/") return "/index.md";
  return `${url.replace(/\/$/, "")}.md`;
}
