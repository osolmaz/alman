import type { APIRoute } from "astro";
import { langCodes } from "../i18n/ui";
import {
  SITE_URL,
  markdownDocs,
  translationGroups,
  type MarkdownDoc,
} from "../lib/markdown-endpoints";
import { ogPath } from "../lib/og-path";

const escapeXml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const lastModified = (doc: MarkdownDoc): string | undefined =>
  doc.date?.toISOString().slice(0, 10);

export const GET: APIRoute = async () => {
  const docs = await markdownDocs();
  const groups = translationGroups(docs);
  const urls: string[] = [];

  const addUrl = (
    loc: string,
    doc?: MarkdownDoc,
    alternates: MarkdownDoc[] = [],
    markdown = false,
  ) => {
    const links = alternates.map((alternate) => {
      const href = markdown ? alternate.markdownUrl : alternate.url;
      return `<xhtml:link rel="alternate" hreflang="${langCodes[alternate.locale]}" href="${escapeXml(`${SITE_URL}${href}`)}" />`;
    });
    const lastmod = doc && lastModified(doc);
    const image =
      doc && !markdown
        ? [
            "    <image:image>",
            `      <image:loc>${escapeXml(`${SITE_URL}${ogPath(doc.url)}`)}</image:loc>`,
            `      <image:title>${escapeXml(doc.title)}</image:title>`,
            "    </image:image>",
          ]
        : [];
    urls.push(
      [
        "  <url>",
        `    <loc>${escapeXml(loc)}</loc>`,
        ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
        ...links.map((link) => `    ${link}`),
        ...image,
        "  </url>",
      ].join("\n"),
    );
  };

  for (const doc of docs) {
    const alternates = groups.get(doc.translationKey) ?? [];
    addUrl(`${SITE_URL}${doc.url}`, doc, alternates);
    addUrl(`${SITE_URL}${doc.markdownUrl}`, doc, alternates, true);
  }
  addUrl(`${SITE_URL}/llms.txt`);
  addUrl(`${SITE_URL}/llms-full.txt`);
  addUrl(`${SITE_URL}/feed.xml`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
