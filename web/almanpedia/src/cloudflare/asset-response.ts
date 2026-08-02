export interface PagesAssetContext {
  next: () => Promise<Response>;
}

/**
 * Keep Cloudflare Pages' SPA fallback for reader routes, but never let it turn a
 * missing browser asset into a cacheable 200 HTML response.
 */
export async function serveAssetOr404(context: PagesAssetContext): Promise<Response> {
  const response = await context.next();
  const contentType = response.headers.get("content-type") ?? "";
  if (response.status !== 200 || !contentType.toLowerCase().startsWith("text/html")) {
    return response;
  }
  return new Response("Not Found\n", {
    status: 404,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
