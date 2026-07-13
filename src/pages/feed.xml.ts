import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  // The feed carries the canonical English posts only; ids with a locale
  // suffix ("<slug>.de", "<slug>.al") are translations.
  const posts = (await getCollection("blog", (p) => !/\.(de|al)$/.test(p.id))).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
  return rss({
    title: "Alman Institut",
    description: "A Simplified German Dialect",
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/blog/${post.id}/`,
    })),
  });
}
