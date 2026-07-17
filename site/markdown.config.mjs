// Shared markdown pipeline options. Imported by astro.config.mjs for the
// site-wide markdown processing, and by pages that render markdown
// programmatically (the Alman/German diff view), so both stay in sync.
import remarkMath from "remark-math";
import remarkSmartypants from "remark-smartypants";
import rehypeKatex from "rehype-katex";
import { remarkHeadingId } from "remark-custom-heading-id";

export const markdownConfig = {
  // remarkHeadingId handles the kramdown-style `{#id}` heading anchors
  // used by the generated spec document (spec/generated/spec.md).
  // "oldschool" dashes match kramdown: -- becomes en dash, --- em dash.
  remarkPlugins: [
    remarkMath,
    remarkHeadingId,
    [remarkSmartypants, { dashes: "oldschool" }],
  ],
  rehypePlugins: [rehypeKatex],
};
