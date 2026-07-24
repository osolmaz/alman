import type { APIRoute } from "astro";
import { markdownDocs } from "../../lib/markdown-endpoints";
import { docOgCard, renderOgCard, type OgCard } from "../../lib/og";
import { ogPath } from "../../lib/og-path";

export async function getStaticPaths() {
  const docs = await markdownDocs();
  const paths = docs.map((doc) => ({
    params: {
      slug: ogPath(doc.url).replace(/^\/og\//, "").replace(/\.png$/, ""),
    },
    props: { card: docOgCard(doc) },
  }));
  paths.push({
    params: { slug: "default" },
    props: {
      card: {
        title: "A Simplified German Dialect",
        kicker: "Alman Institut",
        locale: "alman.ai",
        path: "/",
      } satisfies OgCard,
    },
  });
  return paths;
}

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgCard(props.card as OgCard);
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
