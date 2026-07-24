import type { APIRoute } from "astro";
import { llmsFull, markdownDocs } from "../lib/markdown-endpoints";

export const GET: APIRoute = async () =>
  new Response(llmsFull(await markdownDocs()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
