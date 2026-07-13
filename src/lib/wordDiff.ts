/**
 * Word-level diff between two structurally parallel markdown documents
 * (the German and Alman renderings of the same text). Produces a merged
 * markdown document in which changed words are wrapped in <del>/<ins>,
 * so the reader can see exactly what the simplification touched.
 *
 * Newlines are kept as their own tokens so the markdown block structure
 * (headings, list items, paragraph breaks) survives reassembly.
 */

const NEWLINE = "\n";

function tokenize(text: string): string[] {
  const tokens: string[] = [];
  for (const part of text.split(/(\n)/)) {
    if (part === NEWLINE) {
      tokens.push(NEWLINE);
    } else {
      for (const word of part.split(/[^\S\n]+/)) {
        if (word) tokens.push(word);
      }
    }
  }
  return tokens;
}

/** Longest-common-subsequence table over the two token arrays. */
function lcs(a: string[], b: string[]): number[][] {
  const table: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] =
        a[i] === b[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  return table;
}

function assemble(parts: string[]): string {
  let out = "";
  for (const part of parts) {
    if (part === NEWLINE) {
      out += NEWLINE;
    } else {
      if (out !== "" && !out.endsWith(NEWLINE)) out += " ";
      out += part;
    }
  }
  return out;
}

export function diffMarkdown(before: string, after: string): string {
  const a = tokenize(before);
  const b = tokenize(after);
  const table = lcs(a, b);

  const parts: string[] = [];
  let del: string[] = [];
  let ins: string[] = [];

  const flush = () => {
    if (del.length) parts.push(`<del>${del.join(" ")}</del>`);
    if (ins.length) parts.push(`<ins>${ins.join(" ")}</ins>`);
    del = [];
    ins = [];
  };

  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      flush();
      parts.push(a[i]);
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      if (a[i] !== NEWLINE) del.push(a[i]);
      i++;
    } else {
      if (b[j] !== NEWLINE) ins.push(b[j]);
      j++;
    }
  }
  while (i < a.length) {
    if (a[i] !== NEWLINE) del.push(a[i]);
    i++;
  }
  while (j < b.length) {
    if (b[j] !== NEWLINE) ins.push(b[j]);
    j++;
  }
  flush();

  return assemble(parts);
}
