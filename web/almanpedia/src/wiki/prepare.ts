import { normalizeParsoidLayout, type WikiLayoutDiagnostic } from "./layout";
import { rewriteArticleDom } from "./rewrite";
import { sanitizeParsoidBody } from "./sanitize";

export interface PrepareParsoidBodyOptions {
  onLayoutDiagnostic?: (diagnostic: WikiLayoutDiagnostic) => void;
}

/** The only path from untrusted Parsoid HTML to an Almanpedia article fragment. */
export function prepareParsoidBody(html: string, options: PrepareParsoidBodyOptions = {}): DocumentFragment {
  const fragment = sanitizeParsoidBody(html);
  for (const diagnostic of normalizeParsoidLayout(fragment)) options.onLayoutDiagnostic?.(diagnostic);
  rewriteArticleDom(fragment);
  return fragment;
}
