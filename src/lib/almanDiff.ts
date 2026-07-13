// Build-time rendering for the Alman diff view: the merged del/ins
// markdown from wordDiff is rendered to HTML with the site's shared
// markdown pipeline. The processor is created once per build and reused
// across every page that shows a diff.

import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { markdownConfig } from "../../markdown.config.mjs";
import { diffMarkdown } from "./wordDiff";

type Processor = Awaited<ReturnType<typeof createMarkdownProcessor>>;

let processorPromise: Promise<Processor> | undefined;

/**
 * HTML for the word-level diff of an Alman document against its
 * structurally parallel Standard German source.
 */
export async function renderAlmanDiff(
  german: string,
  alman: string,
): Promise<string> {
  processorPromise ??= createMarkdownProcessor(markdownConfig);
  const processor = await processorPromise;
  return (await processor.render(diffMarkdown(german, alman))).code;
}
