import {
  scrollyContent,
  type SentenceSegment,
  type TransformCell,
  type TransformRow,
} from "./scrolly-content";

const cellMarkdown = (cell: TransformCell): string =>
  cell.from && cell.to ? `${cell.from} → ${cell.to}` : (cell.text ?? "");

const markdownRow = (values: readonly string[]): string =>
  `|${values.map((value) => (value ? ` ${value} ` : " ")).join("|")}|`;

const markdownTable = (headers: readonly string[], rows: readonly (readonly string[])[]): string =>
  [
    markdownRow(headers),
    markdownRow(headers.map(() => "---")),
    ...rows.map(markdownRow),
  ].join("\n");

const transformTableMarkdown = (table: {
  headers: readonly string[];
  rows: readonly TransformRow[];
}): string =>
  markdownTable(
    ["", ...table.headers],
    table.rows.map((row) => [row.label, ...row.cells.map(cellMarkdown)]),
  );

const originalSentence = (segments: readonly SentenceSegment[]): string =>
  segments.map((segment) => (typeof segment === "string" ? segment : segment.from)).join("");

/** Generate a linear transcript from the same data used by the interactive component. */
export function renderScrollyMarkdown(): string {
  const c = scrollyContent;
  const sections = [
    `*${c.lead.kicker}*`,
    `## ${c.lead.title}`,
    c.lead.subtitle,
    `### ${c.steps[0].kicker}`,
    c.steps[0].body,
    `#### ${c.caseFile.head.left} · ${c.caseFile.head.right}`,
    c.caseFile.meta.join("<br>\n"),
    `> ${c.caseFile.quote}\n>\n> ${c.caseFile.attribution}`,
    `#### ${c.caseFile.annexLabel}`,
    c.caseFile.dialogue.map((line) => `**${line.speaker}** ${line.text}`).join("\n\n"),
    `### ${c.steps[1].kicker}`,
    c.steps[1].body,
    `### ${c.steps[2].kicker}`,
    c.steps[2].body,
    `#### ${c.inventory.head.right}`,
    markdownTable(
      c.inventory.headers,
      c.inventory.rows.map((row) => [
        `${row.item} (${row.gloss})`,
        `${row.gender} ${row.symbol}`,
      ]),
    ),
    c.inventory.verdict,
    `### ${c.steps[3].kicker}`,
    c.steps[3].body,
    `#### ${c.proposals.head.right}`,
    c.proposals.items.map((item) => `${item.value}. ${item.text}`).join("\n"),
    c.proposals.note,
    `### ${c.steps[4].kicker}`,
    c.steps[4].body,
    `#### ${c.germanArticles.head.left}: ${c.germanArticles.head.right}`,
    transformTableMarkdown(c.germanArticles),
    c.germanArticles.verdict,
    `### ${c.steps[5].kicker}`,
    c.steps[5].body,
    `#### ${c.oldEnglishArticles.head.right}`,
    transformTableMarkdown(c.oldEnglishArticles),
    c.oldEnglishArticles.verdict,
    `#### ${c.steps[6].kicker}`,
    c.steps[6].body,
    `### ${c.steps[7].kicker}`,
    `#### ${c.precedent.head.left} · ${c.precedent.head.right}`,
    c.steps[7].body,
    markdownTable(
      c.precedent.headers,
      c.precedent.rows.map((row) => [
        `${row.old} (${row.gloss})`,
        row.middle,
        row.today,
      ]),
    ),
    c.precedent.verdict,
    `### ${c.steps[8].kicker}`,
    c.steps[8].body,
    `### ${c.steps[9].kicker}`,
    c.steps[9].body,
    `#### ${c.document.head.left}: ${c.document.head.right}`,
    c.document.source,
    originalSentence(c.document.sentence),
    ...c.steps.slice(10, 14).flatMap((step) => [`### ${step.kicker}`, step.body]),
    `#### ${c.document.cleanLabel}`,
    c.document.cleanSentence,
    `${c.document.stamp.line1}. ${c.document.stamp.line2}.`,
    `### ${c.steps[14].kicker}`,
    c.steps[14].body,
    `### ${c.steps[15].kicker}`,
    `#### ${c.world.head.left}`,
    c.steps[15].body,
    c.world.legend
      .map((item) => `- ${item.language} (${item.gloss})`)
      .join("\n"),
    `### ${c.steps[16].kicker}`,
    c.steps[16].body,
  ];
  return sections.join("\n\n");
}
