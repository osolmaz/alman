import type { APIRoute } from "astro";
import { llmsIndex, markdownDocs } from "../lib/markdown-endpoints";

export const GET: APIRoute = async () =>
  new Response(llmsIndex(await markdownDocs()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
