/**
 * Word-level diff between two structurally parallel markdown documents
 * (the German and Alman renderings of the same text). Produces a merged
 * markdown document in which changed words are wrapped in <del>/<ins>,
 * so the reader can see exactly what the simplification touched.
 *
 * The diff runs in two levels. Documents are first split into blank-line
 * separated blocks and aligned block-by-block; word-level diffing then
 * happens only inside blocks that differ. This keeps memory bounded
 * (a single LCS table over a whole document grows quadratically, which
 * for the ~8k-word specification would need tens of millions of cells)
 * while producing exactly the same output for parallel documents.
 *
 * Within a block, newlines are kept as their own tokens so multi-line
 * block structure (tables, list items) survives reassembly.
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

/** Word-level del/ins merge of two markdown blocks. */
function diffWords(before: string, after: string): string {
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

/** A block removed or added wholesale, marked up line by line so that
 *  multi-line structure (e.g. table rows) is not collapsed. */
const wrapBlock = (block: string, tag: "del" | "ins"): string =>
  block
    .split(NEWLINE)
    .map((line) => (line.trim() ? `<${tag}>${line}</${tag}>` : line))
    .join(NEWLINE);

const splitBlocks = (text: string): string[] =>
  text.split(/\n[ \t]*\n+/).filter((block) => block.trim() !== "");

export function diffMarkdown(before: string, after: string): string {
  const a = splitBlocks(before);
  const b = splitBlocks(after);
  const table = lcs(a, b);

  const out: string[] = [];
  let removed: string[] = [];
  let added: string[] = [];

  // A run of differing blocks is paired index-wise: for parallel
  // documents (same block count, same structure) every removed block has
  // exactly one added counterpart, and this degrades gracefully when
  // they ever fall out of step.
  const flush = () => {
    const paired = Math.min(removed.length, added.length);
    for (let k = 0; k < paired; k++) {
      out.push(diffWords(removed[k], added[k]));
    }
    for (let k = paired; k < removed.length; k++) {
      out.push(wrapBlock(removed[k], "del"));
    }
    for (let k = paired; k < added.length; k++) {
      out.push(wrapBlock(added[k], "ins"));
    }
    removed = [];
    added = [];
  };

  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      flush();
      out.push(a[i]);
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      removed.push(a[i]);
      i++;
    } else {
      added.push(b[j]);
      j++;
    }
  }
  removed.push(...a.slice(i));
  added.push(...b.slice(j));
  flush();

  return out.join("\n\n");
}
