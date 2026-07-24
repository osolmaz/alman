import type { APIRoute } from "astro";
import {
  markdownDocs,
  serializeDoc,
  type MarkdownDoc,
} from "../lib/markdown-endpoints";

export async function getStaticPaths() {
  const docs = await markdownDocs();
  return docs.map((doc) => ({
    params: { mdpath: doc.markdownUrl.replace(/^\//, "").replace(/\.md$/, "") },
    props: { doc },
  }));
}

export const GET: APIRoute = ({ props }) =>
  new Response(serializeDoc(props.doc as MarkdownDoc), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
