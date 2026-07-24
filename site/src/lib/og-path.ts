export const DEFAULT_OG_PATH = "/og/default.png";

/** Open Graph image path for a canonical page URL. */
export function ogPath(url: string): string {
  if (url === "/") return "/og/index.png";
  return `/og${url.replace(/\/$/, "")}.png`;
}
