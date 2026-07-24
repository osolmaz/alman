import { getEntry, type CollectionEntry } from "astro:content";
import lb from "../../../benchmark-results/almanbench-leaderboard.json";
import { englishPosts, translatedPost } from "../i18n/blog";
import {
  langCodes,
  localeHome,
  localeNames,
  localePrefix,
  locales,
  ui,
  type Locale,
} from "../i18n/ui";
import {
  almanBenchBibtex,
  almanBenchExample,
  getAlmanBenchCopy,
} from "./almanbench";
import { mdPath } from "./markdown-url";
import { renderScrollyMarkdown } from "./scrolly-markdown";

export const SITE_URL = "https://alman.ai";

export type MarkdownSection = "specification" | "benchmark" | "blog" | "about";

export interface MarkdownDoc {
  /** Canonical HTML URL path. */
  url: string;
  /** Raw Markdown URL path. */
  markdownUrl: string;
  /** Shared identity across translated editions. */
  translationKey: string;
  /** Locale of the route containing this document. */
  locale: Locale;
  /** Language of the content. This can be English on a fallback route. */
  language: string;
  title: string;
  date?: Date;
  section: MarkdownSection;
  body: string;
}

const routeFor = (locale: Locale, path = ""): string => {
  const prefix = localePrefix(locale);
  return path ? `${prefix}/${path}/` : localeHome(locale);
};

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

const markdownTable = (headers: string[], rows: Array<Array<string | number>>): string => {
  const escape = (value: string | number) =>
    String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
  return [
    `| ${headers.map(escape).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escape).join(" | ")} |`),
  ].join("\n");
};

function benchmarkBody(locale: Locale): string {
  const copy = getAlmanBenchCopy(locale);
  const fmtPct = (correct: number, total: number): string => {
    const pct = ((100 * correct) / total).toFixed(1);
    return locale === "en" ? `${pct}%` : `${pct.replace(".", ",")} %`;
  };
  const fmtInt = (value: number): string =>
    value.toLocaleString(locale === "en" ? "en-US" : "de-DE");
  const tierKeys = ["naturalistic", "targeted", "guards", "curated"] as const;

  const links = [
    `[${copy.linkDataset}](${lb.dataset})`,
    `[${copy.linkResults}](${lb.results})`,
    `[${copy.linkGithub}](https://github.com/osolmaz/alman)`,
    `[${copy.linkSpec}](${SITE_URL}${localeHome(locale)}#spec)`,
  ].join(" · ");

  const resultRows = lb.entries.map((entry, index) => [
    index + 1,
    entry.label,
    `${fmtPct(entry.acceptance[0], entry.acceptance[1])} (${entry.acceptance[0]}/${entry.acceptance[1]})`,
  ]);
  const tierRows = lb.entries.map((entry) => [
    entry.label,
    ...tierKeys.map(
      (tier) =>
        `${fmtPct(entry.tiers[tier][0], entry.tiers[tier][1])} (${entry.tiers[tier][0]}/${entry.tiers[tier][1]})`,
    ),
  ]);
  const compositionRows = copy.compRows.map(([tier, count, purpose]) => [
    String(tier),
    fmtInt(count as number),
    String(purpose),
  ]);
  const accepted = almanBenchExample.accepted
    .map(
      (rendering, index) =>
        `- ${rendering}${index === 0 ? ` (${copy.canonicalMark})` : ""}`,
    )
    .join("\n");

  return [
    copy.lead,
    "",
    copy.lead2,
    "",
    links,
    "",
    `## ${copy.resultsH}`,
    "",
    markdownTable(["Nr.", copy.thModel, "Score ↑"], resultRows),
    "",
    `### ${copy.tiersH}`,
    "",
    markdownTable([copy.thModel, ...tierKeys], tierRows),
    "",
    `## ${copy.compH}`,
    "",
    copy.compP,
    "",
    markdownTable(copy.compTh, compositionRows),
    "",
    `## ${copy.exampleH}`,
    "",
    copy.exampleIntro,
    "",
    `**${copy.exampleSrc}:** ${almanBenchExample.source}`,
    "",
    `**${copy.exampleAccepted}:**`,
    "",
    accepted,
    "",
    `## ${copy.runH}`,
    "",
    copy.runP,
    "",
    "```python",
    'from datasets import load_dataset',
    "",
    'ds = load_dataset(\"osolmaz/almanbench\", split=\"test\")',
    "```",
    "",
    "```console",
    "uv run inspect eval alman/bench/task.py --model openai/gpt-5-codex",
    "```",
    "",
    `## ${copy.citeH}`,
    "",
    "```bibtex",
    almanBenchBibtex,
    "```",
  ].join("\n");
}

const postListingBody = (
  locale: Locale,
  posts: Array<{ slug: string; entry: CollectionEntry<"blog"> }>,
): string =>
  posts
    .map(
      ({ slug, entry }) =>
        `- ${isoDate(entry.data.date)} [${entry.data.title}](${SITE_URL}${routeFor(locale, `blog/${slug}`)})`,
    )
    .join("\n");

export async function markdownDocs(): Promise<MarkdownDoc[]> {
  const docs: MarkdownDoc[] = [];
  const posts = await englishPosts();

  for (const locale of locales) {
    const specId = locale === "en" ? "spec" : `spec.${locale}`;
    const spec = await getEntry("spec", specId);
    if (!spec) throw new Error(`Specification entry '${specId}' not found.`);
    const specUrl = routeFor(locale);
    docs.push({
      url: specUrl,
      markdownUrl: mdPath(specUrl),
      translationKey: "specification",
      locale,
      language: langCodes[locale],
      title: ui[locale]["spec.title"],
      section: "specification",
      body:
        locale === "en"
          ? `${renderScrollyMarkdown()}\n\n---\n\n${(spec.body ?? "").trim()}`
          : (spec.body ?? "").trim(),
    });

    const benchmarkUrl = routeFor(locale, "almanbench");
    docs.push({
      url: benchmarkUrl,
      markdownUrl: mdPath(benchmarkUrl),
      translationKey: "almanbench",
      locale,
      language: langCodes[locale],
      title: "AlmanBench",
      date: new Date(`${lb.evaluated}T00:00:00Z`),
      section: "benchmark",
      body: benchmarkBody(locale),
    });

    const about = await getEntry("about", locale);
    if (!about) throw new Error(`About entry '${locale}' not found.`);
    const aboutUrl = routeFor(locale, "about");
    docs.push({
      url: aboutUrl,
      markdownUrl: mdPath(aboutUrl),
      translationKey: "about",
      locale,
      language: langCodes[locale],
      title: about.data.title,
      section: "about",
      body: (about.body ?? "").trim(),
    });

    const localizedPosts: Array<{
      slug: string;
      entry: CollectionEntry<"blog">;
      fallback: boolean;
    }> = [];
    for (const post of posts) {
      const translation = await translatedPost(post.id, locale);
      localizedPosts.push({
        slug: post.id,
        entry: translation ?? post,
        fallback: locale !== "en" && !translation,
      });
    }

    const blogUrl = routeFor(locale, "blog");
    docs.push({
      url: blogUrl,
      markdownUrl: mdPath(blogUrl),
      translationKey: "blog",
      locale,
      language: langCodes[locale],
      title: ui[locale]["nav.blog"],
      date: posts[0]?.data.date,
      section: "blog",
      body: postListingBody(locale, localizedPosts),
    });

    for (const { slug, entry, fallback } of localizedPosts) {
      const url = routeFor(locale, `blog/${slug}`);
      docs.push({
        url,
        markdownUrl: mdPath(url),
        translationKey: `blog/${slug}`,
        locale,
        language: fallback ? langCodes.en : langCodes[locale],
        title: entry.data.title,
        date: entry.data.date,
        section: "blog",
        body: (entry.body ?? "").trim(),
      });
    }
  }

  return docs;
}

export function serializeDoc(doc: MarkdownDoc): string {
  const lines = [
    "---",
    `title: ${JSON.stringify(doc.title)}`,
    `language: ${doc.language}`,
  ];
  if (doc.language !== langCodes[doc.locale]) lines.push(`locale: ${doc.locale}`);
  if (doc.date) lines.push(`date: ${isoDate(doc.date)}`);
  lines.push(`canonical: ${SITE_URL}${doc.url}`, "---", "", doc.body, "");
  return lines.join("\n");
}

export function translationGroups(docs: MarkdownDoc[]): Map<string, MarkdownDoc[]> {
  const groups = new Map<string, MarkdownDoc[]>();
  for (const doc of docs) {
    const group = groups.get(doc.translationKey) ?? [];
    group.push(doc);
    groups.set(doc.translationKey, group);
  }
  return groups;
}

export function llmsIndex(docs: MarkdownDoc[]): string {
  const lines = [
    "# Alman Institut",
    "",
    `- [llms-full.txt](${SITE_URL}/llms-full.txt)`,
    "",
  ];
  for (const locale of locales) {
    lines.push(`## ${localeNames[locale]}`, "");
    for (const doc of docs.filter((candidate) => candidate.locale === locale)) {
      const date = doc.date ? `: ${isoDate(doc.date)}` : "";
      lines.push(`- [${doc.title}](${SITE_URL}${doc.markdownUrl})${date}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function llmsFull(docs: MarkdownDoc[]): string {
  const seen = new Set<string>();
  const uniqueDocs = docs.filter((doc) => {
    const key = `${doc.translationKey}\u0000${doc.language}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const separator = "\n\n==========\n\n";
  return uniqueDocs.map((doc) => serializeDoc(doc).trimEnd()).join(separator) + "\n";
}
